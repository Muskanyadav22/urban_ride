const {
  getSurgeMultiplier,
  calculateFareWithSurge,
  updateSurgeConfig,
  getAllSurgeConfigs,
  getSurgeHistory,
  logSurgeHistory
} = require("../models/surgePricingModel");

// Get current surge multiplier for an area
const getSurge = async (req, res) => {
  try {
    const { area = "default" } = req.query;
    const surge = await getSurgeMultiplier(area);
    res.json(surge);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Calculate fare with surge
const calculateFareWithSurgeMultiplier = async (req, res) => {
  try {
    const { baseFare, area = "default" } = req.body;
    
    if (!baseFare || baseFare < 0) {
      return res.status(400).json({ error: "Invalid base fare" });
    }

    const result = await calculateFareWithSurge(baseFare, area);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: Get all surge configurations
const getSurgeConfigs = async (req, res) => {
  try {
    const configs = await getAllSurgeConfigs();
    res.json(configs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: Update surge configuration for an area
const updateSurgeConfiguration = async (req, res) => {
  try {
    const { area = "default" } = req.params;
    const {
      peak_hours_start,
      peak_hours_end,
      peak_multiplier,
      weekend_multiplier,
      demand_multiplier,
      demand_reason
    } = req.body;

    // Validate inputs
    if (typeof peak_hours_start !== "number" || peak_hours_start < 0 || peak_hours_start > 23) {
      return res.status(400).json({ error: "Invalid peak_hours_start (0-23)" });
    }
    if (typeof peak_hours_end !== "number" || peak_hours_end < 0 || peak_hours_end > 23) {
      return res.status(400).json({ error: "Invalid peak_hours_end (0-23)" });
    }
    if (peak_multiplier && (peak_multiplier < 1 || peak_multiplier > 5)) {
      return res.status(400).json({ error: "peak_multiplier must be between 1 and 5" });
    }

    const config = await updateSurgeConfig(area, {
      peak_hours_start,
      peak_hours_end,
      peak_multiplier,
      weekend_multiplier,
      demand_multiplier,
      demand_reason
    });

    res.json({ message: "Surge config updated", config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: Get surge history for analytics
const getSurgeAnalytics = async (req, res) => {
  try {
    const { area, limit = 100 } = req.query;
    const history = await getSurgeHistory(area, parseInt(limit));
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: Manually set demand-based surge multiplier (for special events, emergencies, etc.)
const setDemandSurge = async (req, res) => {
  try {
    const { area = "default", multiplier, reason } = req.body;

    if (!multiplier || multiplier < 1 || multiplier > 5) {
      return res.status(400).json({ error: "Multiplier must be between 1 and 5" });
    }

    const config = await updateSurgeConfig(area, {
      demand_multiplier: multiplier,
      demand_reason: reason || "Manual adjustment"
    });

    res.json({ message: "Demand surge set", config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getSurge,
  calculateFareWithSurgeMultiplier,
  getSurgeConfigs,
  updateSurgeConfiguration,
  getSurgeAnalytics,
  setDemandSurge
};
