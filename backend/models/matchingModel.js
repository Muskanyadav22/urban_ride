const pool = require("../db");

// Calculate distance between two coordinates (Haversine formula)
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => deg * Math.PI / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Find nearest available drivers for a ride
const findNearestDrivers = async (pickup_lat, pickup_lng, radiusKm = 5) => {
  try {
    // Get all available drivers (online and not on a ride)
    const result = await pool.query(`
      SELECT d.id, d.name, d.location, u.id as user_id, u.phone,
             d.current_lat, d.current_lng, d.rating,
             (SELECT COUNT(*) FROM rides WHERE driver_id = d.id AND status IN ('pending', 'accepted')) as active_rides
      FROM drivers d
      LEFT JOIN users u ON d.user_id = u.id
      WHERE d.status = 'online'
      AND d.available = TRUE
      AND (SELECT COUNT(*) FROM rides WHERE driver_id = d.id AND status IN ('pending', 'accepted')) < 1
      ORDER BY d.rating DESC
    `);

    // Filter by distance and calculate distance for each driver
    const nearbyDrivers = result.rows
      .map(driver => {
        const distance = haversineDistance(
          pickup_lat,
          pickup_lng,
          driver.current_lat || 0,
          driver.current_lng || 0
        );
        return { ...driver, distance_km: distance };
      })
      .filter(driver => driver.distance_km <= radiusKm)
      .sort((a, b) => a.distance_km - b.distance_km);

    return nearbyDrivers;
  } catch (err) {
    console.error("Error finding nearest drivers:", err.message);
    throw err;
  }
};

// Create a matching queue entry
const createMatchingQueue = async (ride_id, rider_id, pickup_lat, pickup_lng, dest_lat, dest_lng) => {
  try {
    const result = await pool.query(`
      INSERT INTO matching_queue 
      (ride_id, rider_id, pickup_lat, pickup_lng, dest_lat, dest_lng, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `, [ride_id, rider_id, pickup_lat, pickup_lng, dest_lat, dest_lng, 'waiting']);

    return result.rows[0];
  } catch (err) {
    console.error("Error creating matching queue:", err.message);
    throw err;
  }
};

// Offer ride to a driver
const offerRideToDriver = async (queue_id, driver_id, offer_duration_seconds = 30) => {
  try {
    const offer_expires_at = new Date(Date.now() + offer_duration_seconds * 1000);
    
    const result = await pool.query(`
      UPDATE matching_queue
      SET driver_id = $1, status = 'offered', offer_expires_at = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [driver_id, offer_expires_at, queue_id]);

    return result.rows[0];
  } catch (err) {
    console.error("Error offering ride:", err.message);
    throw err;
  }
};

// Driver accepts ride
const driverAcceptsRide = async (queue_id, driver_id) => {
  try {
    const queueResult = await pool.query(`
      SELECT * FROM matching_queue WHERE id = $1 AND driver_id = $2
    `, [queue_id, driver_id]);

    if (queueResult.rows.length === 0) {
      throw new Error("Matching queue entry not found or driver mismatch");
    }

    // Check if offer has expired
    const queue = queueResult.rows[0];
    if (queue.offer_expires_at && new Date() > new Date(queue.offer_expires_at)) {
      await pool.query(`
        UPDATE matching_queue SET status = 'timeout' WHERE id = $1
      `, [queue_id]);
      throw new Error("Offer expired");
    }

    // Update queue status
    const updateResult = await pool.query(`
      UPDATE matching_queue
      SET status = 'accepted', updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [queue_id]);

    // Update ride with driver assignment
    const ride = updateResult.rows[0];
    await pool.query(`
      UPDATE rides SET driver_id = $1, status = 'accepted' WHERE id = $2
    `, [driver_id, ride.ride_id]);

    return updateResult.rows[0];
  } catch (err) {
    console.error("Error accepting ride:", err.message);
    throw err;
  }
};

// Driver rejects ride
const driverRejectsRide = async (queue_id, driver_id) => {
  try {
    const result = await pool.query(`
      UPDATE matching_queue
      SET status = 'rejected', updated_at = NOW()
      WHERE id = $1 AND driver_id = $2
      RETURNING *
    `, [queue_id, driver_id]);

    return result.rows[0];
  } catch (err) {
    console.error("Error rejecting ride:", err.message);
    throw err;
  }
};

// Get matching queue by ID
const getMatchingQueueById = async (id) => {
  try {
    const result = await pool.query(`
      SELECT mq.*, r.fare, u.name as rider_name, u.phone as rider_phone, d.name as driver_name
      FROM matching_queue mq
      LEFT JOIN rides r ON mq.ride_id = r.id
      LEFT JOIN users u ON mq.rider_id = u.id
      LEFT JOIN drivers d ON mq.driver_id = d.id
      WHERE mq.id = $1
    `, [id]);

    return result.rows[0];
  } catch (err) {
    console.error("Error getting matching queue:", err.message);
    throw err;
  }
};

// Get pending matching queues for a ride
const getPendingMatches = async (ride_id) => {
  try {
    const result = await pool.query(`
      SELECT * FROM matching_queue
      WHERE ride_id = $1 AND status IN ('waiting', 'offered')
      ORDER BY updated_at ASC
    `, [ride_id]);

    return result.rows;
  } catch (err) {
    console.error("Error getting pending matches:", err.message);
    throw err;
  }
};

// Get driver's current offers
const getDriverOffers = async (driver_id) => {
  try {
    const result = await pool.query(`
      SELECT mq.*, r.pickup, r.destination, u.name as rider_name, u.phone as rider_phone
      FROM matching_queue mq
      LEFT JOIN rides r ON mq.ride_id = r.id
      LEFT JOIN users u ON mq.rider_id = u.id
      WHERE mq.driver_id = $1 AND mq.status = 'offered' AND mq.offer_expires_at > NOW()
    `, [driver_id]);

    return result.rows;
  } catch (err) {
    console.error("Error getting driver offers:", err.message);
    throw err;
  }
};

// Get matching statistics
const getMatchingStats = async () => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_matches,
        COUNT(CASE WHEN status = 'waiting' THEN 1 END) as waiting,
        COUNT(CASE WHEN status = 'offered' THEN 1 END) as offered,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'timeout' THEN 1 END) as timeout
      FROM matching_queue
    `);

    return result.rows[0];
  } catch (err) {
    console.error("Error getting matching stats:", err.message);
    throw err;
  }
};

module.exports = {
  haversineDistance,
  findNearestDrivers,
  createMatchingQueue,
  offerRideToDriver,
  driverAcceptsRide,
  driverRejectsRide,
  getMatchingQueueById,
  getPendingMatches,
  getDriverOffers,
  getMatchingStats
};
