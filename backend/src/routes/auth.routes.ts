import { Router } from "express";
import {
	logout,
	me,
	refresh,
	requestLoginOtp,
	requestSignupOtp,
	verifyLoginOtp,
	verifySignupOtp,
	requestPasswordResetOtp,
	resetPassword,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/signup/request-otp", requestSignupOtp);
router.post("/signup/verify-otp", verifySignupOtp);
router.post("/login/request-otp", requestLoginOtp);
router.post("/login/verify-otp", verifyLoginOtp);
router.post("/password-reset/request-otp", requestPasswordResetOtp);
router.post("/password-reset/reset", resetPassword);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

export default router;
