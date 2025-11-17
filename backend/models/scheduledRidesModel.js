const pool = require("../db");

// Create a scheduled ride
const createScheduledRide = async (rider_id, pickup, destination, scheduled_time, coords = null) => {
  const result = await pool.query(
    `INSERT INTO scheduled_rides 
     (rider_id, pickup, destination, scheduled_time, status, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING *`,
    [rider_id, pickup, destination, scheduled_time, "scheduled"]
  );
  return result.rows[0];
};

// Get scheduled ride by ID
const getScheduledRideById = async (id) => {
  const result = await pool.query(
    `SELECT sr.*, u.name as rider_name, u.phone as rider_phone
     FROM scheduled_rides sr
     LEFT JOIN users u ON sr.rider_id = u.id
     WHERE sr.id = $1`,
    [id]
  );
  return result.rows[0];
};

// Get scheduled rides for a rider
const getScheduledRidesByRiderId = async (rider_id) => {
  const result = await pool.query(
    `SELECT sr.*, u.name as rider_name, d.name as driver_name
     FROM scheduled_rides sr
     LEFT JOIN users u ON sr.rider_id = u.id
     LEFT JOIN drivers d ON sr.driver_id = d.id
     WHERE sr.rider_id = $1
     ORDER BY sr.scheduled_time DESC`,
    [rider_id]
  );
  return result.rows;
};

// Get upcoming scheduled rides (within next 24 hours) that need driver assignment
const getUpcomingScheduledRides = async (minutesWindow = 30) => {
  const now = new Date();
  const startTime = now;
  const endTime = new Date(now.getTime() + minutesWindow * 60000);

  const result = await pool.query(
    `SELECT sr.*, u.name as rider_name, u.phone as rider_phone, u.email as rider_email
     FROM scheduled_rides sr
     LEFT JOIN users u ON sr.rider_id = u.id
     WHERE sr.status = 'scheduled'
     AND sr.scheduled_time >= $1 
     AND sr.scheduled_time <= $2
     ORDER BY sr.scheduled_time ASC`,
    [startTime, endTime]
  );
  return result.rows;
};

// Get upcoming scheduled rides for a specific driver
const getUpcomingScheduledRidesForDriver = async (driver_id, hoursAhead = 24) => {
  const now = new Date();
  const future = new Date(now.getTime() + hoursAhead * 60 * 60000);

  const result = await pool.query(
    `SELECT sr.*, u.name as rider_name, u.phone as rider_phone
     FROM scheduled_rides sr
     LEFT JOIN users u ON sr.rider_id = u.id
     WHERE sr.driver_id = $1
     AND sr.status IN ('scheduled', 'confirmed')
     AND sr.scheduled_time >= $2
     AND sr.scheduled_time <= $3
     ORDER BY sr.scheduled_time ASC`,
    [driver_id, now, future]
  );
  return result.rows;
};

// Assign driver to scheduled ride
const assignDriverToScheduledRide = async (scheduled_ride_id, driver_id, estimated_fare) => {
  const result = await pool.query(
    `UPDATE scheduled_rides
     SET driver_id = $1, status = 'confirmed', estimated_fare = $2, assigned_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [driver_id, estimated_fare, scheduled_ride_id]
  );
  return result.rows[0];
};

// Update scheduled ride status
const updateScheduledRideStatus = async (id, status) => {
  const result = await pool.query(
    `UPDATE scheduled_rides
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );
  return result.rows[0];
};

// Convert scheduled ride to actual ride (when ride starts)
const convertScheduledToRide = async (scheduled_ride_id, actual_ride_id) => {
  const result = await pool.query(
    `UPDATE scheduled_rides
     SET status = 'completed', ride_id = $1, completed_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [actual_ride_id, scheduled_ride_id]
  );
  return result.rows[0];
};

// Delete scheduled ride
const deleteScheduledRide = async (id) => {
  const result = await pool.query(
    `DELETE FROM scheduled_rides WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
};

// Get all scheduled rides (admin)
const getAllScheduledRides = async () => {
  const result = await pool.query(
    `SELECT sr.*, u.name as rider_name, d.name as driver_name
     FROM scheduled_rides sr
     LEFT JOIN users u ON sr.rider_id = u.id
     LEFT JOIN drivers d ON sr.driver_id = d.id
     ORDER BY sr.scheduled_time DESC`
  );
  return result.rows;
};

// Get scheduled rides statistics
const getScheduledRidesStats = async () => {
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total_scheduled,
      COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as pending_assignment,
      COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
    FROM scheduled_rides
  `);
  return result.rows[0];
};

module.exports = {
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
};
