const express = require("express");
const {
  createRideReceipt,
  getReceipt,
  getReceiptForRide,
  getRiderReceiptHistory,
  getDriverReceiptHistory,
  sendReceiptEmail,
  resendReceiptEmail,
  viewReceiptHTML,
  updateReceiptPaymentStatus,
  getStats
} = require("../controllers/receiptsController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Create receipt (called after ride completion)
router.post("/", authMiddleware(), createRideReceipt);

// Get receipt by ID
router.get("/:id", getReceipt);

// Get receipt HTML view
router.get("/:receipt_id/view", viewReceiptHTML);

// Get receipt by ride ID
router.get("/ride/:rideId", authMiddleware(), getReceiptForRide);

// Get rider's receipt history
router.get("/rider/:rider_id", authMiddleware(), getRiderReceiptHistory);

// Get driver's receipt history
router.get("/driver/:driver_id", authMiddleware(), getDriverReceiptHistory);

// Send receipt email
router.post("/:receipt_id/send-email", authMiddleware(), sendReceiptEmail);

// Resend receipt email
router.post("/:receipt_id/resend-email", authMiddleware(), resendReceiptEmail);

// Update payment status
router.patch("/:receipt_id/payment-status", authMiddleware(), updateReceiptPaymentStatus);

// Get statistics
router.get("/stats/analytics", getStats);

module.exports = router;
