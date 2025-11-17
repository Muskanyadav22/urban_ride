const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findAdminByUsername } = require('../models/adminModel');

const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await findAdminByUsername(username);
    if (!admin) return res.status(400).json({ message: 'Invalid credentials' });

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: admin.id, role: 'admin', userType: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login successful',
      token,
      admin: { id: admin.id, username: admin.username }
    });
  } catch (error) {
    console.error('adminLogin error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { adminLogin };
