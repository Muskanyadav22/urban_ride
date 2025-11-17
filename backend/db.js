const { Pool } = require("pg");
require("dotenv").config();

if (!process.env.DB_USER || !process.env.DB) {
  console.error("Missing required database environment variables");
  console.log("Current environment variables:", {
    DB_USER: process.env.DB_USER,
    HOST: process.env.HOST,
    DB: process.env.DB,
    DB_PASS: process.env.DB_PASS,
    DB_PORT: process.env.DB_PORT
  });
  process.exit(1);
}

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.HOST || "localhost",
  database: process.env.DB,
  password: process.env.DB_PASS || "", 
  port: process.env.DB_PORT || 5432,
});

// Avoid attempting a live DB connection during tests to prevent Jest open-handle issues
if (process.env.NODE_ENV !== 'test') {
  pool.connect((err, client, release) => {
    if (err) {
      console.error('Error acquiring client', err.message);
      console.error('Make sure your database is running and credentials are correct');
    } else {
      console.log('Database connected successfully');
      release();
    }
  });
}

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;