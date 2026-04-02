import { Schema, model } from "mongoose";

interface MessageDocument {
  sender: {
    id: string;
    name: string;
    email: string;
  };
  content: string;
  timestamp: Date;
}

const chatSchema = new Schema(
  {
    ride: { type: Schema.Types.ObjectId, ref: "Ride", required: true, index: true },
    rideRequest: { type: Schema.Types.ObjectId, ref: "RideRequest", required: true, index: true },
    driver: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rider: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    messages: [
      {
        sender: {
          id: { type: String, required: true },
          name: { type: String, required: true },
          email: { type: String, required: true },
        },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
       ],
    lastMessage: {
      content: String,
      timestamp: { type: Date, default: Date.now },
    },
    lastReadByDriver: { type: Date, default: null },
    lastReadByRider: { type: Date, default: null },
  },
  { timestamps: true }
);

chatSchema.index({ ride: 1, rideRequest: 1 }, { unique: true });

export const ChatModel = model("Chat", chatSchema);
export type { MessageDocument };
