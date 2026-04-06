import type { Response } from "express";
import { Types } from "mongoose";
import { ChatModel } from "../models/Chat.model.js";
import { RideRequestModel } from "../models/RideRequest.model.js";
import { RideModel } from "../models/Ride.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/appError.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";

const paramToString = (value: unknown) => (typeof value === "string" ? value : "");

type ApprovedRequestSeed = {
  _id: Types.ObjectId;
  requester: Types.ObjectId;
};

const getChatAccess = async (rideId: string, userId: string) => {
  const ride = await RideModel.findById(rideId).select("owner");
  if (!ride) {
    throw new AppError("Ride not found", 404);
  }

  const isDriver = String(ride.owner) === userId;
  if (isDriver) {
    return {
      ride,
      isDriver: true,
      requestForUser: null as ApprovedRequestSeed | null,
    };
  }

  const requestForUser = await RideRequestModel.findOne({
    ride: rideId,
    requester: userId,
    status: "approved",
  })
    .select("_id requester")
    .lean<ApprovedRequestSeed>();

  if (!requestForUser) {
    throw new AppError("Chat is only available for approved requests", 403);
  }

  return {
    ride,
    isDriver: false,
    requestForUser,
  };
};

export const getChatHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const rideId = paramToString(req.params.rideId);
  if (!Types.ObjectId.isValid(rideId)) {
    throw new AppError("Invalid ride id", 400);
  }

  const { ride, isDriver, requestForUser } = await getChatAccess(rideId, req.user.id);

  const rideChats = await ChatModel.find({ ride: rideId }).sort({ updatedAt: -1 });
  let chat = rideChats[0];

  if (!chat) {
    const seedRequest =
      requestForUser ||
      (await RideRequestModel.findOne({ ride: rideId, status: "approved" })
        .sort({ createdAt: 1 })
        .select("_id requester")
        .lean<ApprovedRequestSeed>());

    if (!seedRequest) {
      throw new AppError("No approved riders found for this ride", 403);
    }

    chat = await ChatModel.create({
      ride: rideId,
      rideRequest: seedRequest._id,
      driver: ride.owner,
      rider: seedRequest.requester,
      messages: [],
    });
  }

  const now = new Date();
  // Update read markers without validating legacy malformed message documents.
  await ChatModel.updateOne(
    { _id: chat._id },
    { $set: isDriver ? { lastReadByDriver: now } : { lastReadByRider: now } }
  );

  const safeMessages = rideChats.length
    ? rideChats
        .flatMap((entry) => entry.messages || [])
        .filter((item) => typeof item.content === "string" && item.content.trim().length > 0)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    : (chat.messages || []).filter(
        (item) => typeof item.content === "string" && item.content.trim().length > 0
      );

  res.status(200).json({
    success: true,
    data: {
      id: chat._id,
      messages: safeMessages,
      lastMessage: chat.lastMessage,
      lastReadByDriver: isDriver ? now : chat.lastReadByDriver,
      lastReadByRider: isDriver ? chat.lastReadByRider : now,
    },
  });
});

export const sendMessage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const { rideId, content } = req.body;

  if (!Types.ObjectId.isValid(rideId)) {
    throw new AppError("Invalid ride id", 400);
  }

  if (!content || content.trim().length === 0) {
    throw new AppError("Message content is required", 400);
  }

  const { ride, requestForUser } = await getChatAccess(rideId, req.user.id);

  const existingChat = await ChatModel.findOne({ ride: rideId }).sort({ updatedAt: -1 });
  const seedRequest =
    requestForUser ||
    (await RideRequestModel.findOne({ ride: rideId, status: "approved" })
      .sort({ createdAt: 1 })
      .select("_id requester")
      .lean<ApprovedRequestSeed>());

  if (!existingChat && !seedRequest) {
    throw new AppError("No approved riders found for this ride", 403);
  }

  const message = {
    sender: {
      id: req.user.id,
      name: req.user?.name || "User",
      email: req.user.email || "",
    },
    content: typeof content === "string" ? content.trim() : "",
    timestamp: new Date(),
  };

  await ChatModel.updateOne(
    existingChat ? { _id: existingChat._id } : { ride: rideId },
    {
      $setOnInsert: {
        ride: rideId,
        rideRequest: seedRequest?._id,
        driver: ride.owner,
        rider: seedRequest?.requester,
      },
      $push: { messages: message },
      $set: {
        lastMessage: {
          content: message.content,
          timestamp: message.timestamp,
        },
      },
    },
    { upsert: true }
  );

  res.status(201).json({
    success: true,
    message: "Message sent",
    data: message,
  });
});
