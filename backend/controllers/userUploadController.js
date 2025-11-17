const path = require('path');
const fs = require('fs');

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/${req.file.filename}`;
    // optionally, persist to user record (left as future improvement)
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { uploadAvatar };
