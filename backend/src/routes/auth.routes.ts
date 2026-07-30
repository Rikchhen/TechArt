import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { twoFactorController } from "../controllers/twofa.controller";
import { validate } from "../middlewares/validate";
import { requireAuth } from "../middlewares/requireAuth";
import { authLimiter } from "../middlewares/rateLimit";
import { emailAuthController } from "../controllers/emailAuth.controller";
import { RegisterDto, LoginDto } from "../dtos/auth.dto";
import { TwoFactorCodeDto, DisableTwoFactorDto } from "../dtos/twofa.dto";
import {
  EmailOnlyDto,
  VerifyTokenDto,
  VerifyCodeDto,
  ResetPasswordDto,
} from "../dtos/email.dto";

const router = Router();

router.get("/config", authController.authConfig);
router.get("/google", authController.startGoogle);
router.get("/google/callback", authController.googleCallback);
router.post("/register", authLimiter, validate(RegisterDto), authController.register);
router.post("/login", authLimiter, validate(LoginDto), authController.login);
router.post(
  "/login/2fa",
  authLimiter,
  validate(TwoFactorCodeDto),
  authController.twoFactorLogin
);
router.post("/logout", requireAuth, authController.logout);
router.get("/me", authController.me);

// ---- Email verification & password reset (rate-limited: they send mail) ----
router.post(
  "/verify-email/send",
  authLimiter,
  requireAuth,
  emailAuthController.sendVerification
);
router.post(
  "/verify-email",
  authLimiter,
  validate(VerifyTokenDto),
  emailAuthController.verifyByToken
);
router.post(
  "/verify-email/code",
  authLimiter,
  validate(VerifyCodeDto),
  emailAuthController.verifyByCode
);
router.post(
  "/forgot-password",
  authLimiter,
  validate(EmailOnlyDto),
  emailAuthController.forgotPassword
);
router.post(
  "/reset-password",
  authLimiter,
  validate(ResetPasswordDto),
  emailAuthController.resetPassword
);

// Two-factor enrollment management (all require an authenticated session).
router.post("/2fa/setup", requireAuth, twoFactorController.setup);
router.post(
  "/2fa/enable",
  requireAuth,
  validate(TwoFactorCodeDto),
  twoFactorController.enable
);
router.post(
  "/2fa/disable",
  requireAuth,
  validate(DisableTwoFactorDto),
  twoFactorController.disable
);

export default router;
