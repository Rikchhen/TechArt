import "express-session";
import { Role } from "../user.types";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    role?: Role;
    // Login metadata for the active-sessions list.
    userAgent?: string;
    ip?: string;
    createdAt?: number;
    // Set after a correct password when the account has 2FA — the session is
    // not fully authenticated until the TOTP/backup code is verified.
    pending2faUserId?: string;
    pending2faRole?: Role;
  }
}
