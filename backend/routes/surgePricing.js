const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getSurge,
  calculateFareWithSurgeMultiplier,
  getSurgeConfigs,
  updateSurgeConfiguration,
  getSurgeAnalytics,
  setDemandSurge
} = require("../controllers/surgePricingController");

const router = express.Router();

// Public: Get current surge multiplier
router.get("/current", getSurge);

// Public: Calculate fare with surge
router.post("/calculate", calculateFareWithSurgeMultiplier);

// Admin only: Get all surge configs
router.get("/configs", authMiddleware("admin"), getSurgeConfigs);

// Admin only: Update surge config for area
router.put("/configs/:area", authMiddleware("admin"), updateSurgeConfiguration);

// Admin only: Get surge analytics/history
router.get("/analytics", authMiddleware("admin"), getSurgeAnalytics);

// Admin only: Set demand-based surge (for events, emergencies)
router.post("/demand", authMiddleware("admin"), setDemandSurge);

module.exports = router;
