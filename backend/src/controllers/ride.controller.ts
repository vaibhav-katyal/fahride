import type { Response } from "express";
import { Types } from "mongoose";
import { RideModel, type RideDocument } from "../models/Ride.model.js";
import { UserModel } from "../models/User.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/appError.js";
import { generateETag, checkETag } from "../utils/etag.js";
import { createRideSchema } from "../validators/ride.validator.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";

const paramToString = (value: unknown) => (typeof value === "string" ? value : "");

const toRidePayload = (ride: RideDocument, includeImage = false) => ({
  ownerSnapshot: ride.ownerSnapshot || {
    name: "Driver",
    email: "",
    phone: "",
    branch: "",
    year: "",
  },
});

const mapRidePayload = (ride: RideDocument, includeImage = false) => ({
  id: String(ride._id),
  driverName: (toRidePayload(ride).ownerSnapshot.name || "Driver").trim(),
  driverEmail: toRidePayload(ride).ownerSnapshot.email,
  driverPhone: toRidePayload(ride).ownerSnapshot.phone,
  driverBranch: toRidePayload(ride).ownerSnapshot.branch,
  driverYear: toRidePayload(ride).ownerSnapshot.year,
  carModel: ride.carModel,
  carNumberPlate: ride.carNumberPlate,
  carImageUrl: includeImage ? ride.carImageUrl : "",
  from: ride.from,
  to: ride.to,
  date: ride.date,
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
    .select("ownerSnapshot from to date departureTime arrivalTime pricePerSeat seatsAvailable carModel carNumberPlate createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const rideData = rides.map((ride) => mapRidePayload(ride as RideDocument, false));
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

  res.status(200).json({ success: true, data: mapRidePayload(ride as RideDocument, true) });
});

export const getMyRides = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const rides = await RideModel.find({ owner: req.user.id })
    .select("ownerSnapshot from to date departureTime arrivalTime pricePerSeat seatsAvailable carModel carNumberPlate createdAt")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: rides.map((ride) => mapRidePayload(ride as RideDocument, false)),
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
    data: mapRidePayload(ride.toObject() as RideDocument, false),
  });
});
