import express from "express";
import { login, logout, signup, verifyEmail, forgotPassword, resetPassword, resendOtp } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", signup);

router.post("/verify-email", verifyEmail);

router.post("/resend-otp", resendOtp);

router.post("/login", login);

router.post("/logout", logout);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password/:token", resetPassword);

export default router;
