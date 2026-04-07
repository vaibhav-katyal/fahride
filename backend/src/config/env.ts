import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const parseBoolean = (value: unknown) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return value;
};

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
  OTP_SECRET: z.string().min(16),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.preprocess(parseBoolean, z.boolean().default(false)),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.string().min(1),
  SMTP_REPLY_TO: z.string().email().optional(),
  CLIENT_ORIGIN: z.string().min(1),
  OTP_TTL_MINUTES: z.coerce.number().default(10),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().default(60),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
});

export const env = envSchema.parse(process.env);

if (env.SMTP_SECURE && env.SMTP_PORT !== 465) {
  throw new Error("SMTP_SECURE=true requires SMTP_PORT=465");
}
