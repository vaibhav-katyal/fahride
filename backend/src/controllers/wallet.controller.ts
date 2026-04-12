import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/appError.js";
import { getWalletOverview, requestWalletRedemption } from "../services/wallet.service.js";
import { redeemWalletSchema } from "../validators/wallet.validator.js";

export const getMyWallet = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const wallet = await getWalletOverview(req.user.id);
  if (!wallet) {
    throw new AppError("Account not found", 404);
  }

  res.status(200).json({
    success: true,
    data: wallet,
  });
});

export const redeemWalletPoints = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const parsed = redeemWalletSchema.parse(req.body);
  const redemption = await requestWalletRedemption(req.user.id, parsed.points, parsed.upiId);

  if (!redemption) {
    throw new AppError("Account not found", 404);
  }

  if ("error" in redemption && redemption.error === "insufficient_points") {
    throw new AppError("Insufficient wallet points", 400);
  }

  res.status(201).json({
    success: true,
    message: "Redemption request submitted",
    data: redemption,
  });
});
