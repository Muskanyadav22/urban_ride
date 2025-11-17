const pool = require("../db");

// Get current surge multiplier based on time and area
// Returns: { multiplier: 1.5, reason: "Peak hours 6-9 PM", applied_at: timestamp }
const getSurgeMultiplier = async (area = "default", timestamp = null) => {
  const ts = timestamp || new Date();
  const hour = ts.getHours();
  const day = ts.getDay();

  // Get surge config for area
  const configResult = await pool.query(
    "SELECT * FROM surge_pricing_config WHERE area = $1 OR area = 'default' ORDER BY area DESC LIMIT 1",
    [area]
  );

  let baseMultiplier = 1.0;
  let reason = "Normal pricing";

  if (configResult.rows.length > 0) {
    const config = configResult.rows[0];
    
    // Check time-based surge (hour-based)
    if (config.peak_hours_start && config.peak_hours_end) {
      const start = config.peak_hours_start;
      const end = config.peak_hours_end;
      
      if (start < end) {
        // Normal range (e.g., 6 to 9)
        if (hour >= start && hour < end) {
          baseMultiplier = config.peak_multiplier || 1.5;
          reason = `Peak hours ${start}-${end}`;
        }
      } else {
        // Overnight range (e.g., 22 to 6)
        if (hour >= start || hour < end) {
          baseMultiplier = config.peak_multiplier || 1.5;
          reason = `Night surge ${start}-${end}`;
        }
      }
    }

    // Check day-based surge (weekend multiplier)
    if (baseMultiplier === 1.0 && config.weekend_multiplier && (day === 5 || day === 6)) {
      baseMultiplier = config.weekend_multiplier;
      reason = "Weekend surge";
    }

    // Check demand-based surge (stored in database)
    if (config.demand_multiplier && config.demand_multiplier > baseMultiplier) {
      baseMultiplier = config.demand_multiplier;
      reason = config.demand_reason || "High demand";
    }
  }

  return {
    multiplier: baseMultiplier,
    reason: reason,
    applied_at: ts
  };
};

// Calculate fare with surge pricing
const calculateFareWithSurge = async (baseFare, area = "default", timestamp = null) => {
  const surge = await getSurgeMultiplier(area, timestamp);
  const finalFare = Math.round(baseFare * surge.multiplier);
  return {
    baseFare,
    surgeFare: finalFare,
    multiplier: surge.multiplier,
    reason: surge.reason
  };
};

// Create/update surge pricing config for an area
const updateSurgeConfig = async (area, config) => {
  const {
    peak_hours_start,
    peak_hours_end,
    peak_multiplier,
    weekend_multiplier,
    demand_multiplier,
    demand_reason
  } = config;

  const result = await pool.query(
    `INSERT INTO surge_pricing_config 
     (area, peak_hours_start, peak_hours_end, peak_multiplier, weekend_multiplier, demand_multiplier, demand_reason)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (area) DO UPDATE SET
     peak_hours_start = $2, peak_hours_end = $3, peak_multiplier = $4, 
     weekend_multiplier = $5, demand_multiplier = $6, demand_reason = $7
     RETURNING *`,
    [area, peak_hours_start, peak_hours_end, peak_multiplier, weekend_multiplier, demand_multiplier, demand_reason]
  );

  return result.rows[0];
};

// Get all surge configs
const getAllSurgeConfigs = async () => {
  const result = await pool.query("SELECT * FROM surge_pricing_config ORDER BY area");
  return result.rows;
};

// Get surge history for analytics
const getSurgeHistory = async (area = null, limit = 100) => {
  let query = "SELECT * FROM surge_history";
  const params = [];

  if (area) {
    query += " WHERE area = $1";
    params.push(area);
  }

  query += " ORDER BY recorded_at DESC LIMIT $" + (params.length + 1);
  params.push(limit);

  const result = await pool.query(query, params);
  return result.rows;
};

// Log surge multiplier for analytics
const logSurgeHistory = async (area, multiplier, reason, active_rides_count) => {
  await pool.query(
    `INSERT INTO surge_history (area, multiplier, reason, active_rides_count, recorded_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [area, multiplier, reason, active_rides_count]
  );
};

module.exports = {
  getSurgeMultiplier,
  calculateFareWithSurge,
  updateSurgeConfig,
  getAllSurgeConfigs,
  getSurgeHistory,
  logSurgeHistory
};
