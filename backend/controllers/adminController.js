const { getAllUsers, createUser, updateUser, deleteUser } = require("../models/userModel");
const { getAllDrivers, createDriver, updateDriverStatus, findDriverById, deleteDriver } = require("../models/driverModel");
const { getAllRides } = require("../models/rideModel");

const listUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const listDrivers = async (req, res) => {
  try {
    const drivers = await getAllDrivers();
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const adminCreateUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const { findUserByEmail } = require("../models/userModel");
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const user = await createUser(name, email, password, role || 'user');
    res.status(201).json(user);
  } catch (err) {
    console.error('adminCreateUser error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const adminUpdateUser = async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const updated = await updateUser(req.params.id, { name, email });
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(updated);
  } catch (err) {
    console.error('adminUpdateUser error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const adminDeleteUser = async (req, res) => {
  try {
    await deleteUser(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('adminDeleteUser error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const adminCreateDriver = async (req, res) => {
  try {
    const { name, car_number } = req.body;
    
    // Validation
    if (!name || !car_number) {
      return res.status(400).json({ error: 'Name and car number are required' });
    }

    // Check if driver with same car number already exists
    const { findDriverByCarNumber } = require("../models/driverModel");
    const existing = await findDriverByCarNumber(car_number);
    if (existing) {
      return res.status(400).json({ error: 'Driver with this car number already exists' });
    }

    const driver = await createDriver(name, car_number);
    res.status(201).json(driver);
  } catch (err) {
    console.error('adminCreateDriver error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const adminDeleteDriver = async (req, res) => {
  try {
    await deleteDriver(req.params.id);
    res.json({ message: 'Driver deleted' });
  } catch (err) {
    console.error('adminDeleteDriver error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const listRides = async (req, res) => {
  try {
    const rides = await getAllRides();
    res.json(rides);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { listUsers, listDrivers, listRides, adminCreateUser, adminUpdateUser, adminDeleteUser, adminCreateDriver, adminDeleteDriver };