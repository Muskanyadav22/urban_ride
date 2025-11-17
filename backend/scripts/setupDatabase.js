require('dotenv').config();
const pool = require('../db');

async function setupDatabase() {
  const client = await pool.connect();
  try {
    console.log('Setting up database tables...');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Users table created/verified');

    // Create drivers table with UNIQUE constraint on car_number
    await client.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        car_number VARCHAR(50) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Drivers table created/verified');

    // Create rides table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rides (
        id SERIAL PRIMARY KEY,
        rider_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
        pickup VARCHAR(255) NOT NULL,
        destination VARCHAR(255) NOT NULL,
        pickup_lat DECIMAL(10,8),
        pickup_lng DECIMAL(11,8),
        dest_lat DECIMAL(10,8),
        dest_lng DECIMAL(11,8),
        status VARCHAR(20) DEFAULT 'pending',
        fare INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Rides table created/verified');

    // Create admin table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Admin table created/verified');

    // Add UNIQUE constraint to car_number if it doesn't exist
    const constraintCheck = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name='drivers' AND constraint_type='UNIQUE' AND constraint_name LIKE '%car_number%'
    `);
    
    if (constraintCheck.rows.length === 0) {
      try {
        await client.query(`
          ALTER TABLE drivers ADD CONSTRAINT drivers_car_number_unique UNIQUE (car_number)
        `);
        console.log('✓ Added UNIQUE constraint to car_number');
      } catch (err) {
        if (err.code === '42P07') {
          console.log('✓ UNIQUE constraint on car_number already exists');
        } else {
          throw err;
        }
      }
    }

    console.log('\n✅ Database setup completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database setup failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

setupDatabase();
