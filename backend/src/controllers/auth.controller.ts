import { cookieOptions } from "../config/constants";
import type { Request, Response } from "express";
import ApiError from "../utils/ApiError";
import { generateSixDigitsOTP } from "../config/OTPGenerator";
import sendMail from "../config/mailer";
import User from "../models/user.model";
import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler";
import ApiResponse from "../utils/ApiResponse";
import crypto from "crypto";

// ----------------- Helper -----------------
const generateAccessAndRefereshTokens = async (userId: string) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error generating access and refresh tokens");
  }
};

// ----------------- Auth Logic -----------------

// REGISTER
const registerUser = asyncHandler(async (req, res) => {
  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) throw new ApiError(400, "User already exists");

  const user = new User(req.body);
  await user.save();

  return res
    .status(201)
    .json(new ApiResponse(200, "User registered successfully", user));
});

// LOGIN
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(401, "User not found with this email");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError(401, "Invalid credentials");

  user.lastLogin = new Date();

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie("accessToken", accessToken, cookieOptions);
  res.cookie("refreshToken", refreshToken, cookieOptions);

  return res
    .status(200)
    .json(
      new ApiResponse(200, "User logged in successfully", {
        user,
        accessToken,
        refreshToken,
      })
    );
});

// LOGOUT
const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  await User.findByIdAndUpdate(userId, { refreshToken: null });

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, "User logged out successfully", {}));
});

// CURRENT USER
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, "User fetched successfully", req.user));
});

// FORGOT PASSWORD
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  const resetToken = user.generateResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `https://${process.env.DOMAIN_NAME}:5173/reset-password/${resetToken}`;

  try {
    sendMail(user.email, "Reset Your Password", "forgot-password-email", {
      name: user.name,
      resetLink: resetURL,
      year: new Date().getFullYear(),
    });
  } catch (error) {
    user.forgotPasswordToken = undefined;
    user.forgotPasswordTokenExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(500, "Email could not be sent");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Reset password email sent successfully"));
});

// RESET PASSWORD
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token || !password)
    throw new ApiError(400, "Token and password are required");

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    forgotPasswordToken: hashedToken,
    forgotPasswordTokenExpiry: { $gt: Date.now() },
  });

  if (!user) throw new ApiError(400, "Invalid or expired token");

  user.password = password;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordTokenExpiry = undefined;

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Password reset successfully"));
});

// EMAIL VERIFICATION TOKEN
const generateEmailVerificationToken = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) throw new ApiError(404, "User not found");
    if (user.isEmailVerified)
      throw new ApiError(400, "User already verified");

    const otp = generateSixDigitsOTP();
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    user.emailVerificationToken = otp;
    user.emailVerificationTokenExpiry = expiresAt;
    await user.save({ validateBeforeSave: false });

    try {
      sendMail(
        user.email,
        "Verification Token",
        "verify-email-code",
        { name: user.name, otpDigits: otp.split("") }
      );
      return res
        .status(200)
        .json(new ApiResponse(200, "Verification token sent to email"));
    } catch (error) {
      user.emailVerificationToken = "";
      user.emailVerificationTokenExpiry = new Date();
      await user.save({ validateBeforeSave: false });
      throw new ApiError(500, "Email could not be sent");
    }
  }
);

// VERIFY EMAIL
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const userId = req.user._id;

  if (!token) throw new ApiError(400, "Invalid Token");

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  if (user.isEmailVerified)
    throw new ApiError(400, "Email already verified");

  const verifiedUser = await User.findOneAndUpdate(
    { _id: userId, emailVerificationToken: token },
    {
      $set: {
        isEmailVerified: true,
        emailVerificationToken: 0,
        emailVerificationTokenExpiry: new Date(),
      },
    },
    { new: true }
  );

  if (!verifiedUser)
    throw new ApiError(400, "Failed to verify user email");

  sendMail(
    verifiedUser.email,
    "Email verified successfully",
    "email-verified-successfully",
    { name: verifiedUser.name }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "User verified successfully"));
});

// REFRESH TOKEN
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken)
    throw new ApiError(401, "Unauthorized request");

  try {
    const decodedToken: any = jwt.verify(
      incomingRefreshToken.toString(),
      process.env.JWT_SECRET!
    );

    const user: any = await User.findById(decodedToken?._id);
    if (!user) throw new ApiError(401, "Invalid refresh token");

    if (incomingRefreshToken !== user.refreshToken)
      throw new ApiError(401, "Refresh token expired or invalid");

    const { accessToken, refreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json(
        new ApiResponse(200, "Access token refreshed", {
          accessToken,
          refreshToken,
        })
      );
  } catch (error: any) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  verifyEmail,
  generateEmailVerificationToken,
  refreshAccessToken,
};
