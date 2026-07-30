import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { validate } from "../middlewares/validate";
import { UpdateProfileDto } from "../dtos/user.dto";
import { ChangePasswordDto } from "../dtos/password.dto";

const router = Router();

router.get("/me/profile", requireAuth, userController.getProfile);
router.patch(
  "/me/profile",
  requireAuth,
  validate(UpdateProfileDto),
  userController.updateProfile
);

router.patch(
  "/me/password",
  requireAuth,
  validate(ChangePasswordDto),
  userController.changePassword
);

router.get("/me/sessions", requireAuth, userController.listSessions);
router.delete("/me/sessions", requireAuth, userController.revokeOtherSessions);

export default router;
