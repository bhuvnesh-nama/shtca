import { Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  lastLogin?: Date;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationTokenExpiry?: Date;
  forgotPasswordToken?: string | undefined;
  forgotPasswordTokenExpiry?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
  avatarUrl?: string;
  refreshToken?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  generateResetPasswordToken(): string;
}
