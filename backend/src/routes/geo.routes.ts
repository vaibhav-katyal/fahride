import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/appError.js";
import { reverseGeocode, searchGeocode } from "../services/geocode.service.js";

const router = Router();

const searchSchema = z.object({
  q: z.string().trim().min(1, "Query is required"),
  limit: z.coerce.number().int().min(1).max(10).optional(),
});

const reverseSchema = z.object({
  lat: z.coerce.number().gte(-90).lte(90),
  lon: z.coerce.number().gte(-180).lte(180),
});

router.get(
  "/search",
  asyncHandler(async (req, res) => {
    const parsed = searchSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message || "Invalid query", 400);
    }

    const results = await searchGeocode(parsed.data.q, parsed.data.limit ?? 5);

    res.json({
      success: true,
      data: results,
    });
  })
);

router.get(
  "/reverse",
  asyncHandler(async (req, res) => {
    const parsed = reverseSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message || "Invalid coordinates", 400);
    }

    const label = await reverseGeocode(parsed.data.lat, parsed.data.lon);

    res.json({
      success: true,
      data: {
        label,
      },
    });
  })
);

export default router;
