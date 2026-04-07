import type { Response } from "express";
import { Types } from "mongoose";
import { RideModel, type RideDocument } from "../models/Ride.model.js";
import { RideRequestModel } from "../models/RideRequest.model.js";
import { UserModel } from "../models/User.model.js";
import { createManyNotifications } from "../services/notification.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/appError.js";
import { generateETag, checkETag } from "../utils/etag.js";
import { createRideSchema, updateRideSchema } from "../validators/ride.validator.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";

const paramToString = (value: unknown) => (typeof value === "string" ? value : "");

const toRidePayload = (ride: RideDocument) => ({
  ownerSnapshot: ride.ownerSnapshot || {
    name: "Driver",
    email: "",
    phone: "",
    branch: "",
    year: "",
  },
});

const mapRidePayload = (ride: RideDocument) => ({
  id: String(ride._id),
  ownerId: ride.owner ? String(ride.owner) : "",
  driverName: (toRidePayload(ride).ownerSnapshot.name || "Driver").trim(),
  driverEmail: toRidePayload(ride).ownerSnapshot.email,
  driverPhone: toRidePayload(ride).ownerSnapshot.phone,
  driverBranch: toRidePayload(ride).ownerSnapshot.branch,
  driverYear: toRidePayload(ride).ownerSnapshot.year,
  carModel: ride.carModel,
  carNumberPlate: ride.carNumberPlate,
  carImageUrl: ride.carImageUrl || "",
  from: ride.from,
  to: ride.to,
  date: ride.date,
  repeatDays: ride.repeatDays || [],
  departureTime: ride.departureTime,
  arrivalTime: ride.arrivalTime,
  pricePerSeat: `₹${ride.pricePerSeat}`,
  seats: ride.seatsAvailable,
  eta: "—",
  avatar: (toRidePayload(ride).ownerSnapshot.name || "DR").slice(0, 2).toUpperCase(),
  createdAt: ride.createdAt,
});

export const getRides = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { from, to, minSeats, maxPrice } = req.query;

  const query: Record<string, unknown> = { status: "active" };

  if (typeof from === "string" && from.trim()) {
    query.from = { $regex: from.trim(), $options: "i" };
  }

  if (typeof to === "string" && to.trim()) {
    query.to = { $regex: to.trim(), $options: "i" };
  }

  if (typeof minSeats === "string" && Number(minSeats) > 0) {
    query.seatsAvailable = { $gte: Number(minSeats) };
  }

  if (typeof maxPrice === "string" && Number(maxPrice) > 0) {
    query.pricePerSeat = { $lte: Number(maxPrice) };
  }

  const rides = await RideModel.find(query)
    .select("owner ownerSnapshot from to date repeatDays departureTime arrivalTime pricePerSeat seatsAvailable carModel carNumberPlate carImageUrl createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const rideData = rides.map((ride) => mapRidePayload(ride as RideDocument));
  const eTag = generateETag(rideData);
  const { isModified } = checkETag(eTag, req.headers["if-none-match"] as string);

  if (!isModified) {
    res.status(304).end();
    return;
  }

  res.set("ETag", eTag);
  res.status(200).json({
    success: true,
    data: rideData,
  });
});

export const getRideById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const rideId = paramToString(req.params.rideId);
  if (!Types.ObjectId.isValid(rideId)) {
    throw new AppError("Invalid ride id", 400);
  }

  const ride = await RideModel.findById(rideId).lean();
  if (!ride) {
    throw new AppError("Ride not found", 404);
  }

  res.status(200).json({ success: true, data: mapRidePayload(ride as RideDocument) });
});

export const getMyRides = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const rides = await RideModel.find({ owner: req.user.id })
    .select("owner ownerSnapshot from to date repeatDays departureTime arrivalTime pricePerSeat seatsAvailable carModel carNumberPlate carImageUrl createdAt")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: rides.map((ride) => mapRidePayload(ride as RideDocument)),
  });
});

export const createRide = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const parsed = createRideSchema.parse(req.body);

  const owner = await UserModel.findById(req.user.id).lean();
  if (!owner) {
    throw new AppError("User not found", 404);
  }

  const ride = await RideModel.create({
    owner: req.user.id,
    ownerSnapshot: {
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
      branch: owner.branch,
      year: owner.year,
    },
    from: parsed.from,
    to: parsed.to,
    date: parsed.date,
    departureTime: parsed.departureTime,
    arrivalTime: parsed.arrivalTime,
    pricePerSeat: parsed.pricePerSeat,
    seatsAvailable: parsed.seats,
    seatsTotal: parsed.seats,
    carModel: parsed.carModel,
    carNumberPlate: parsed.carNumberPlate,
    carImageUrl: parsed.carImageUrl,
    paymentMethod: parsed.paymentMethod,
    repeatDays: parsed.repeatDays,
  });

  res.status(201).json({
    success: true,
    message: "Ride posted successfully",
    data: mapRidePayload(ride.toObject() as RideDocument),
  });
});

export const updateRide = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const rideId = paramToString(req.params.rideId);
  if (!Types.ObjectId.isValid(rideId)) {
    throw new AppError("Invalid ride id", 400);
  }

  const parsed = updateRideSchema.parse(req.body);
  const ride = await RideModel.findById(rideId);
  if (!ride) {
    throw new AppError("Ride not found", 404);
  }

  if (String(ride.owner) !== req.user.id) {
    throw new AppError("You are not allowed to edit this ride", 403);
  }

  const seatsBooked = ride.seatsTotal - ride.seatsAvailable;
  const nextSeatsTotal = parsed.seats ?? ride.seatsTotal;
  if (nextSeatsTotal < seatsBooked) {
    throw new AppError("Seats cannot be less than already booked seats", 400);
  }

  if (parsed.from !== undefined) ride.from = parsed.from;
  if (parsed.to !== undefined) ride.to = parsed.to;
  if (parsed.date !== undefined) ride.date = parsed.date;
  if (parsed.departureTime !== undefined) ride.departureTime = parsed.departureTime;
  if (parsed.arrivalTime !== undefined) ride.arrivalTime = parsed.arrivalTime;
  if (parsed.pricePerSeat !== undefined) ride.pricePerSeat = parsed.pricePerSeat;
  if (parsed.carModel !== undefined) ride.carModel = parsed.carModel;
  if (parsed.carNumberPlate !== undefined) ride.carNumberPlate = parsed.carNumberPlate;
  if (parsed.carImageUrl !== undefined) ride.carImageUrl = parsed.carImageUrl;
  if (parsed.paymentMethod !== undefined) ride.paymentMethod = parsed.paymentMethod;
  if (parsed.repeatDays !== undefined) ride.repeatDays = parsed.repeatDays;

  if (parsed.seats !== undefined) {
    ride.seatsTotal = parsed.seats;
    ride.seatsAvailable = parsed.seats - seatsBooked;
  }

  await ride.save();

  res.status(200).json({
    success: true,
    message: "Ride updated successfully",
    data: mapRidePayload(ride.toObject() as RideDocument),
  });
});

export const deleteRide = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const actorId = req.user.id;

  const rideId = paramToString(req.params.rideId);
  if (!Types.ObjectId.isValid(rideId)) {
    throw new AppError("Invalid ride id", 400);
  }

  const ride = await RideModel.findById(rideId);
  if (!ride) {
    throw new AppError("Ride not found", 404);
  }

  if (String(ride.owner) !== req.user.id) {
    throw new AppError("You are not allowed to delete this ride", 403);
  }

  const pendingRequests = await RideRequestModel.find({ ride: ride._id }).lean();
  await createManyNotifications(
    pendingRequests.map((request) => ({
      recipient: String(request.requester),
      actor: actorId,
      ride: String(ride._id),
      kind: "ride_deleted" as const,
      title: "Ride deleted",
      body: `The ride from ${ride.from} to ${ride.to} has been deleted by the owner.`,
      link: "/my-bookings",
    }))
  );

  await RideRequestModel.deleteMany({ ride: ride._id });
  await RideModel.deleteOne({ _id: ride._id });

  res.status(200).json({
    success: true,
    message: "Ride deleted successfully",
  });
});
