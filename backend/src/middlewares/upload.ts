import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import { AppError } from "../utils/appError";

/*
  Product image uploads.

  Safety measures:
  - Only a fixed allow-list of image MIME types is accepted.
  - The stored filename is random and the extension is derived from the
    allow-list (never from user input), so a request can't traverse paths or
    smuggle an executable extension.
  - Size capped at 5 MB, one file per request.
  Routes using this must still be admin-gated.
*/
export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = ALLOWED_TYPES.get(file.mimetype) ?? ".bin";
    cb(null, `${crypto.randomBytes(16).toString("hex")}${ext}`);
  },
});

export const uploadProductImage = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      return cb(
        new AppError("Only JPEG, PNG, WebP or GIF images are allowed", 400)
      );
    }
    cb(null, true);
  },
}).single("image");
