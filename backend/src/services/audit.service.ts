import { Request } from "express";
import { Types } from "mongoose";
import { AuditLogModel } from "../models/auditLog.model";
import { logger } from "../utils/logger";

/*
  Persists a security-relevant event to the audit log. Fire-and-forget: an audit
  write must never break the request it is recording, so failures are logged and
  swallowed. Never pass secrets/passwords/tokens in `meta`.
*/
export function recordAudit(
  req: Request,
  action: string,
  opts: { userId?: string; meta?: Record<string, unknown> } = {}
): void {
  const doc = {
    userId: opts.userId ? new Types.ObjectId(opts.userId) : undefined,
    action,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    meta: opts.meta,
  };
  AuditLogModel.create(doc).catch((err) => {
    logger.error("Failed to write audit log", {
      action,
      error: (err as Error).message,
    });
  });
}
