import { Request, Response, NextFunction } from "express";
import { authService, toSafeUser } from "../services/auth.service";
import { twoFactorService } from "../services/twofa.service";
import { userRepository } from "../repositories/user.repository";
import { recordAudit } from "../services/audit.service";
import { recordFailure, resetAttempts } from "../utils/loginAttempts";
import { emailAuthService } from "../services/emailAuth.service";
import { env } from "../config/env";
import { SESSION_COOKIE_NAME } from "../config/session";
import { SafeUser } from "../types/user.types";
import { AppError } from "../utils/appError";
import crypto from "crypto";
import { isRecaptchaEnabled, verifyRecaptcha } from "../services/recaptcha.service";

// Regenerate the session id (anti-fixation) and mark it fully authenticated.
function establishSession(req: Request, user: SafeUser): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = user.id;
      req.session.role = user.role;
      req.session.userAgent = req.get("user-agent");
      req.session.ip = req.ip;
      req.session.createdAt = Date.now();
      resolve();
    });
  });
}

async function register(req: Request, res: Response, next: NextFunction) {
  try {
    await verifyRecaptcha(req.body.recaptchaToken);
    const user = await authService.register(req.body);
    recordAudit(req, "auth.register", { userId: user.id });
    // Fire-and-forget: a mail hiccup must not fail the registration itself.
    void emailAuthService.sendVerification(user.id).catch(() => undefined);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

async function login(req: Request, res: Response, next: NextFunction) {
  try {
    await verifyRecaptcha(req.body.recaptchaToken);
    const user = await authService.login(req.body);

    // Optional gate: refuse sign-in until the address is confirmed.
    if (env.REQUIRE_EMAIL_VERIFICATION && !user.emailVerified) {
      recordAudit(req, "auth.login.blocked_unverified", { userId: user.id });
      throw new AppError(
        "Please verify your email address before signing in. Check your inbox for the link.",
        403
      );
    }

    // If the account has 2FA, park a pending challenge instead of authenticating.
    if (user.twoFactorEnabled) {
      req.session.pending2faUserId = user.id;
      req.session.pending2faRole = user.role;
      recordAudit(req, "auth.login.2fa_challenge", { userId: user.id });
      return res.status(200).json({ twoFactorRequired: true });
    }

    await establishSession(req, user);
    recordAudit(req, "auth.login", { userId: user.id });
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

function googleEnabled() {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

function googleRedirectUri() {
  return env.GOOGLE_REDIRECT_URI ?? new URL("/api/auth/google/callback", env.APP_URL).toString();
}

function authConfig(_req: Request, res: Response) {
  res.json({
    googleEnabled: googleEnabled(),
    recaptchaSiteKey: isRecaptchaEnabled() ? env.RECAPTCHA_SITE_KEY : undefined,
  });
}

function startGoogle(req: Request, res: Response, next: NextFunction) {
  try {
    if (!googleEnabled()) throw new AppError("Google sign-in is not configured", 503);
    const state = crypto.randomBytes(32).toString("hex");
    (req.session as typeof req.session & { googleOAuthState?: string }).googleOAuthState = state;
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID!,
      redirect_uri: googleRedirectUri(),
      response_type: "code",
      scope: "openid email profile",
      state,
      prompt: "select_account",
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  } catch (err) {
    next(err);
  }
}

async function googleCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const session = req.session as typeof req.session & { googleOAuthState?: string };
    if (!code || !state || state !== session.googleOAuthState) {
      throw new AppError("Invalid Google sign-in request", 400);
    }
    delete session.googleOAuthState;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID!,
        client_secret: env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: googleRedirectUri(),
        grant_type: "authorization_code",
      }),
    });
    const token = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenResponse.ok || !token.access_token) throw new AppError("Google sign-in failed", 502);

    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    const profile = (await profileResponse.json()) as {
      sub?: string; email?: string; email_verified?: boolean; name?: string;
    };
    if (!profileResponse.ok || !profile.sub || !profile.email || !profile.email_verified) {
      throw new AppError("Google did not provide a verified email address", 400);
    }
    const user = await authService.loginWithGoogle({
      id: profile.sub,
      email: profile.email.toLowerCase(),
      name: profile.name?.trim() || profile.email.split("@")[0],
    });
    await establishSession(req, user);
    recordAudit(req, "auth.google_login", { userId: user.id });
    res.redirect(env.APP_URL);
  } catch (err) {
    next(err);
  }
}

async function twoFactorLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const pendingId = req.session.pending2faUserId;
    if (!pendingId) {
      throw new AppError("No pending two-factor challenge", 400);
    }

    const ok = await twoFactorService.verifyForLogin(pendingId, req.body.code);
    if (!ok) {
      const user = await userRepository.findById(pendingId);
      if (user) recordFailure(user.email);
      recordAudit(req, "auth.login.2fa_failed", { userId: pendingId });
      throw new AppError("Invalid authentication code", 401);
    }

    const user = await userRepository.findById(pendingId);
    if (!user) throw new AppError("User not found", 404);

    const safe = toSafeUser(user);
    await establishSession(req, safe);
    resetAttempts(user.email);
    recordAudit(req, "auth.login.2fa_success", { userId: safe.id });
    res.status(200).json({ user: safe });
  } catch (err) {
    next(err);
  }
}

function logout(req: Request, res: Response, next: NextFunction) {
  const userId = req.session.userId;
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie(SESSION_COOKIE_NAME);
    recordAudit(req, "auth.logout", { userId });
    res.status(204).end();
  });
}

async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await userRepository.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    res.status(200).json({ user: toSafeUser(user) });
  } catch (err) {
    next(err);
  }
}

export const authController = {
  authConfig, startGoogle, googleCallback, register, login, twoFactorLogin, logout, me,
};
