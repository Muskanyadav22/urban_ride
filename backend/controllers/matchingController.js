const {
  findNearestDrivers,
  createMatchingQueue,
  offerRideToDriver,
  driverAcceptsRide,
  driverRejectsRide,
  getMatchingQueueById,
  getPendingMatches,
  getDriverOffers,
  getMatchingStats
} = require("../models/matchingModel");
const pool = require("../db");

// Initiate matching for a new ride
const initiateMatching = async (req, res) => {
  try {
    const {
      ride_id,
      rider_id,
      pickup_lat,
      pickup_lng,
      dest_lat,
      dest_lng,
      radius_km = 5
    } = req.body;

    // Validate required fields
    if (!ride_id || !rider_id || pickup_lat === undefined || pickup_lng === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: ride_id, rider_id, pickup_lat, pickup_lng"
      });
    }

    // Create matching queue entry
    const queue = await createMatchingQueue(
      ride_id,
      rider_id,
      pickup_lat,
      pickup_lng,
      dest_lat,
      dest_lng
    );

    if (!queue) {
      return res.status(500).json({
        success: false,
        message: "Failed to create matching queue"
      });
    }

    // Find nearest available drivers
    const nearestDrivers = await findNearestDrivers(
      pickup_lat,
      pickup_lng,
      radius_km
    );

    if (!nearestDrivers || nearestDrivers.length === 0) {
      return res.status(202).json({
        success: true,
        message: "Matching initiated but no drivers available currently",
        queue_id: queue.id,
        status: "waiting",
        drivers_found: 0
      });
    }

    // Return matching initiated with available drivers
    return res.status(200).json({
      success: true,
      message: `Matching initiated. Found ${nearestDrivers.length} available drivers`,
      queue_id: queue.id,
      status: "matching",
      drivers_found: nearestDrivers.length,
      nearest_drivers: nearestDrivers.slice(0, 5).map(d => ({
        driver_id: d.driver_id,
        name: d.driver_name,
        distance_km: parseFloat(d.distance_km.toFixed(2)),
        rating: d.rating,
        vehicle: d.vehicle_type
      }))
    });
  } catch (err) {
    console.error("Error initiating matching:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to initiate matching",
      error: err.message
    });
  }
};

// Offer ride to a specific driver
const offerRideToSpecificDriver = async (req, res) => {
  try {
    const { queue_id, driver_id, offer_duration_seconds = 30 } = req.body;

    if (!queue_id || !driver_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: queue_id, driver_id"
      });
    }

    // Get current queue
    const currentQueue = await getMatchingQueueById(queue_id);
    if (!currentQueue) {
      return res.status(404).json({
        success: false,
        message: "Matching queue not found"
      });
    }

    // Offer ride to driver
    const updated = await offerRideToDriver(
      queue_id,
      driver_id,
      offer_duration_seconds
    );

    if (!updated) {
      return res.status(500).json({
        success: false,
        message: "Failed to offer ride to driver"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ride offered to driver",
      queue_id,
      driver_id,
      status: "offered",
      expires_in_seconds: offer_duration_seconds,
      offer_expires_at: updated.offer_expires_at
    });
  } catch (err) {
    console.error("Error offering ride:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to offer ride",
      error: err.message
    });
  }
};

// Driver accepts ride offer
const acceptRideOffer = async (req, res) => {
  try {
    const { queue_id, driver_id } = req.body;

    if (!queue_id || !driver_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: queue_id, driver_id"
      });
    }

    // Check if offer has expired
    const queue = await getMatchingQueueById(queue_id);
    if (!queue) {
      return res.status(404).json({
        success: false,
        message: "Matching queue not found"
      });
    }

    if (new Date(queue.offer_expires_at) < new Date()) {
      return res.status(410).json({
        success: false,
        message: "Offer has expired. Please wait for a new offer.",
        status: "expired"
      });
    }

    // Accept the ride
    const accepted = await driverAcceptsRide(queue_id, driver_id);

    if (!accepted) {
      return res.status(500).json({
        success: false,
        message: "Failed to accept ride offer"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ride offer accepted successfully",
      queue_id,
      ride_id: accepted.ride_id,
      status: "accepted",
      ride_status: accepted.status
    });
  } catch (err) {
    console.error("Error accepting ride:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to accept ride",
      error: err.message
    });
  }
};

// Driver rejects ride offer
const rejectRideOffer = async (req, res) => {
  try {
    const { queue_id, driver_id } = req.body;

    if (!queue_id || !driver_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: queue_id, driver_id"
      });
    }

    // Reject the ride
    const rejected = await driverRejectsRide(queue_id, driver_id);

    if (!rejected) {
      return res.status(500).json({
        success: false,
        message: "Failed to reject ride offer"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ride offer rejected. System will find another driver.",
      queue_id,
      status: "rejected"
    });
  } catch (err) {
    console.error("Error rejecting ride:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to reject ride",
      error: err.message
    });
  }
};

// Get pending matches for a ride
const getPendingMatchesForRide = async (req, res) => {
  try {
    const { ride_id } = req.params;

    if (!ride_id) {
      return res.status(400).json({
        success: false,
        message: "Ride ID is required"
      });
    }

    const pending = await getPendingMatches(ride_id);

    return res.status(200).json({
      success: true,
      ride_id,
      pending_matches: pending,
      count: pending.length
    });
  } catch (err) {
    console.error("Error fetching pending matches:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending matches",
      error: err.message
    });
  }
};

// Get driver's active offers
const getDriverActiveOffers = async (req, res) => {
  try {
    const { driver_id } = req.params;

    if (!driver_id) {
      return res.status(400).json({
        success: false,
        message: "Driver ID is required"
      });
    }

    const offers = await getDriverOffers(driver_id);

    return res.status(200).json({
      success: true,
      driver_id,
      active_offers: offers,
      count: offers.length
    });
  } catch (err) {
    console.error("Error fetching driver offers:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch driver offers",
      error: err.message
    });
  }
};

// Get matching queue details
const getQueueDetails = async (req, res) => {
  try {
    const { queue_id } = req.params;

    if (!queue_id) {
      return res.status(400).json({
        success: false,
        message: "Queue ID is required"
      });
    }

    const queue = await getMatchingQueueById(queue_id);

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: "Matching queue not found"
      });
    }

    return res.status(200).json({
      success: true,
      queue
    });
  } catch (err) {
    console.error("Error fetching queue details:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch queue details",
      error: err.message
    });
  }
};

// Get matching statistics
const getMatchingStatistics = async (req, res) => {
  try {
    const stats = await getMatchingStats();

    return res.status(200).json({
      success: true,
      statistics: stats
    });
  } catch (err) {
    console.error("Error fetching matching stats:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: err.message
    });
  }
};

// Find nearest drivers (without creating queue)
const findNearestDriversList = async (req, res) => {
  try {
    const { pickup_lat, pickup_lng, radius_km = 5 } = req.query;

    if (pickup_lat === undefined || pickup_lng === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required query params: pickup_lat, pickup_lng"
      });
    }

    const drivers = await findNearestDrivers(
      parseFloat(pickup_lat),
      parseFloat(pickup_lng),
      parseFloat(radius_km)
    );

    return res.status(200).json({
      success: true,
      available_drivers: drivers.map(d => ({
        driver_id: d.driver_id,
        name: d.driver_name,
        distance_km: parseFloat(d.distance_km.toFixed(2)),
        rating: d.rating,
        vehicle: d.vehicle_type,
        phone: d.phone
      })),
      count: drivers.length
    });
  } catch (err) {
    console.error("Error finding drivers:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to find drivers",
      error: err.message
    });
  }
};

module.exports = {
  initiateMatching,
  offerRideToSpecificDriver,
  acceptRideOffer,
  rejectRideOffer,
  getPendingMatchesForRide,
  getDriverActiveOffers,
  getQueueDetails,
  getMatchingStatistics,
  findNearestDriversList
};
