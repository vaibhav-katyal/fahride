import { Router } from "express";
import { getChatHistory, sendMessage } from "../controllers/chat.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/:rideId/:requestId", getChatHistory);
router.post("/send", sendMessage);

export default router;
