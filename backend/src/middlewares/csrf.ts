import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

/*
  CSRF protection via the double-submit-cookie pattern.

  - A random token is stored in a `csrfToken` cookie AND must be echoed in the
    `x-csrf-token` header on every state-changing request. The server requires
    the two to match.
  - This is safe because a cross-site attacker can neither read the victim's
    cookie (same-origin policy) nor set a custom request header cross-origin
    (blocked by CORS). It is independent of the session, so it survives the
    session regeneration that happens on login.
  - Pairs with the existing SameSite=Lax cookie and Origin check (defense in
    depth). Safe methods (GET/HEAD/OPTIONS) are never blocked.
*/
export const CSRF_COOKIE = "csrfToken";
const CSRF_HEADER = "x-csrf-token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return undefined;
}

function setCsrfCookie(res: Response, token: string) {
  res.cookie(CSRF_COOKIE, token, {
    // Readable by the SPA so it can echo the value in the header.
    httpOnly: false,
    sameSite: "lax",
    secure: env.COOKIE_SECURE,
    path: "/",
    maxAge: 1000 * 60 * 60 * 4,
  });
}

// Constant-time compare to avoid leaking match progress via timing.
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  let token = readCookie(req.headers.cookie, CSRF_COOKIE);
  if (!token) {
    token = crypto.randomBytes(32).toString("hex");
    setCsrfCookie(res, token);
  }
  // Exposed for the token-issuing endpoint.
  (req as Request & { csrfToken?: string }).csrfToken = token;

  if (SAFE_METHODS.has(req.method.toUpperCase())) return next();

  const header = req.get(CSRF_HEADER);
  if (!header || !safeEqual(header, token)) {
    return res.status(403).json({ message: "Invalid or missing CSRF token" });
  }
  next();
}
