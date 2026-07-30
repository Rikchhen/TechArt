import { Schema, model, Types } from "mongoose";

export interface IAuditLog {
  userId?: Types.ObjectId;
  action: string;
  ip?: string;
  userAgent?: string;
  meta?: Record<string, unknown>;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true, index: true },
    ip: { type: String },
    userAgent: { type: String },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLogModel = model<IAuditLog>("AuditLog", auditLogSchema);
