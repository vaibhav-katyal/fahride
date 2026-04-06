import type { Response } from "express";
import { Types } from "mongoose";
import { ChatModel } from "../models/Chat.model.js";
import { RideRequestModel } from "../models/RideRequest.model.js";
import { RideModel } from "../models/Ride.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/appError.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";

const paramToString = (value: unknown) => (typeof value === "string" ? value : "");

export const getChatHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const rideId = paramToString(req.params.rideId);
  const requestId = paramToString(req.params.requestId);

  if (!Types.ObjectId.isValid(rideId) || !Types.ObjectId.isValid(requestId)) {
    throw new AppError("Invalid ride or request id", 400);
  }

  // Verify the ride and request exist and user is involved
  const ride = await RideModel.findById(rideId);
  if (!ride) {
    throw new AppError("Ride not found", 404);
  }

  const request = await RideRequestModel.findById(requestId);
  if (!request || String(request.ride) !== rideId) {
    throw new AppError("Request not found or doesn't match ride", 404);
  }

  if (request.status !== "approved") {
    throw new AppError("Chat is only available for approved requests", 403);
  }

  const isDriver = String(ride.owner) === req.user.id;
  const isRider = String(request.requester) === req.user.id;

  if (!isDriver && !isRider) {
    throw new AppError("You are not involved in this ride", 403);
  }

  let chat = await ChatModel.findOne({
    ride: rideId,
    rideRequest: requestId,
  });

  if (!chat) {
    chat = await ChatModel.create({
      ride: rideId,
      rideRequest: requestId,
      driver: ride.owner,
      rider: request.requester,
      messages: [],
    });
  }

  const now = new Date();
  // Update read markers without validating legacy malformed message documents.
  await ChatModel.updateOne(
    { _id: chat._id },
    { $set: isDriver ? { lastReadByDriver: now } : { lastReadByRider: now } }
  );

  const safeMessages = (chat.messages || []).filter(
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

  const { rideId, requestId, content } = req.body;

  if (!Types.ObjectId.isValid(rideId) || !Types.ObjectId.isValid(requestId)) {
    throw new AppError("Invalid ride or request id", 400);
  }

  if (!content || content.trim().length === 0) {
    throw new AppError("Message content is required", 400);
  }

  // Verify the ride and request exist and user is involved
  const ride = await RideModel.findById(rideId);
  if (!ride) {
    throw new AppError("Ride not found", 404);
  }

  const request = await RideRequestModel.findById(requestId);
  if (!request || String(request.ride) !== rideId) {
    throw new AppError("Request not found or doesn't match ride", 404);
  }

  if (request.status !== "approved") {
    throw new AppError("Chat is only available for approved requests", 403);
  }

  const isDriver = String(ride.owner) === req.user.id;
  const isRider = String(request.requester) === req.user.id;

  if (!isDriver && !isRider) {
    throw new AppError("You are not involved in this ride", 403);
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
    { ride: rideId, rideRequest: requestId },
    {
      $setOnInsert: {
        ride: rideId,
        rideRequest: requestId,
        driver: ride.owner,
        rider: request.requester,
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