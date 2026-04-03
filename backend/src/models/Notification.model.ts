import { Schema, model, type InferSchemaType, Types } from "mongoose";

const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    ride: { type: Schema.Types.ObjectId, ref: "Ride", required: true, index: true },
    kind: {
      type: String,
      enum: ["request_sent", "request_approved", "request_rejected", "booking_cancelled", "ride_deleted", "chat_message"],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    link: { type: String, required: true },
    readAt: { type: Date },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });

export type NotificationDocument = InferSchemaType<typeof notificationSchema> & {
  _id: Types.ObjectId;
};

export const NotificationModel = model("Notification", notificationSchema);