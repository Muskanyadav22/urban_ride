const express = require("express");
const {
  initiateMatching,
  offerRideToSpecificDriver,
  acceptRideOffer,
  rejectRideOffer,
  getPendingMatchesForRide,
  getDriverActiveOffers,
  getQueueDetails,
  getMatchingStatistics,
  findNearestDriversList
} = require("../controllers/matchingController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Initiate matching for a new ride
router.post("/initiate", authMiddleware(), initiateMatching);

// Offer ride to a specific driver
router.post("/offer", authMiddleware(), offerRideToSpecificDriver);

// Driver accepts ride
router.post("/accept", authMiddleware(), acceptRideOffer);

// Driver rejects ride
router.post("/reject", authMiddleware(), rejectRideOffer);

// Get pending matches for a ride
router.get("/ride/:ride_id", authMiddleware(), getPendingMatchesForRide);

// Get driver's active offers
router.get("/driver/:driver_id/offers", authMiddleware(), getDriverActiveOffers);

// Get queue details
router.get("/queue/:queue_id", authMiddleware(), getQueueDetails);

// Get matching statistics
router.get("/stats/all", getMatchingStatistics);

// Find nearest drivers (query endpoint)
router.get("/search/nearest", authMiddleware(), findNearestDriversList);

module.exports = router;
