import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { getMyNotifications, markNotificationAsRead, deleteAllNotifications } from "../controllers/notification.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", getMyNotifications);
router.patch("/:notificationId/read", markNotificationAsRead);
router.delete("/delete-all", deleteAllNotifications);

export default router;