import { z } from "zod";

const upiIdRegex = /^[a-z0-9][a-z0-9._-]{1,}@[a-z0-9][a-z0-9._-]{1,}$/i;

export const redeemWalletSchema = z.object({
  points: z.coerce.number().int().min(500).refine((value) => value % 500 === 0, {
    message: "Points must be in multiples of 500",
  }),
  upiId: z.string().trim().toLowerCase().regex(upiIdRegex, "Invalid UPI ID"),
});
