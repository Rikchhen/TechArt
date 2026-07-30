import { UserModel } from "../models/user.model";
import { IUser } from "../types/user.types";

type CreateUserData = Pick<IUser, "name" | "email" | "passwordHash" | "googleId" | "role"> &
  Partial<Pick<IUser, "emailVerified">>;
type UpdateUserFields = Partial<Pick<IUser, "name" | "googleId" | "emailVerified">>;

export const userRepository = {
  findById(id: string) {
    return UserModel.findById(id);
  },

  findByEmail(email: string, withPassword = false) {
    const query = UserModel.findOne({ email });
    return withPassword ? query.select("+passwordHash") : query;
  },

  findByGoogleId(googleId: string) {
    return UserModel.findOne({ googleId }).select("+googleId");
  },

  // Includes the encrypted TOTP secret + backup codes (both select:false).
  findByIdWithSecret(id: string) {
    return UserModel.findById(id).select("+twoFactorSecret +backupCodes");
  },

  // Includes the password hash for re-authentication (password change, etc.).
  findByIdWithPassword(id: string) {
    return UserModel.findById(id).select("+passwordHash");
  },

  create(data: CreateUserData) {
    return UserModel.create(data);
  },

  updateById(id: string, fields: UpdateUserFields) {
    return UserModel.findByIdAndUpdate(
      id,
      { $set: fields },
      { new: true, runValidators: true }
    );
  },

  deleteById(id: string) {
    return UserModel.findByIdAndDelete(id);
  },
};
