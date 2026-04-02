import { Router } from "express";
import authRoutes from "./auth.routes.js";
import rideRoutes from "./ride.routes.js";
import requestRoutes from "./request.routes.js";
import chatRoutes from "./chat.routes.js";
import geoRoutes from "./geo.routes.js";

const router = Router();

router.use("/v1/auth", authRoutes);
router.use("/v1/rides", rideRoutes);
router.use("/v1/requests", requestRoutes);
router.use("/v1/chat", chatRoutes);
router.use("/v1/geo", geoRoutes);

export default router;
