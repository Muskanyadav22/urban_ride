const {
  createReceipt,
  getReceiptById,
  getReceiptByRideId,
  getRiderReceipts,
  getDriverReceipts,
  updateReceiptStatus,
  markReceiptEmailed,
  generateHTMLReceipt,
  getReceiptStats
} = require("../models/receiptModel");
const pool = require("../db");
const nodemailer = require("nodemailer");

// Initialize email transporter (configure with your email service)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "your-app-password"
  }
});

// Create receipt after ride completion
const createRideReceipt = async (req, res) => {
  try {
    const {
      ride_id,
      rider_id,
      driver_id,
      pickup,
      destination,
      distance_km,
      duration_minutes,
      base_fare,
      surge_multiplier = 1.0,
      surge_amount = 0,
      final_fare,
      payment_method = "card",
      payment_status = "completed"
    } = req.body;

    // Validate required fields
    if (!ride_id || !rider_id || !driver_id || !final_fare) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: ride_id, rider_id, driver_id, final_fare"
      });
    }

    // Create receipt in database
    const receipt = await createReceipt(ride_id, rider_id, driver_id, {
      pickup,
      destination,
      distance_km,
      base_fare,
      surge_multiplier,
      surge_amount,
      final_fare,
      payment_method,
      payment_status
    });

    return res.status(201).json({
      success: true,
      message: "Receipt created successfully",
      receipt
    });
  } catch (err) {
    console.error("Error creating receipt:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create receipt",
      error: err.message
    });
  }
};

// Get receipt by ID
const getReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    const receipt = await getReceiptById(id);
    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found"
      });
    }

    return res.status(200).json({
      success: true,
      receipt
    });
  } catch (err) {
    console.error("Error fetching receipt:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch receipt",
      error: err.message
    });
  }
};

// Get receipt by ride ID
const getReceiptForRide = async (req, res) => {
  try {
    const { rideId } = req.params;

    const receipt = await getReceiptByRideId(rideId);
    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found for this ride"
      });
    }

    return res.status(200).json({
      success: true,
      receipt
    });
  } catch (err) {
    console.error("Error fetching receipt:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch receipt",
      error: err.message
    });
  }
};

// Get rider's receipt history
const getRiderReceiptHistory = async (req, res) => {
  try {
    const { rider_id } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const receipts = await getRiderReceipts(
      rider_id,
      parseInt(limit),
      parseInt(offset)
    );

    const statsResult = await getReceiptStats(rider_id);

    return res.status(200).json({
      success: true,
      receipts,
      stats: statsResult
    });
  } catch (err) {
    console.error("Error fetching rider receipts:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch receipts",
      error: err.message
    });
  }
};

// Get driver's receipt history
const getDriverReceiptHistory = async (req, res) => {
  try {
    const { driver_id } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const receipts = await getDriverReceipts(
      driver_id,
      parseInt(limit),
      parseInt(offset)
    );

    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_receipts,
        SUM(final_fare) as total_earned,
        AVG(distance_km) as avg_distance,
        AVG(final_fare) as avg_fare
      FROM ride_receipts
      WHERE driver_id = $1
    `, [driver_id]);

    return res.status(200).json({
      success: true,
      receipts,
      stats: statsResult.rows[0]
    });
  } catch (err) {
    console.error("Error fetching driver receipts:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch receipts",
      error: err.message
    });
  }
};

// Send receipt via email
const sendReceiptEmail = async (req, res) => {
  try {
    const { receipt_id } = req.params;
    const { send_copy_to_driver = false } = req.body;

    // Get receipt details
    const receipt = await getReceiptById(receipt_id);
    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found"
      });
    }

    // Generate HTML receipt
    const htmlContent = generateHTMLReceipt(receipt);
    if (!htmlContent) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate receipt HTML"
      });
    }

    // Send email to rider
    const mailOptions = {
      from: process.env.EMAIL_USER || "noreply@uberclone.com",
      to: receipt.rider_email,
      subject: `Your UberClone Trip Receipt #${receipt.receipt_number}`,
      html: htmlContent,
      attachments: []
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Receipt email sent to ${receipt.rider_email}`);
    } catch (emailErr) {
      console.warn("Email sending failed (non-critical):", emailErr.message);
      // Don't fail the API response, still mark as attempted
    }

    // Send copy to driver if requested
    if (send_copy_to_driver && receipt.driver_email) {
      const driverMailOptions = {
        ...mailOptions,
        to: receipt.driver_email,
        subject: `Receipt Copy - Trip with ${receipt.rider_name} #${receipt.receipt_number}`
      };

      try {
        await transporter.sendMail(driverMailOptions);
        console.log(`Receipt copy sent to driver ${receipt.driver_email}`);
      } catch (emailErr) {
        console.warn("Driver email sending failed (non-critical):", emailErr.message);
      }
    }

    // Mark receipt as emailed in database
    const receiptUrl = `/api/receipts/${receipt_id}`; // URL where receipt can be accessed
    await markReceiptEmailed(receipt_id, receiptUrl);

    return res.status(200).json({
      success: true,
      message: "Receipt email sent successfully",
      receipt_id,
      rider_email: receipt.rider_email
    });
  } catch (err) {
    console.error("Error sending receipt email:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to send receipt email",
      error: err.message
    });
  }
};

// Resend receipt email
const resendReceiptEmail = async (req, res) => {
  try {
    const { receipt_id } = req.params;

    const receipt = await getReceiptById(receipt_id);
    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found"
      });
    }

    // Generate HTML receipt
    const htmlContent = generateHTMLReceipt(receipt);

    const mailOptions = {
      from: process.env.EMAIL_USER || "noreply@uberclone.com",
      to: receipt.rider_email,
      subject: `[RESEND] Your UberClone Trip Receipt #${receipt.receipt_number}`,
      html: htmlContent
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (emailErr) {
      console.warn("Email resending failed:", emailErr.message);
    }

    await markReceiptEmailed(receipt_id, `/api/receipts/${receipt_id}`);

    return res.status(200).json({
      success: true,
      message: "Receipt email resent successfully",
      receipt_id
    });
  } catch (err) {
    console.error("Error resending receipt email:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to resend receipt email",
      error: err.message
    });
  }
};

// View receipt as HTML (for email links)
const viewReceiptHTML = async (req, res) => {
  try {
    const { receipt_id } = req.params;

    const receipt = await getReceiptById(receipt_id);
    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found"
      });
    }

    const htmlContent = generateHTMLReceipt(receipt);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(htmlContent);
  } catch (err) {
    console.error("Error viewing receipt:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to view receipt",
      error: err.message
    });
  }
};

// Update receipt payment status
const updateReceiptPaymentStatus = async (req, res) => {
  try {
    const { receipt_id } = req.params;
    const { payment_status } = req.body;

    if (!payment_status) {
      return res.status(400).json({
        success: false,
        message: "Payment status is required"
      });
    }

    const validStatuses = ["pending", "completed", "failed"];
    if (!validStatuses.includes(payment_status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment status. Allowed: ${validStatuses.join(", ")}`
      });
    }

    const receipt = await updateReceiptStatus(receipt_id, payment_status);

    return res.status(200).json({
      success: true,
      message: "Receipt payment status updated",
      receipt
    });
  } catch (err) {
    console.error("Error updating receipt status:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update receipt status",
      error: err.message
    });
  }
};

// Get receipt statistics
const getStats = async (req, res) => {
  try {
    const { rider_id } = req.query;

    const stats = await getReceiptStats(rider_id);

    return res.status(200).json({
      success: true,
      stats
    });
  } catch (err) {
    console.error("Error fetching stats:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: err.message
    });
  }
};

module.exports = {
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
};
