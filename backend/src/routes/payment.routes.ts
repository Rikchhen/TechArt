import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { validate } from "../middlewares/validate";
import { InitiatePaymentDto, VerifyPaymentDto } from "../dtos/payment.dto";

const router = Router();

// Public: lets the SPA know whether to show the Khalti option.
router.get("/config", paymentController.config);

router.post(
  "/khalti/initiate",
  requireAuth,
  validate(InitiatePaymentDto),
  paymentController.initiate
);
router.post(
  "/khalti/verify",
  requireAuth,
  validate(VerifyPaymentDto),
  paymentController.verify
);

export default router;
