import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

/*
  CSRF defense-in-depth via Origin/Referer verification.

  The SameSite=Lax session cookie already blocks cross-site state-changing
  requests. This adds a second, independent layer: for mutating methods, if the
  browser sent an Origin (or Referer) it MUST match CLIENT_ORIGIN.

  Requests with no Origin/Referer (curl, Postman, requests.http, server-to-server)
  are allowed through — a browser-driven CSRF attack always carries an Origin, so
  this blocks the attack without breaking non-browser API testing.
*/
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function verifyOrigin(req: Request, res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method.toUpperCase())) return next();

  const allowed = env.CLIENT_ORIGIN;
  const origin = req.get("origin");
  if (origin) {
    if (origin === allowed) return next();
    return res.status(403).json({ message: "Cross-origin request blocked" });
  }

  const referer = req.get("referer");
  if (referer) {
    try {
      if (new URL(referer).origin === allowed) return next();
    } catch {
      // fall through to reject a malformed Referer
    }
    return res.status(403).json({ message: "Cross-origin request blocked" });
  }

  // No Origin/Referer header — not a browser CSRF vector.
  return next();
}
