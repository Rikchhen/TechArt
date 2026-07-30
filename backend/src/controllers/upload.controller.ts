import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/appError";
import { recordAudit } from "../services/audit.service";

async function uploadImage(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new AppError("No image file was uploaded", 400);
    }
    // Served statically from /uploads (see app.ts). Relative so it works in any
    // environment without baking in a host.
    const url = `/uploads/${req.file.filename}`;
    recordAudit(req, "admin.image_uploaded", {
      userId: req.session.userId,
      meta: { file: req.file.filename, size: req.file.size },
    });
    res.status(201).json({ url });
  } catch (err) {
    next(err);
  }
}

export const uploadController = { uploadImage };
