import { Schema, model, type InferSchemaType, Types } from "mongoose";

const walletRedemptionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    upiId: { type: String, required: true, trim: true, lowercase: true },
    pointsSpent: { type: Number, required: true, min: 500 },
    rupeesAmount: { type: Number, required: true, min: 50 },
    status: { type: String, enum: ["pending", "paid", "rejected"], default: "pending", index: true },
    handledBy: { type: Schema.Types.ObjectId, ref: "User" },
    handledAt: { type: Date },
    remark: { type: String, default: "" },
  },
  { timestamps: true }
);

walletRedemptionSchema.index({ user: 1, createdAt: -1 });

export type WalletRedemptionDocument = InferSchemaType<typeof walletRedemptionSchema> & {
  _id: Types.ObjectId;
};

export const WalletRedemptionModel = model("WalletRedemption", walletRedemptionSchema);
