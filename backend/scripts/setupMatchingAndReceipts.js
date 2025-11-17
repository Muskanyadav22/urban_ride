const pool = require("../db");

const createTables = async () => {
  try {
    console.log("Creating matching_queue table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS matching_queue (
        id SERIAL PRIMARY KEY,
        ride_id INT NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
        rider_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        driver_id INT REFERENCES drivers(id) ON DELETE SET NULL,
        pickup_lat DECIMAL(10,8),
        pickup_lng DECIMAL(11,8),
        dest_lat DECIMAL(10,8),
        dest_lng DECIMAL(11,8),
        status VARCHAR(50) DEFAULT 'waiting', -- waiting, offered, accepted, rejected, timeout
        offer_expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✓ matching_queue table created");

    console.log("Creating ride_receipts table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ride_receipts (
        id SERIAL PRIMARY KEY,
        ride_id INT NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
        rider_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        driver_id INT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
        pickup VARCHAR(255),
        destination VARCHAR(255),
        distance_km DECIMAL(8,2),
        base_fare DECIMAL(10,2),
        surge_multiplier DECIMAL(3,2),
        surge_amount DECIMAL(10,2),
        final_fare DECIMAL(10,2),
        payment_method VARCHAR(50), -- card, wallet, cash
        payment_status VARCHAR(50), -- pending, completed, failed
        receipt_number VARCHAR(50) UNIQUE,
        receipt_url VARCHAR(500),
        email_sent BOOLEAN DEFAULT FALSE,
        email_sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✓ ride_receipts table created");

    console.log("Creating trip_summaries table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trip_summaries (
        id SERIAL PRIMARY KEY,
        ride_id INT NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
        rider_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        driver_id INT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
        started_at TIMESTAMP,
        ended_at TIMESTAMP,
        duration_minutes INT,
        distance_km DECIMAL(8,2),
        pickup_location VARCHAR(255),
        dropoff_location VARCHAR(255),
        fare DECIMAL(10,2),
        rating_given BOOLEAN DEFAULT FALSE,
        rating_value INT,
        review_text TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✓ trip_summaries table created");

    console.log("\n✅ All tables created successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating tables:", err.message);
    process.exit(1);
  }
};

createTables();
