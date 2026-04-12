import { Schema, model, type InferSchemaType, Types } from "mongoose";

const walletTransactionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kind: {
      type: String,
      enum: [
        "signup_bonus",
        "ride_post_reward",
        "ride_join_reward",
        "feedback_reward",
        "referral_invite_bonus",
        "referral_signup_friend_bonus",
        "referral_first_join_inviter_bonus",
        "referral_first_join_friend_bonus",
        "redemption_debit",
        "reversal_adjustment",
      ],
      required: true,
      index: true,
    },
    pointsDelta: { type: Number, required: true },
    idempotencyKey: { type: String, trim: true },
    ride: { type: Schema.Types.ObjectId, ref: "Ride", index: true },
    request: { type: Schema.Types.ObjectId, ref: "RideRequest", index: true },
    feedbackId: { type: Schema.Types.ObjectId, ref: "RideFeedback", index: true },
    relatedUser: { type: Schema.Types.ObjectId, ref: "User" },
    note: { type: String, default: "" },
    reversedAt: { type: Date },
  },
  { timestamps: true }
);

walletTransactionSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
walletTransactionSchema.index({ user: 1, createdAt: -1 });
walletTransactionSchema.index({ request: 1, kind: 1, user: 1 });

export type WalletTransactionDocument = InferSchemaType<typeof walletTransactionSchema> & {
  _id: Types.ObjectId;
};

export const WalletTransactionModel = model("WalletTransaction", walletTransactionSchema);
