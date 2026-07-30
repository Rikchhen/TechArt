export type Role = "customer" | "admin";

export interface BackupCode {
  hash: string;
  used: boolean;
}

export interface IUser {
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  role: Role;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  // AES-GCM encrypted TOTP secret; only set while 2FA is enabled.
  twoFactorSecret?: string;
  backupCodes?: BackupCode[];
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
}
