import { NextFunction, Request, Response } from "express";
import { paymentService } from "../services/payment.service";
import { recordAudit } from "../services/audit.service";

function config(_req: Request, res: Response) {
  res.status(200).json({ khaltiEnabled: paymentService.isKhaltiEnabled() });
}

async function initiate(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await paymentService.initiateKhalti(
      req.body.orderId,
      req.session.userId!
    );
    recordAudit(req, "payment.khalti_initiated", {
      userId: req.session.userId,
      meta: { orderId: req.body.orderId },
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function verify(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await paymentService.verifyKhalti(
      req.body.pidx,
      req.session.userId!
    );
    recordAudit(req, "payment.khalti_verified", {
      userId: req.session.userId,
      meta: { status: result.status },
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export const paymentController = { config, initiate, verify };
