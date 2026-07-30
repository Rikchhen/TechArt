import { Request, Response, NextFunction } from "express";
import { emailAuthService } from "../services/emailAuth.service";
import { recordAudit } from "../services/audit.service";

async function sendVerification(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await emailAuthService.sendVerification(req.session.userId!);
    recordAudit(req, "email.verification_sent", { userId: req.session.userId });
    res.status(202).json({ message: "Verification email sent" });
  } catch (err) {
    next(err);
  }
}

async function verifyByToken(req: Request, res: Response, next: NextFunction) {
  try {
    await emailAuthService.verifyByToken(req.body.token);
    recordAudit(req, "email.verified", { meta: { via: "link" } });
    res.status(200).json({ message: "Email verified" });
  } catch (err) {
    next(err);
  }
}

async function verifyByCode(req: Request, res: Response, next: NextFunction) {
  try {
    await emailAuthService.verifyByCode(req.body.email, req.body.code);
    recordAudit(req, "email.verified", { meta: { via: "otp" } });
    res.status(200).json({ message: "Email verified" });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    await emailAuthService.requestPasswordReset(req.body.email);
    recordAudit(req, "password.reset_requested");
    // Always the same response — never reveal whether the account exists.
    res.status(202).json({
      message:
        "If an account exists for that address, a reset link is on its way.",
    });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    await emailAuthService.resetPassword(req.body.token, req.body.newPassword);
    recordAudit(req, "password.reset_completed");
    res.status(200).json({ message: "Password updated. Please sign in." });
  } catch (err) {
    next(err);
  }
}

export const emailAuthController = {
  sendVerification,
  verifyByToken,
  verifyByCode,
  forgotPassword,
  resetPassword,
};
