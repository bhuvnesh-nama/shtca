import { Router } from "express";
import {
  registerUser,
  loginUser,
  adminLoginUser,
  createAuthorityAccount,
  logoutUser,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  generateEmailVerificationToken,
  verifyEmail,
  refreshAccessToken,
} from "../controllers/auth.controller";
import { validate } from "../middlewares/validation.middleware";
import { registerSchema, loginSchema, forgotPasswordSchema } from "../schemas/auth.schema";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.route("/register").post(validate(registerSchema), registerUser);
router.route("/login").post(validate(loginSchema), loginUser);
router.route("/admin-login").post(validate(loginSchema), adminLoginUser);
router.route("/authority/register").post(createAuthorityAccount);
router.route("/logout").post(authMiddleware, logoutUser);
router.route("/current-user").get(authMiddleware, getCurrentUser);
router.route("/forgot-password").post(validate(forgotPasswordSchema), forgotPassword);
router.route("/reset-password/:token").post(resetPassword);
router.route("/generate-email-verification-token").post(authMiddleware, generateEmailVerificationToken);
router.route("/verify-user-email").post(authMiddleware, verifyEmail);
router.route("/refresh-token").post(refreshAccessToken);

export default router;
