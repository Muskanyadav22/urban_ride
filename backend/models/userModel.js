const pool = require("../db");

const bcrypt = require('bcryptjs');
const createUser = async (name, email, password, role) => {
  const hashed = await bcrypt.hash(password, 10);
  const result = await pool.query(
    "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
    [name, email, hashed, role]
  );
  return result.rows[0];
};

const findUserByEmail = async (email) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0];
};

const getAllUsers = async () => {
  const result = await pool.query("SELECT id, name, email, role FROM users");
  return result.rows;
};

const getUserById = async (id) => {
  const result = await pool.query("SELECT id, name, email, role FROM users WHERE id = $1", [id]);
  return result.rows[0];
};

const updateUser = async (id, { name, email }) => {
  const result = await pool.query(
    "UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email, role",
    [name, email, id]
  );
  return result.rows[0];
};

const deleteUser = async (id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Option 1: Set rider_id to NULL for rides (if constraint allows it)
    await client.query("UPDATE rides SET rider_id = NULL WHERE rider_id = $1", [id]);
    
    // Then delete the user
    await client.query("DELETE FROM users WHERE id = $1", [id]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return { message: 'User deleted' };
};

module.exports = { createUser, findUserByEmail, getAllUsers, getUserById, updateUser, deleteUser };