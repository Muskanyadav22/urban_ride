const pool = require("../db");

// haversine distance in kilometers
function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => deg * Math.PI / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateFare(pickup, destination, coords = null) {
  try {
    if (coords && coords.pickup_lat && coords.pickup_lng && coords.dest_lat && coords.dest_lng) {
      const distKm = haversineDistance(coords.pickup_lat, coords.pickup_lng, coords.dest_lat, coords.dest_lng);
      // base fare + per-km rate (₹20/km) and a small booking fee
      const fare = Math.round(50 + distKm * 20 + 20);
      return fare;
    }
  } catch (e) {
    // fall back to legacy method on any error
    console.error('Fare calc with coords failed, falling back:', e.message);
  }

  // legacy fallback: simple heuristic based on string length difference
  return 100 + Math.abs((String(pickup || '').length - String(destination || '').length) * 10);
}

module.exports.calculateFare = calculateFare;

const createRide = async (rider_id, pickup, destination, driver_id = null, coords = null) => {
  const fare = calculateFare(pickup, destination, coords);
  const result = await pool.query(
    "INSERT INTO rides (rider_id, pickup, destination, driver_id, status, fare) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [rider_id, pickup, destination, driver_id, "pending", fare]
  );
  return result.rows[0];
};

const getAllRides = async () => {
  const result = await pool.query(`
    SELECT r.*, u.name as rider_name, d.name as driver_name 
    FROM rides r 
    LEFT JOIN users u ON r.rider_id = u.id 
    LEFT JOIN drivers d ON r.driver_id = d.id
    ORDER BY r.created_at DESC
  `);
  return result.rows;
};

const getRideById = async (id) => {
  const result = await pool.query(`
    SELECT r.*, u.name as rider_name, d.name as driver_name 
    FROM rides r 
    LEFT JOIN users u ON r.rider_id = u.id 
    LEFT JOIN drivers d ON r.driver_id = d.id 
    WHERE r.id = $1
  `, [id]);
  return result.rows[0];
};

const getRidesByRiderId = async (rider_id) => {
  const result = await pool.query(`
    SELECT r.*, u.name as rider_name, d.name as driver_name 
    FROM rides r 
    LEFT JOIN users u ON r.rider_id = u.id 
    LEFT JOIN drivers d ON r.driver_id = d.id 
    WHERE r.rider_id = $1
    ORDER BY r.created_at DESC
  `, [rider_id]);
  return result.rows;
};

const getRidesByDriverId = async (driver_id) => {
  const result = await pool.query(`
    SELECT r.*, u.name as rider_name, d.name as driver_name 
    FROM rides r 
    LEFT JOIN users u ON r.rider_id = u.id 
    LEFT JOIN drivers d ON r.driver_id = d.id 
    WHERE r.driver_id = $1
    ORDER BY r.created_at DESC
  `, [driver_id]);
  return result.rows;
};

const deleteRide = async (id) => {
  await pool.query("DELETE FROM rides WHERE id = $1", [id]);
  return { message: "Ride deleted" };
};

const getPendingRides = async () => {
  const result = await pool.query(`
    SELECT r.*, u.name as rider_name 
    FROM rides r 
    LEFT JOIN users u ON r.rider_id = u.id 
    WHERE r.status='pending'
    ORDER BY r.created_at DESC
  `);
  return result.rows;
};

const updateRideStatus = async (id, status, driver_id = null) => {
  let query, values;
  if (driver_id) {
    query = "UPDATE rides SET status = $1, driver_id = $2 WHERE id = $3 RETURNING *";
    values = [status, driver_id, id];
  } else {
    query = "UPDATE rides SET status = $1 WHERE id = $2 RETURNING *";
    values = [status, id];
  }
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Start trip (driver picks up rider)
const startTrip = async (id, latitude, longitude) => {
  const result = await pool.query(
    `UPDATE rides 
     SET status = 'started', 
         started_at = NOW(),
         started_location_lat = $2,
         started_location_lng = $3
     WHERE id = $1 RETURNING *`,
    [id, latitude, longitude]
  );
  return result.rows[0];
};

// End trip (driver drops off rider)
const endTrip = async (id, latitude, longitude) => {
  const result = await pool.query(
    `UPDATE rides 
     SET status = 'ended', 
         ended_at = NOW(),
         ended_location_lat = $2,
         ended_location_lng = $3,
         trip_duration_minutes = EXTRACT(MINUTE FROM (NOW() - started_at))::INT
     WHERE id = $1 RETURNING *`,
    [id, latitude, longitude]
  );
  return result.rows[0];
};

// Get trip details
const getTripDetails = async (id) => {
  const result = await pool.query(
    `SELECT 
       id,
       status,
       started_at,
       ended_at,
       trip_duration_minutes,
       started_location_lat,
       started_location_lng,
       ended_location_lat,
       ended_location_lng,
       EXTRACT(EPOCH FROM (ended_at - started_at))/60 as actual_duration_minutes
     FROM rides 
     WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};

module.exports = { 
  calculateFare,
  createRide, 
  getAllRides, 
  getRideById, 
  getRidesByRiderId,
  getRidesByDriverId,
  deleteRide, 
  getPendingRides, 
  updateRideStatus,
  startTrip,
  endTrip,
  getTripDetails
};