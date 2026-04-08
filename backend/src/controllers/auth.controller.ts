import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env, isAdminEmail } from "../config/env.js";
import { OtpChallengeModel } from "../models/OtpChallenge.model.js";
import { UserModel } from "../models/User.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/appError.js";
import { generateOtp, hashOtp, verifyOtpHash } from "../utils/otp.js";
import { signAccessToken, signRefreshToken } from "../utils/jwt.js";
import { sendOtpEmail } from "../services/mailer.service.js";
import { requestLoginOtpSchema, requestSignupOtpSchema, verifyOtpSchema, requestPasswordResetOtpSchema, resetPasswordSchema } from "../validators/auth.validator.js";
import { updateProfileSchema } from "../validators/ride.validator.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";

const authTokens = (userId: string, email: string, role: "user" | "admin") => ({
  accessToken: signAccessToken({ sub: userId, email, role }),
  refreshToken: signRefreshToken({ sub: userId, email, role }),
});

const refreshCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  path: "/api/v1",
};

const accessCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  path: "/",
};

const cookieExpires = () => {
  const days = 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

const accessCookieExpires = () => {
  const minutes = 15;
  return new Date(Date.now() + minutes * 60 * 1000);
};

const sendAuthResponse = (res: Response, user: { _id: unknown; name: string; email: string; phone: string; branch: string; year: string; role: "user" | "admin"; profileImageUrl?: string }) => {
  const tokens = authTokens(String(user._id), user.email, user.role);
  res.cookie("accessToken", tokens.accessToken, {
    ...accessCookieOptions,
    expires: accessCookieExpires(),
  });
  res.cookie("refreshToken", tokens.refreshToken, {
    ...refreshCookieOptions,
    expires: cookieExpires(),
  });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      branch: user.branch,
      year: user.year,
      role: user.role,
      profileImageUrl: user.profileImageUrl || "",
    },
    accessToken: tokens.accessToken,
  };
};

export const requestSignupOtp = asyncHandler(async (req: Request, res: Response) => {
  const parsed = requestSignupOtpSchema.parse(req.body);
  const email = parsed.email.toLowerCase();

  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    throw new AppError("Account already exists", 409);
  }

  const recentSignupChallenge = await OtpChallengeModel.findOne({
    email,
    purpose: "signup",
  }).sort({ createdAt: -1 });
  if (recentSignupChallenge && recentSignupChallenge.resendAfter.getTime() > Date.now()) {
    throw new AppError("Please wait before requesting another OTP", 429);
  }

  const now = new Date();
  const resendAfter = new Date(now.getTime() + env.OTP_RESEND_COOLDOWN_SECONDS * 1000);
  const expiresAt = new Date(now.getTime() + env.OTP_TTL_MINUTES * 60 * 1000);
  const otp = generateOtp();
  const passwordHash = await bcrypt.hash(parsed.password, 12);

  await OtpChallengeModel.deleteMany({ email, purpose: "signup" });
  await OtpChallengeModel.create({
    email,
    purpose: "signup",
    otpHash: hashOtp(otp),
    signupDraft: {
      name: parsed.name,
      phone: parsed.phone,
      passwordHash,
      branch: parsed.branch,
      year: parsed.year,
    },
    attempts: 0,
    expiresAt,
    resendAfter,
  });

  await sendOtpEmail(email, otp, "signup");

  res.status(201).json({
    success: true,
    message: "OTP sent for signup",
    data: {
      email,
      expiresAt,
      resendAfter,
    },
  });
});

export const verifySignupOtp = asyncHandler(async (req: Request, res: Response) => {
  const parsed = verifyOtpSchema.parse(req.body);
  const email = parsed.email.toLowerCase();

  const challenge = await OtpChallengeModel.findOne({ email, purpose: "signup", consumedAt: { $exists: false } }).sort({ createdAt: -1 });
  if (!challenge) {
    throw new AppError("OTP challenge not found", 404);
  }

  if (challenge.expiresAt.getTime() < Date.now()) {
    throw new AppError("OTP expired", 410);
  }

  if (challenge.attempts >= 5) {
    throw new AppError("Too many OTP attempts", 429);
  }

  challenge.attempts += 1;

  if (!verifyOtpHash(parsed.otp, challenge.otpHash)) {
    await challenge.save();
    throw new AppError("Invalid OTP", 400);
  }

  const draft = challenge.signupDraft;
  if (!draft?.name || !draft?.phone || !draft?.passwordHash || !draft?.branch || !draft?.year) {
    throw new AppError("Signup draft is incomplete", 400);
  }

  const existingUserAfterOtp = await UserModel.findOne({ email });
  if (existingUserAfterOtp) {
    throw new AppError("Account already exists", 409);
  }

  const createdUser = await UserModel.create({
    name: draft.name,
    email,
    phone: draft.phone,
    passwordHash: draft.passwordHash,
    branch: draft.branch,
    year: draft.year,
    role: isAdminEmail(email) ? "admin" : "user",
    isVerified: true,
  });

  challenge.consumedAt = new Date();
  await challenge.save();

  const authPayload = sendAuthResponse(res, createdUser);

  res.status(201).json({
    success: true,
    message: "Signup completed",
    data: authPayload,
  });
});

export const requestLoginOtp = asyncHandler(async (req: Request, res: Response) => {
  const parsed = requestLoginOtpSchema.parse(req.body);
  const email = parsed.email.toLowerCase();

  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new AppError("Account not found", 404);
  }

  const recentLoginChallenge = await OtpChallengeModel.findOne({
    email,
    purpose: "login",
  }).sort({ createdAt: -1 });
  if (recentLoginChallenge && recentLoginChallenge.resendAfter.getTime() > Date.now()) {
    throw new AppError("Please wait before requesting another OTP", 429);
  }

  const passwordOk = await bcrypt.compare(parsed.password, user.passwordHash);
  if (!passwordOk) {
    throw new AppError("Incorrect password", 401);
  }

  const now = new Date();
  const resendAfter = new Date(now.getTime() + env.OTP_RESEND_COOLDOWN_SECONDS * 1000);
  const expiresAt = new Date(now.getTime() + env.OTP_TTL_MINUTES * 60 * 1000);
  const otp = generateOtp();

  await OtpChallengeModel.deleteMany({ email, purpose: "login" });
  await OtpChallengeModel.create({
    email,
    purpose: "login",
    otpHash: hashOtp(otp),
    attempts: 0,
    expiresAt,
    resendAfter,
  });

  await sendOtpEmail(email, otp, "login");

  res.status(200).json({
    success: true,
    message: "OTP sent for login",
    data: {
      email,
      expiresAt,
      resendAfter,
    },
  });
});

export const verifyLoginOtp = asyncHandler(async (req: Request, res: Response) => {
  const parsed = verifyOtpSchema.parse(req.body);
  const email = parsed.email.toLowerCase();

  const challenge = await OtpChallengeModel.findOne({ email, purpose: "login", consumedAt: { $exists: false } }).sort({ createdAt: -1 });
  if (!challenge) {
    throw new AppError("OTP challenge not found", 404);
  }

  if (challenge.expiresAt.getTime() < Date.now()) {
    throw new AppError("OTP expired", 410);
  }

  if (challenge.attempts >= 5) {
    throw new AppError("Too many OTP attempts", 429);
  }

  challenge.attempts += 1;

  if (!verifyOtpHash(parsed.otp, challenge.otpHash)) {
    await challenge.save();
    throw new AppError("Invalid OTP", 400);
  }

  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new AppError("Account not found", 404);
  }

  user.lastLoginAt = new Date();
  await user.save();

  challenge.consumedAt = new Date();
  await challenge.save();

  const authPayload = sendAuthResponse(res, user);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: authPayload,
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    throw new AppError("Refresh token missing", 401);
  }

  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as {
    sub: string;
    email: string;
    role: "user" | "admin";
  };

  const user = await UserModel.findById(payload.sub);
  if (!user) {
    throw new AppError("Account not found", 404);
  }

  const authPayload = sendAuthResponse(res, user);
  res.status(200).json({ success: true, message: "Token refreshed", data: authPayload });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie("accessToken", {
    ...accessCookieOptions,
  });
  res.clearCookie("refreshToken", {
    ...refreshCookieOptions,
  });
  res.status(200).json({ success: true, message: "Logged out" });
});

export const me = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const user = await UserModel.findById(req.user.id);
  if (!user) {
    throw new AppError("Account not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Authenticated",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        branch: user.branch,
        year: user.year,
        role: user.role,
        profileImageUrl: user.profileImageUrl || "",
      },
    },
  });
});

export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const parsed = updateProfileSchema.parse(req.body);
  const user = await UserModel.findById(req.user.id);
  if (!user) {
    throw new AppError("Account not found", 404);
  }

  if (parsed.phone && parsed.phone !== user.phone) {
    const phoneExists = await UserModel.findOne({ phone: parsed.phone, _id: { $ne: user._id } });
    if (phoneExists) {
      throw new AppError("Phone number already in use", 409);
    }
  }

  if (parsed.name !== undefined) user.name = parsed.name;
  if (parsed.phone !== undefined) user.phone = parsed.phone;
  if (parsed.branch !== undefined) user.branch = parsed.branch;
  if (parsed.year !== undefined) user.year = parsed.year;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        branch: user.branch,
        year: user.year,
        role: user.role,
        profileImageUrl: user.profileImageUrl || "",
      },
    },
  });
});

export const requestPasswordResetOtp = asyncHandler(async (req: Request, res: Response) => {
  const parsed = requestPasswordResetOtpSchema.parse(req.body);
  const email = parsed.email.toLowerCase();

  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new AppError("Account not found", 404);
  }

  const recentResetChallenge = await OtpChallengeModel.findOne({
    email,
    purpose: "password-reset",
  }).sort({ createdAt: -1 });
  if (recentResetChallenge && recentResetChallenge.resendAfter.getTime() > Date.now()) {
    throw new AppError("Please wait before requesting another OTP", 429);
  }

  const now = new Date();
  const resendAfter = new Date(now.getTime() + env.OTP_RESEND_COOLDOWN_SECONDS * 1000);
  const expiresAt = new Date(now.getTime() + env.OTP_TTL_MINUTES * 60 * 1000);
  const otp = generateOtp();

  await OtpChallengeModel.deleteMany({ email, purpose: "password-reset" });
  await OtpChallengeModel.create({
    email,
    purpose: "password-reset",
    otpHash: hashOtp(otp),
    attempts: 0,
    expiresAt,
    resendAfter,
  });

  await sendOtpEmail(email, otp, "password-reset");

  res.status(200).json({
    success: true,
    message: "OTP sent for password reset",
    data: {
      email,
      expiresAt,
      resendAfter,
    },
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const parsed = resetPasswordSchema.parse(req.body);
  const email = parsed.email.toLowerCase();

  const challenge = await OtpChallengeModel.findOne({
    email,
    purpose: "password-reset",
    consumedAt: { $exists: false },
  }).sort({ createdAt: -1 });
  if (!challenge) {
    throw new AppError("OTP challenge not found", 404);
  }

  if (challenge.expiresAt.getTime() < Date.now()) {
    throw new AppError("OTP expired", 410);
  }

  if (challenge.attempts >= 5) {
    throw new AppError("Too many OTP attempts", 429);
  }

  challenge.attempts += 1;

  if (!verifyOtpHash(parsed.otp, challenge.otpHash)) {
    await challenge.save();
    throw new AppError("Invalid OTP", 400);
  }

  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new AppError("Account not found", 404);
  }

  const newPasswordHash = await bcrypt.hash(parsed.newPassword, 12);
  user.passwordHash = newPasswordHash;
  await user.save();

  challenge.consumedAt = new Date();
  await challenge.save();

  res.status(200).json({
    success: true,
    message: "Password reset successfully",
    data: {
      email,
    },
  });
});

export const getAllUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await UserModel.find({ role: "user" })
    .select("id name email phone branch year profileImageUrl createdAt")
    .sort({ createdAt: -1 });

  const totalUsers = users.length;

  res.status(200).json({
    success: true,
    message: "Users fetched successfully",
    data: {
      users: users.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        branch: user.branch,
        year: user.year,
        profileImageUrl: user.profileImageUrl || "",
        createdAt: user.createdAt,
      })),
      total: totalUsers,
    },
  });
});