import type { Response } from "express";
import { Types } from "mongoose";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { NotificationModel } from "../models/Notification.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/appError.js";

const paramToString = (value: unknown) => (typeof value === "string" ? value : "");

const mapNotification = (notification: {
  _id: unknown;
  kind: string;
  title: string;
  body: string;
  link: string;
  readAt?: Date | null;
  createdAt: Date;
}) => ({
  id: String(notification._id),
  kind: notification.kind,
  title: notification.title,
  body: notification.body,
  link: notification.link,
  isRead: Boolean(notification.readAt),
  createdAt: notification.createdAt,
});

export const getMyNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const notifications = await NotificationModel.find({ recipient: req.user.id }).sort({ createdAt: -1 }).lean();

  res.status(200).json({
    success: true,
    data: notifications.map(mapNotification),
  });
});

export const markNotificationAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const notificationId = paramToString(req.params.notificationId);
  if (!Types.ObjectId.isValid(notificationId)) {
    throw new AppError("Invalid notification id", 400);
  }

  const notification = await NotificationModel.findOne({ _id: notificationId, recipient: req.user.id });
  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  notification.readAt = new Date();
  await notification.save();

  res.status(200).json({
    success: true,
    data: mapNotification(notification.toObject()),
  });
});

export const deleteAllNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  await NotificationModel.deleteMany({ recipient: req.user.id });

  res.status(200).json({
    success: true,
    message: "All notifications cleared",
  });
});