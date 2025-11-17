const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  scheduleRide,
  getMyScheduledRides,
  getScheduledRide,
  cancelScheduledRide,
  getUpcomingSchedules,
  getMyAssignedSchedules,
  assignDriver,
  startScheduledRide,
  getAllSchedules,
  getSchedulesStats
} = require("../controllers/scheduledRidesController");

const router = express.Router();

// Rider: Schedule a new ride
router.post("/", authMiddleware("user"), scheduleRide);

// Rider: Cancel scheduled ride (MUST BE BEFORE /:id routes)
router.post("/:id/cancel", authMiddleware("user"), cancelScheduledRide);

// Rider: Get my scheduled rides
router.get("/my-schedules", authMiddleware("user"), getMyScheduledRides);

// Rider: Get scheduled ride details
router.get("/:id", authMiddleware(), getScheduledRide);

// ===== ADMIN/DRIVER ENDPOINTS =====

// Admin: Get upcoming scheduled rides for assignment (within N minutes)
router.get("/upcoming/assignments", authMiddleware("admin"), getUpcomingSchedules);

// Driver: Get my assigned scheduled rides
router.get("/driver/my-assignments", authMiddleware("driver"), getMyAssignedSchedules);

// Admin: Assign driver to scheduled ride
router.post("/assign-driver", authMiddleware("admin"), assignDriver);

// Admin: Start a scheduled ride (convert to actual ride)
router.post("/start-ride", authMiddleware("admin"), startScheduledRide);

// Admin: Get all scheduled rides
router.get("/admin/all-schedules", authMiddleware("admin"), getAllSchedules);

// Admin: Get scheduled rides statistics
router.get("/admin/stats", authMiddleware("admin"), getSchedulesStats);

module.exports = router;
