import { Request, Response, NextFunction } from "express";
import { twoFactorService } from "../services/twofa.service";
import { recordAudit } from "../services/audit.service";
import { emailAuthService } from "../services/emailAuth.service";

async function setup(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await twoFactorService.setup(req.session.userId!);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function enable(req: Request, res: Response, next: NextFunction) {
  try {
    const { backupCodes } = await twoFactorService.enable(
      req.session.userId!,
      req.body.code
    );
    recordAudit(req, "2fa.enabled", { userId: req.session.userId });
    void emailAuthService
      .notify(req.session.userId!, "two-factor authentication was enabled")
      .catch(() => undefined);
    res.status(200).json({ backupCodes });
  } catch (err) {
    next(err);
  }
}

async function disable(req: Request, res: Response, next: NextFunction) {
  try {
    await twoFactorService.disable(req.session.userId!, req.body.password);
    recordAudit(req, "2fa.disabled", { userId: req.session.userId });
    void emailAuthService
      .notify(req.session.userId!, "two-factor authentication was disabled")
      .catch(() => undefined);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export const twoFactorController = { setup, enable, disable };
