import { Router } from "express";
import { uploadController } from "../controllers/upload.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { uploadProductImage } from "../middlewares/upload";

const router = Router();

// Admin-only: accepts multipart/form-data with a single `image` field.
router.post(
  "/image",
  requireAuth,
  requireRole("admin"),
  uploadProductImage,
  uploadController.uploadImage
);

export default router;
