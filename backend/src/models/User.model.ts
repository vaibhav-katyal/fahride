import { Schema, model, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    phone: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    profileImageUrl: { type: String, default: "" },
    branch: { type: String, required: true, trim: true },
    year: { type: String, required: true, trim: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
    walletPoints: { type: Number, default: 0, min: 0 },
    walletLifetimeEarned: { type: Number, default: 0, min: 0 },
    referralCode: { type: String, uppercase: true, trim: true },
    referredBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    referralInviteRewardsCount: { type: Number, default: 0, min: 0 },
    firstJoinBonusGranted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ referralCode: 1 }, { unique: true, sparse: true });

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: Schema.Types.ObjectId;
};

export const UserModel = model("User", userSchema);
