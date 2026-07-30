import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";
import { sessionService } from "../services/session.service";
import { recordAudit } from "../services/audit.service";
import { emailAuthService } from "../services/emailAuth.service";

async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.getProfile(req.session.userId!);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.updateProfile(req.session.userId!, req.body);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.session.userId!;
    await userService.changePassword(
      userId,
      req.body.currentPassword,
      req.body.newPassword
    );
    // Force other devices to re-authenticate with the new password.
    const revoked = await sessionService.revokeOthers(userId, req.sessionID);
    recordAudit(req, "user.password_changed", { userId, meta: { revoked } });
    void emailAuthService
      .notify(userId, "your password was changed")
      .catch(() => undefined);
    res.status(200).json({ revokedSessions: revoked });
  } catch (err) {
    next(err);
  }
}

async function listSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const list = await sessionService.listForUser(
      req.session.userId!,
      req.sessionID
    );
    res.status(200).json({ sessions: list });
  } catch (err) {
    next(err);
  }
}

async function revokeOtherSessions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.session.userId!;
    const revoked = await sessionService.revokeOthers(userId, req.sessionID);
    recordAudit(req, "user.sessions_revoked", { userId, meta: { revoked } });
    res.status(200).json({ revoked });
  } catch (err) {
    next(err);
  }
}

export const userController = {
  getProfile,
  updateProfile,
  changePassword,
  listSessions,
  revokeOtherSessions,
};
