import crypto from "crypto";
import { env } from "../config/env";

/*
  Encrypts the TOTP secret at rest with AES-256-GCM. The 32-byte key is derived
  from SESSION_SECRET via scrypt, so no extra env var is required. Format stored
  in the DB: `${ivHex}:${authTagHex}:${cipherHex}`.

  (For key rotation later, prepend a key id/version to this string.)
*/
const KEY = crypto.scryptSync(env.SESSION_SECRET, "gadgetstore-2fa-secret", 32);

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

export function decryptSecret(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}
