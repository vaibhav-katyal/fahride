import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { getMyWallet, redeemWalletPoints } from "../controllers/wallet.controller.js";

const router = Router();

router.use(requireAuth);
router.get("/me", getMyWallet);
router.post("/redeem", redeemWalletPoints);

export default router;
