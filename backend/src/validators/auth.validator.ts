import { z } from "zod";

const collegeEmail = z.string().email().refine((value) => value.endsWith("@chitkara.edu.in") || value.endsWith("@chitkarauniversity.edu.in"), {
  message: "Only Chitkara University email IDs are allowed",
});

export const requestSignupOtpSchema = z.object({
  name: z.string().min(2),
  email: collegeEmail,
  phone: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits"),
  password: z.string().min(6),
  branch: z.string().min(1),
  year: z.string().min(1),
});

export const requestLoginOtpSchema = z.object({
  email: collegeEmail,
  password: z.string().min(6),
});

export const verifyOtpSchema = z.object({
  email: collegeEmail,
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
  purpose: z.enum(["signup", "login", "password-reset"]),
});

export const requestPasswordResetOtpSchema = z.object({
  email: collegeEmail,
});

export const resetPasswordSchema = z.object({
  email: collegeEmail,
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});
