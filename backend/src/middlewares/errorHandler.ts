import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { AppError } from "../utils/appError";
import { env } from "../config/env";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ message: err.message });
  }

  // Upload problems (too large, too many files) are client errors, not 500s.
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Image is too large (max 5 MB)"
        : "Image upload failed";
    return res.status(400).json({ message });
  }

  const isDev = env.NODE_ENV !== "production";
  if (isDev) {
    console.error(err);
  }

  const message =
    isDev && err instanceof Error ? err.message : "Internal server error";

  res.status(500).json({ message });
}
