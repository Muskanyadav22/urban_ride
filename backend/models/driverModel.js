const pool = require("../db");

const createDriver = async (name, car_number) => {
  const result = await pool.query(
    "INSERT INTO drivers (name, car_number, status) VALUES ($1,$2,$3) RETURNING *",
    [name, car_number, "available"]
  );
  return result.rows[0];
};

const findDriverById = async (id) => {
  const result = await pool.query("SELECT * FROM drivers WHERE id=$1", [id]);
  return result.rows[0];
};

const findDriverByCarNumber = async (car_number) => {
  const result = await pool.query("SELECT * FROM drivers WHERE car_number=$1", [car_number]);
  return result.rows[0];
};

const getAllDrivers = async () => {
  const result = await pool.query("SELECT id, name, car_number, status FROM drivers");
  return result.rows;
};

const updateDriverStatus = async (id, status) => {
  const result = await pool.query(
    "UPDATE drivers SET status=$1 WHERE id=$2 RETURNING *",
    [status, id]
  );
  return result.rows[0];
};

const deleteDriver = async (id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Option 1: Set driver_id to NULL for rides (if constraint allows it)
    await client.query("UPDATE rides SET driver_id = NULL WHERE driver_id = $1", [id]);
    
    // Then delete the driver
    await client.query("DELETE FROM drivers WHERE id = $1", [id]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return { message: 'Driver deleted' };
};

module.exports = { createDriver, findDriverById, findDriverByCarNumber, getAllDrivers, updateDriverStatus, deleteDriver };