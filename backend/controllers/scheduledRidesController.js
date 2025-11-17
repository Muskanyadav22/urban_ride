const {
  createScheduledRide,
  getScheduledRideById,
  getScheduledRidesByRiderId,
  getUpcomingScheduledRides,
  getUpcomingScheduledRidesForDriver,
  assignDriverToScheduledRide,
  updateScheduledRideStatus,
  convertScheduledToRide,
  deleteScheduledRide,
  getAllScheduledRides,
  getScheduledRidesStats
} = require("../models/scheduledRidesModel");
const { createRide } = require("../models/rideModel");

// Create a new scheduled ride (rider booking future ride)
const scheduleRide = async (req, res) => {
  try {
    const { pickup, destination, scheduled_time, coords } = req.body;
    const rider_id = req.user.id;

    if (!pickup || !destination || !scheduled_time) {
      return res.status(400).json({ error: "Missing required fields: pickup, destination, scheduled_time" });
    }

    // Validate scheduled_time is in the future
    const scheduledDate = new Date(scheduled_time);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ error: "Scheduled time must be in the future" });
    }

    const ride = await createScheduledRide(rider_id, pickup, destination, scheduledDate, coords);
    res.status(201).json(ride);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get my scheduled rides
const getMyScheduledRides = async (req, res) => {
  try {
    const rider_id = req.user.id;
    const rides = await getScheduledRidesByRiderId(rider_id);
    res.json(rides);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get scheduled ride details
const getScheduledRide = async (req, res) => {
  try {
    const { id } = req.params;
    const ride = await getScheduledRideById(id);

    if (!ride) {
      return res.status(404).json({ error: "Scheduled ride not found" });
    }

    // Check authorization (rider can only see their own)
    if (req.user.role === "user" && ride.rider_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json(ride);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cancel scheduled ride
const cancelScheduledRide = async (req, res) => {
  try {
    const { id } = req.params;
    const ride = await getScheduledRideById(id);

    if (!ride) {
      return res.status(404).json({ error: "Scheduled ride not found" });
    }

    // Check authorization
    if (req.user.role === "user" && ride.rider_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Can only cancel if not completed or already cancelled
    if (["completed", "cancelled"].includes(ride.status)) {
      return res.status(400).json({ error: `Cannot cancel ride with status: ${ride.status}` });
    }

    const updated = await updateScheduledRideStatus(id, "cancelled");
    res.json({ message: "Scheduled ride cancelled", ride: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ===== ADMIN/DRIVER ENDPOINTS =====

// Get upcoming scheduled rides for assignment (admin/driver-dispatcher)
const getUpcomingSchedules = async (req, res) => {
  try {
    const { minutesWindow = 30 } = req.query;
    const rides = await getUpcomingScheduledRides(parseInt(minutesWindow));
    res.json(rides);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get scheduled rides assigned to a driver
const getMyAssignedSchedules = async (req, res) => {
  try {
    const driver_id = req.user.id;
    const { hoursAhead = 24 } = req.query;
    const rides = await getUpcomingScheduledRidesForDriver(driver_id, parseInt(hoursAhead));
    res.json(rides);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: Assign driver to scheduled ride
const assignDriver = async (req, res) => {
  try {
    const { scheduled_ride_id, driver_id, estimated_fare } = req.body;

    if (!scheduled_ride_id || !driver_id) {
      return res.status(400).json({ error: "Missing scheduled_ride_id or driver_id" });
    }

    const ride = await getScheduledRideById(scheduled_ride_id);
    if (!ride) {
      return res.status(404).json({ error: "Scheduled ride not found" });
    }

    const assigned = await assignDriverToScheduledRide(scheduled_ride_id, driver_id, estimated_fare || 0);
    res.json({ message: "Driver assigned to scheduled ride", ride: assigned });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: Start the scheduled ride (convert to actual ride)
const startScheduledRide = async (req, res) => {
  try {
    const { scheduled_ride_id } = req.body;

    const scheduledRide = await getScheduledRideById(scheduled_ride_id);
    if (!scheduledRide) {
      return res.status(404).json({ error: "Scheduled ride not found" });
    }

    if (scheduledRide.status !== "confirmed") {
      return res.status(400).json({ error: "Can only start rides with confirmed status" });
    }

    // Create an actual ride from scheduled ride
    const actualRide = await createRide(
      scheduledRide.rider_id,
      scheduledRide.pickup,
      scheduledRide.destination,
      scheduledRide.driver_id,
      null
    );

    // Update scheduled ride to completed with ride_id reference
    await convertScheduledToRide(scheduled_ride_id, actualRide.id);

    res.json({
      message: "Scheduled ride started",
      actual_ride: actualRide,
      scheduled_ride_id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: Get all scheduled rides
const getAllSchedules = async (req, res) => {
  try {
    const rides = await getAllScheduledRides();
    res.json(rides);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: Get scheduled rides statistics
const getSchedulesStats = async (req, res) => {
  try {
    const stats = await getScheduledRidesStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
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
};
