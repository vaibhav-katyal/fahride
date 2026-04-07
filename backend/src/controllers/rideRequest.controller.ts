import type { Response } from "express";
import { Types } from "mongoose";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { RideModel, type RideDocument } from "../models/Ride.model.js";
import { RideRequestModel, type RideRequestDocument } from "../models/RideRequest.model.js";
import { UserModel } from "../models/User.model.js";
import { createNotification, createManyNotifications } from "../services/notification.service.js";
import { emitToUser } from "../services/socket.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/appError.js";
import { generateETag, checkETag } from "../utils/etag.js";
import { createRideRequestSchema, updateRequestStatusSchema } from "../validators/ride.validator.js";

const paramToString = (value: unknown) => (typeof value === "string" ? value : "");

const toMinutes = (value: string) => {
  const [hoursText, minutesText] = value.split(":");
  const hours = Number.parseInt(hoursText || "", 10);
  const minutes = Number.parseInt(minutesText || "", 10);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
};

const normalizeLocalDate = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10) - 1;
  const day = Number.parseInt(match[3], 10);
  const date = new Date(year, month, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
};

const isRideRequestWindowClosed = (dateText: string, departureTime: string) => {
  const rideDate = normalizeLocalDate(dateText);
  if (!rideDate) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (rideDate.getTime() < today.getTime()) {
    return true;
  }

  if (rideDate.getTime() > today.getTime()) {
    return false;
  }

  const rideDepartureMinutes = toMinutes(departureTime);
  if (rideDepartureMinutes === null) {
    return false;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return rideDepartureMinutes <= currentMinutes;
};

const toRequestPayload = (request: RideRequestDocument, ride?: RideDocument) => ({
  requesterSnapshot: request.requesterSnapshot || {
    name: "Requester",
    email: "",
  },
  rideSnapshot: ride?.ownerSnapshot || {
    name: "Ride Owner",
    email: "",
  },
});

const mapRequestPayload = (request: RideRequestDocument, ride?: RideDocument) => ({
  id: String(request._id),
  rideId: String(request.ride),
  rideOwnerId: String(request.rideOwner),
  rideOwnerEmail: toRequestPayload(request, ride).rideSnapshot.email,
  rideOwnerName: toRequestPayload(request, ride).rideSnapshot.name,
  requesterId: String(request.requester),
  requesterName: toRequestPayload(request, ride).requesterSnapshot.name,
  requesterEmail: toRequestPayload(request, ride).requesterSnapshot.email,
  seatsRequested: request.seatsRequested,
  status: request.status,
  createdAt: request.createdAt,
});

const fetchRideMap = async (rideIds: string[]) => {
  const rides = await RideModel.find({ _id: { $in: rideIds } })
    .select("ownerSnapshot from to")
    .lean();
  const map = new Map<string, RideDocument>();
  rides.forEach((ride) => map.set(String(ride._id), ride as RideDocument));
  return map;
};

export const requestRide = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const rideId = paramToString(req.params.rideId);
  if (!Types.ObjectId.isValid(rideId)) {
    throw new AppError("Invalid ride id", 400);
  }

  const parsed = createRideRequestSchema.parse(req.body);

  const ride = await RideModel.findById(rideId);
  if (!ride || ride.status !== "active") {
    throw new AppError("Ride not found", 404);
  }

  if (String(ride.owner) === req.user.id) {
    throw new AppError("You cannot request your own ride", 400);
  }

  if (isRideRequestWindowClosed(ride.date, ride.departureTime)) {
    throw new AppError("Sorry, you are late for this ride", 410, "RIDE_REQUEST_WINDOW_CLOSED");
  }

  if (ride.seatsAvailable < parsed.seatsRequested) {
    throw new AppError(`Only ${ride.seatsAvailable} seat(s) available`, 400);
  }

  const existing = await RideRequestModel.findOne({
    ride: ride._id,
    requester: req.user.id,
    status: { $in: ["pending", "approved"] },
  });

  if (existing) {
    throw new AppError("You already requested this ride", 409);
  }

  const requester = await UserModel.findById(req.user.id).lean();
  if (!requester) {
    throw new AppError("User not found", 404);
  }

  const created = await RideRequestModel.create({
    ride: ride._id,
    rideOwner: ride.owner,
    requester: req.user.id,
    requesterSnapshot: {
      name: requester.name,
      email: requester.email,
    },
    seatsRequested: parsed.seatsRequested,
    status: "pending",
  });

  await createNotification({
    recipient: String(ride.owner),
    actor: req.user.id,
    ride: String(ride._id),
    kind: "request_sent",
    title: "New ride request",
    body: `${requester.name} requested ${parsed.seatsRequested} seat(s) on your ride from ${ride.from} to ${ride.to}.`,
    link: `/ride/${ride._id}?requestId=${created._id}`,
  });

  emitToUser(String(ride.owner), "ride-request-updated", {
    kind: "created",
    requestId: String(created._id),
    rideId: String(ride._id),
  });

  res.status(201).json({
    success: true,
    message: "Ride request sent successfully",
    data: mapRequestPayload(created.toObject() as RideRequestDocument, ride.toObject() as RideDocument),
  });
});

export const getMyRequestForRide = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const rideId = paramToString(req.params.rideId);
  if (!Types.ObjectId.isValid(rideId)) {
    throw new AppError("Invalid ride id", 400);
  }

  const request = await RideRequestModel.findOne({
    ride: rideId,
    requester: req.user.id,
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!request) {
    res.status(200).json({ success: true, data: null });
    return;
  }

  const ride = await RideModel.findById(request.ride).lean();
  res.status(200).json({
    success: true,
    data: mapRequestPayload(request as RideRequestDocument, ride as RideDocument),
  });
});

export const getIncomingRequests = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const requests = await RideRequestModel.find({ rideOwner: req.user.id }).sort({ createdAt: -1 }).lean();
  const rideMap = await fetchRideMap(requests.map((item) => String(item.ride)));

  const requestData = requests.map((item) =>
    mapRequestPayload(item as RideRequestDocument, rideMap.get(String(item.ride)))
  );
  const eTag = generateETag(requestData);
  const { isModified } = checkETag(eTag, req.headers["if-none-match"] as string);

  if (!isModified) {
    res.status(304).end();
    return;
  }

  res.set("ETag", eTag);
  res.status(200).json({
    success: true,
    data: requestData,
  });
});

export const getMyBookings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const requests = await RideRequestModel.find({ requester: req.user.id, status: { $ne: "rejected" } })
    .sort({ createdAt: -1 })
    .lean();

  const rideMap = await fetchRideMap(requests.map((item) => String(item.ride)));

  const requestData = requests.map((item) =>
    mapRequestPayload(item as RideRequestDocument, rideMap.get(String(item.ride)))
  );
  const eTag = generateETag(requestData);
  const { isModified } = checkETag(eTag, req.headers["if-none-match"] as string);

  if (!isModified) {
    res.status(304).end();
    return;
  }

  res.set("ETag", eTag);
  res.status(200).json({
    success: true,
    data: requestData,
  });
});

export const updateRequestStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const requestId = paramToString(req.params.requestId);
  if (!Types.ObjectId.isValid(requestId)) {
    throw new AppError("Invalid request id", 400);
  }

  const { status } = updateRequestStatusSchema.parse(req.body);

  const request = await RideRequestModel.findById(requestId);
  if (!request) {
    throw new AppError("Request not found", 404);
  }

  if (String(request.rideOwner) !== req.user.id) {
    throw new AppError("You are not allowed to update this request", 403);
  }

  if (request.status !== "pending") {
    throw new AppError("Only pending requests can be updated", 400);
  }

  if (status === "approved") {
    const rideForTimeCheck = await RideModel.findById(request.ride).select("date departureTime seatsAvailable");
    if (!rideForTimeCheck) {
      throw new AppError("Ride not found", 404);
    }

    if (isRideRequestWindowClosed(rideForTimeCheck.date, rideForTimeCheck.departureTime)) {
      throw new AppError(
        "Cannot approve request after departure time",
        410,
        "RIDE_APPROVAL_WINDOW_CLOSED"
      );
    }

    const ride = await RideModel.findOneAndUpdate(
      {
        _id: request.ride,
        seatsAvailable: { $gte: request.seatsRequested },
      },
      {
        $inc: { seatsAvailable: -request.seatsRequested },
      },
      { new: true }
    );

    if (!ride) {
      throw new AppError("Not enough seats available now", 400);
    }
  }

  request.status = status;
  request.respondedAt = new Date();
  await request.save();

  const ride = await RideModel.findById(request.ride).lean();

  await createNotification({
    recipient: String(request.requester),
    actor: req.user.id,
    ride: String(request.ride),
    kind: status === "approved" ? "request_approved" : "request_rejected",
    title: status === "approved" ? "Ride request approved" : "Ride request rejected",
    body:
      status === "approved"
        ? `Your request for ${request.seatsRequested} seat(s) on ${ride?.from || "the ride"} was approved.`
        : `Your request for ${request.seatsRequested} seat(s) on ${ride?.from || "the ride"} was rejected.`,
    link: `/ride/${request.ride}?requestId=${request._id}`,
  });

  emitToUser(String(request.requester), "ride-request-updated", {
    kind: status,
    requestId: String(request._id),
    rideId: String(request.ride),
  });
  emitToUser(String(request.rideOwner), "ride-request-updated", {
    kind: status,
    requestId: String(request._id),
    rideId: String(request.ride),
  });

  res.status(200).json({
    success: true,
    message: `Request ${status}`,
    data: mapRequestPayload(request.toObject() as RideRequestDocument, ride as RideDocument),
  });
});

export const cancelMyBooking = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const requestId = paramToString(req.params.requestId);
  if (!Types.ObjectId.isValid(requestId)) {
    throw new AppError("Invalid request id", 400);
  }

  const request = await RideRequestModel.findById(requestId);
  if (!request) {
    throw new AppError("Request not found", 404);
  }

  if (String(request.requester) !== req.user.id) {
    throw new AppError("You are not allowed to cancel this booking", 403);
  }

  if (request.status === "approved") {
    await RideModel.findOneAndUpdate(
      { _id: request.ride },
      {
        $inc: { seatsAvailable: request.seatsRequested },
      }
    );
  }

  const ride = await RideModel.findById(request.ride).lean();

  if (ride) {
    await createNotification({
      recipient: String(request.rideOwner),
      actor: req.user.id,
      ride: String(request.ride),
      kind: "booking_cancelled",
      title: "Booking cancelled",
      body: `A booking for ${request.seatsRequested} seat(s) on ${ride.from} to ${ride.to} was cancelled.`,
      link: `/ride/${request.ride}`,
    });
  }

  await RideRequestModel.deleteOne({ _id: request._id });

  const cancelPayload = {
    kind: "cancelled",
    requestId: String(request._id),
    rideId: String(request.ride),
  };

  emitToUser(String(request.rideOwner), "ride-request-updated", cancelPayload);
  emitToUser(String(request.requester), "ride-request-updated", cancelPayload);

  res.status(200).json({
    success: true,
    message: "Booking cancelled successfully",
  });
});
