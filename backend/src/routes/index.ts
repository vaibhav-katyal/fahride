import { Router } from "express";
import authRoutes from "./auth.routes.js";
import rideRoutes from "./ride.routes.js";
import requestRoutes from "./request.routes.js";
import chatRoutes from "./chat.routes.js";
import geoRoutes from "./geo.routes.js";
import uploadRoutes from "./upload.routes.js";
import feedbackRoutes from "./feedback.routes.js";
import notificationRoutes from "./notification.routes.js";
import maintenanceRoutes from "./maintenance.routes.js";

const router = Router();

router.use("/v1/auth", authRoutes);
router.use("/v1/rides", rideRoutes);
router.use("/v1/requests", requestRoutes);
router.use("/v1/chat", chatRoutes);
router.use("/v1/geo", geoRoutes);
router.use("/v1/upload", uploadRoutes);
router.use("/v1/feedback", feedbackRoutes);
router.use("/v1/notifications", notificationRoutes);
router.use("/v1/maintenance", maintenanceRoutes);

export default router;
