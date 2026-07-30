import { Schema, model, Types } from "mongoose";

export type TokenType = "email_verify" | "password_reset";

export interface IToken {
  userId: Types.ObjectId;
  type: TokenType;
  // Only hashes are stored — a database leak can't be replayed as a live token.
  tokenHash: string;
  codeHash?: string;
  expiresAt: Date;
  usedAt?: Date;
  attempts: number;
}

const tokenSchema = new Schema<IToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["email_verify", "password_reset"],
      required: true,
    },
    tokenHash: { type: String, required: true, index: true },
    codeHash: { type: String },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Mongo removes expired documents automatically.
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const TokenModel = model<IToken>("Token", tokenSchema);
