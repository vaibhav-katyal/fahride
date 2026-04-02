import { Schema, model } from "mongoose";

const otpChallengeSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    purpose: { type: String, enum: ["signup", "login", "password-reset"], required: true, index: true },
    otpHash: { type: String, required: true },
    signupDraft: {
      name: { type: String },
      phone: { type: String },
      passwordHash: { type: String },
      branch: { type: String },
      year: { type: String },
    },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    resendAfter: { type: Date, required: true },
    consumedAt: { type: Date },
  },
  { timestamps: true }
);

otpChallengeSchema.index({ email: 1, purpose: 1, createdAt: -1 });
otpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpChallengeModel = model("OtpChallenge", otpChallengeSchema);
