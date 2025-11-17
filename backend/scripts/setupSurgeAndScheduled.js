const pool = require("../db");

const createTables = async () => {
  try {
    console.log("Creating surge_pricing_config table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS surge_pricing_config (
        id SERIAL PRIMARY KEY,
        area VARCHAR(100) UNIQUE DEFAULT 'default',
        peak_hours_start INT DEFAULT 6,
        peak_hours_end INT DEFAULT 9,
        peak_multiplier DECIMAL(3,2) DEFAULT 1.5,
        weekend_multiplier DECIMAL(3,2),
        demand_multiplier DECIMAL(3,2),
        demand_reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✓ surge_pricing_config table created");

    console.log("Creating surge_history table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS surge_history (
        id SERIAL PRIMARY KEY,
        area VARCHAR(100) DEFAULT 'default',
        multiplier DECIMAL(3,2),
        reason VARCHAR(255),
        active_rides_count INT,
        recorded_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✓ surge_history table created");

    console.log("Creating scheduled_rides table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scheduled_rides (
        id SERIAL PRIMARY KEY,
        rider_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        driver_id INT REFERENCES drivers(id) ON DELETE SET NULL,
        pickup VARCHAR(255) NOT NULL,
        destination VARCHAR(255) NOT NULL,
        pickup_lat DECIMAL(10,8),
        pickup_lng DECIMAL(11,8),
        dest_lat DECIMAL(10,8),
        dest_lng DECIMAL(11,8),
        scheduled_time TIMESTAMP NOT NULL,
        estimated_fare DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, confirmed, completed, cancelled
        ride_id INT REFERENCES rides(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        assigned_at TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);
    console.log("✓ scheduled_rides table created");

    // Insert default surge pricing config if not exists
    console.log("Inserting default surge pricing config...");
    await pool.query(`
      INSERT INTO surge_pricing_config (area, peak_hours_start, peak_hours_end, peak_multiplier, weekend_multiplier)
      VALUES ('default', 6, 9, 1.5, 1.2)
      ON CONFLICT (area) DO NOTHING
    `);
    console.log("✓ Default surge pricing config inserted");

    console.log("\n✅ All tables created successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating tables:", err.message);
    process.exit(1);
  }
};

createTables();
