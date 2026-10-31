import asyncHandler from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import type { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";

const getJwtSecret = () => process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET || "default_access_secret";

const authMiddleware = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken: any = jwt.verify(token, getJwtSecret());

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    req.user = user;
    next();
  } catch (error: any) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

const optionalAuthMiddleware = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return next();
    }

    const decodedToken: any = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    if (user) {
      req.user = user;
    }
  } catch (_error) {
    // Ignore invalid token for optional auth
  }
  next();
});

export { authMiddleware, optionalAuthMiddleware };
