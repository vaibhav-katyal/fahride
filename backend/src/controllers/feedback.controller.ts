import type { Response } from "express";
import { Types } from "mongoose";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { RideModel } from "../models/Ride.model.js";
import { RideRequestModel } from "../models/RideRequest.model.js";
import { RideFeedbackModel } from "../models/RideFeedback.model.js";
import { UserModel } from "../models/User.model.js";
import { awardFeedbackPoints } from "../services/wallet.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/appError.js";
import { createFeedbackSchema } from "../validators/feedback.validator.js";

const paramToString = (value: unknown) => (typeof value === "string" ? value : "");

const mapFeedback = (feedback: {
  _id: unknown;
  ride: { _id: unknown; from?: string; to?: string } | unknown;
  author: unknown;
  targetUser: unknown;
  kind: "review" | "report";
  rating?: number | null;
  comment: string;
  createdAt: Date;
}) => {
  const ride = feedback.ride as { _id?: unknown; from?: string; to?: string } | undefined;

  return {
    id: String(feedback._id),
    rideId: String(ride?._id || ""),
    rideFrom: ride?.from || "",
    rideTo: ride?.to || "",
    kind: feedback.kind,
    rating: feedback.rating ?? null,
    comment: feedback.comment,
    createdAt: feedback.createdAt,
  };
};

const buildRideMap = async (rideIds: string[]) => {
  const rides = await RideModel.find({ _id: { $in: rideIds } }).select("from to").lean();
  const map = new Map<string, { _id: unknown; from?: string; to?: string }>();
  rides.forEach((ride) => map.set(String(ride._id), ride as { _id: unknown; from?: string; to?: string }));
  return map;
};

export const createRideFeedback = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const rideId = paramToString(req.params.rideId);
  if (!Types.ObjectId.isValid(rideId)) {
    throw new AppError("Invalid ride id", 400);
  }

  const parsed = createFeedbackSchema.parse(req.body);
  const ride = await RideModel.findById(rideId);
  if (!ride) {
    throw new AppError("Ride not found", 404);
  }

  const request = await RideRequestModel.findOne({
    ride: ride._id,
    requester: req.user.id,
  });

  const isRideOwner = String(ride.owner) === req.user.id;
  const isApprovedRequester = Boolean(request && request.status === "approved");

  if (parsed.kind === "review") {
    if (!isApprovedRequester) {
      throw new AppError("You can review only after an approved booking", 403);
    }
    if (!parsed.rating) {
      throw new AppError("Rating is required for a review", 400);
    }
  }

  if (parsed.kind === "report" && !isRideOwner && !request) {
    throw new AppError("You can report only rides you are involved with", 403);
  }

  const feedback = await RideFeedbackModel.create({
    ride: ride._id,
    author: req.user.id,
    targetUser: ride.owner,
    kind: parsed.kind,
    rating: parsed.kind === "review" ? parsed.rating : undefined,
    comment: parsed.comment,
  });

  try {
    await awardFeedbackPoints(req.user.id, String(ride._id), String(feedback._id));
  } catch {
    // Feedback should remain successful even if wallet crediting fails.
  }

  res.status(201).json({
    success: true,
    message: parsed.kind === "review" ? "Review submitted" : "Report submitted",
    data: {
      id: String(feedback._id),
      kind: feedback.kind,
      createdAt: feedback.createdAt,
    },
  });
});

export const getMyFeedback = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const [received, given] = await Promise.all([
    RideFeedbackModel.find({ targetUser: req.user.id }).sort({ createdAt: -1 }).lean(),
    RideFeedbackModel.find({ author: req.user.id }).sort({ createdAt: -1 }).lean(),
  ]);

  const rideMap = await buildRideMap([
    ...new Set([...received, ...given].map((item) => String(item.ride))),
  ]);

  const withRide = (feedback: typeof received[number]) => ({
    ...mapFeedback({
      ...feedback,
      ride: rideMap.get(String(feedback.ride)) || feedback.ride,
    }),
  });

  res.status(200).json({
    success: true,
    data: {
      received: received.map(withRide),
      given: given.map(withRide),
    },
  });
});

export const getUserReviews = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const userId = paramToString(req.params.userId);
  if (!Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user id", 400);
  }

  const reviews = await RideFeedbackModel.find({
    targetUser: userId,
    kind: "review",
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const [rideMap, authors] = await Promise.all([
    buildRideMap([...new Set(reviews.map((item) => String(item.ride)))]),
    UserModel.find({ _id: { $in: [...new Set(reviews.map((item) => String(item.author)))] } })
      .select("name branch year")
      .lean(),
  ]);

  const authorMap = new Map<string, { name?: string; branch?: string; year?: string }>();
  authors.forEach((author) => {
    authorMap.set(String(author._id), {
      name: author.name,
      branch: author.branch,
      year: author.year,
    });
  });

  res.status(200).json({
    success: true,
    data: reviews.map((item) => {
      const ride = rideMap.get(String(item.ride));
      const author = authorMap.get(String(item.author));

      return {
        id: String(item._id),
        rating: item.rating ?? null,
        comment: item.comment,
        createdAt: item.createdAt,
        rideFrom: ride?.from || "",
        rideTo: ride?.to || "",
        authorName: author?.name || "Rider",
        authorBranch: author?.branch || "",
        authorYear: author?.year || "",
      };
    }),
  });
});