import { Router } from "express";

const router = Router();

// Simple in-memory storage for maintenance mode
let maintenanceModeStatus = false;

// GET maintenance status
router.get("/status", (_req, res) => {
  res.json({ isMaintenanceMode: maintenanceModeStatus });
});

// POST to update maintenance status
router.post("/toggle", (req, res) => {
  const { isMaintenanceMode } = req.body;
  
  if (typeof isMaintenanceMode !== "boolean") {
    return res.status(400).json({ error: "isMaintenanceMode must be a boolean" });
  }
  
  maintenanceModeStatus = isMaintenanceMode;
  res.json({ success: true, isMaintenanceMode: maintenanceModeStatus });
});

export default router;
