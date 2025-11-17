const pool = require("../db");

// Generate unique receipt number
const generateReceiptNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RCP${timestamp}${random}`;
};

// Create ride receipt
const createReceipt = async (ride_id, rider_id, driver_id, receiptData) => {
  try {
    const receiptNumber = generateReceiptNumber();
    const {
      pickup,
      destination,
      distance_km,
      base_fare,
      surge_multiplier = 1.0,
      surge_amount = 0,
      final_fare,
      payment_method = 'card',
      payment_status = 'pending'
    } = receiptData;

    const result = await pool.query(`
      INSERT INTO ride_receipts 
      (ride_id, rider_id, driver_id, pickup, destination, distance_km, 
       base_fare, surge_multiplier, surge_amount, final_fare, payment_method, 
       payment_status, receipt_number, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING *
    `, [
      ride_id, rider_id, driver_id, pickup, destination, distance_km,
      base_fare, surge_multiplier, surge_amount, final_fare, payment_method,
      payment_status, receiptNumber
    ]);

    return result.rows[0];
  } catch (err) {
    console.error("Error creating receipt:", err.message);
    throw err;
  }
};

// Get receipt by ID
const getReceiptById = async (id) => {
  try {
    const result = await pool.query(`
      SELECT r.*, u.name as rider_name, u.email as rider_email, d.name as driver_name
      FROM ride_receipts r
      LEFT JOIN users u ON r.rider_id = u.id
      LEFT JOIN drivers d ON r.driver_id = d.id
      WHERE r.id = $1
    `, [id]);

    return result.rows[0];
  } catch (err) {
    console.error("Error getting receipt:", err.message);
    throw err;
  }
};

// Get receipt by ride ID
const getReceiptByRideId = async (ride_id) => {
  try {
    const result = await pool.query(`
      SELECT r.*, u.name as rider_name, u.email as rider_email, d.name as driver_name
      FROM ride_receipts r
      LEFT JOIN users u ON r.rider_id = u.id
      LEFT JOIN drivers d ON r.driver_id = d.id
      WHERE r.ride_id = $1
    `, [ride_id]);

    return result.rows[0];
  } catch (err) {
    console.error("Error getting receipt by ride ID:", err.message);
    throw err;
  }
};

// Get rider's receipts
const getRiderReceipts = async (rider_id, limit = 10, offset = 0) => {
  try {
    const result = await pool.query(`
      SELECT r.*, d.name as driver_name
      FROM ride_receipts r
      LEFT JOIN drivers d ON r.driver_id = d.id
      WHERE r.rider_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [rider_id, limit, offset]);

    return result.rows;
  } catch (err) {
    console.error("Error getting rider receipts:", err.message);
    throw err;
  }
};

// Get driver's receipts
const getDriverReceipts = async (driver_id, limit = 10, offset = 0) => {
  try {
    const result = await pool.query(`
      SELECT r.*, u.name as rider_name
      FROM ride_receipts r
      LEFT JOIN users u ON r.rider_id = u.id
      WHERE r.driver_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [driver_id, limit, offset]);

    return result.rows;
  } catch (err) {
    console.error("Error getting driver receipts:", err.message);
    throw err;
  }
};

// Update receipt status
const updateReceiptStatus = async (id, payment_status) => {
  try {
    const result = await pool.query(`
      UPDATE ride_receipts
      SET payment_status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [payment_status, id]);

    return result.rows[0];
  } catch (err) {
    console.error("Error updating receipt status:", err.message);
    throw err;
  }
};

// Mark receipt as emailed
const markReceiptEmailed = async (id, receipt_url) => {
  try {
    const result = await pool.query(`
      UPDATE ride_receipts
      SET email_sent = TRUE, email_sent_at = NOW(), receipt_url = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [receipt_url, id]);

    return result.rows[0];
  } catch (err) {
    console.error("Error marking receipt as emailed:", err.message);
    throw err;
  }
};

// Generate HTML receipt
const generateHTMLReceipt = (receipt) => {
  if (!receipt) return null;

  const surgeInfo = receipt.surge_multiplier > 1 
    ? `<tr><td>Surge Multiplier:</td><td>${receipt.surge_multiplier}x (+₹${receipt.surge_amount})</td></tr>`
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
        .header { text-align: center; border-bottom: 2px solid #667eea; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { color: #667eea; margin: 0; }
        .receipt-number { color: #999; font-size: 0.9rem; }
        .ride-details { margin: 20px 0; padding: 15px; background: #f9f9f9; border-left: 4px solid #667eea; }
        .trip-info { display: flex; justify-content: space-between; margin: 10px 0; }
        .trip-label { font-weight: bold; color: #333; }
        .trip-value { color: #666; }
        .fare-table { width: 100%; margin: 20px 0; border-collapse: collapse; }
        .fare-table td { padding: 10px; border-bottom: 1px solid #eee; }
        .fare-table .label { font-weight: bold; }
        .fare-table .total { font-weight: bold; font-size: 1.2rem; color: #667eea; }
        .footer { text-align: center; color: #999; font-size: 0.9rem; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
        .thank-you { text-align: center; color: #667eea; font-size: 1.1rem; margin: 20px 0; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚗 UberClone Trip Receipt</h1>
          <p class="receipt-number">Receipt #${receipt.receipt_number}</p>
        </div>

        <div class="ride-details">
          <div class="trip-info">
            <span class="trip-label">📍 Pickup:</span>
            <span class="trip-value">${receipt.pickup}</span>
          </div>
          <div class="trip-info">
            <span class="trip-label">📍 Destination:</span>
            <span class="trip-value">${receipt.destination}</span>
          </div>
          <div class="trip-info">
            <span class="trip-label">👤 Driver:</span>
            <span class="trip-value">${receipt.driver_name}</span>
          </div>
          <div class="trip-info">
            <span class="trip-label">📏 Distance:</span>
            <span class="trip-value">${receipt.distance_km} km</span>
          </div>
          <div class="trip-info">
            <span class="trip-label">📅 Date:</span>
            <span class="trip-value">${new Date(receipt.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <table class="fare-table">
          <tr>
            <td class="label">Base Fare:</td>
            <td>₹${receipt.base_fare}</td>
          </tr>
          ${surgeInfo}
          <tr>
            <td class="label total">Total Fare:</td>
            <td class="total">₹${receipt.final_fare}</td>
          </tr>
          <tr>
            <td class="label">Payment Method:</td>
            <td>${receipt.payment_method}</td>
          </tr>
          <tr>
            <td class="label">Payment Status:</td>
            <td>${receipt.payment_status}</td>
          </tr>
        </table>

        <div class="thank-you">Thank you for your ride! 🙏</div>

        <div class="footer">
          <p>This receipt was generated by UberClone</p>
          <p>${new Date(receipt.created_at).toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
};

// Calculate receipt statistics
const getReceiptStats = async (rider_id = null) => {
  try {
    let query = `
      SELECT 
        COUNT(*) as total_receipts,
        SUM(final_fare) as total_spent,
        AVG(distance_km) as avg_distance,
        AVG(final_fare) as avg_fare,
        COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed_payments,
        COUNT(CASE WHEN payment_status = 'failed' THEN 1 END) as failed_payments
      FROM ride_receipts
    `;

    const params = [];
    if (rider_id) {
      query += ` WHERE rider_id = $1`;
      params.push(rider_id);
    }

    const result = await pool.query(query, params);
    return result.rows[0];
  } catch (err) {
    console.error("Error getting receipt stats:", err.message);
    throw err;
  }
};

module.exports = {
  generateReceiptNumber,
  createReceipt,
  getReceiptById,
  getReceiptByRideId,
  getRiderReceipts,
  getDriverReceipts,
  updateReceiptStatus,
  markReceiptEmailed,
  generateHTMLReceipt,
  getReceiptStats
};
