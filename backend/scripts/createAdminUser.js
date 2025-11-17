require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createAdmin, findAdminByUsername } = require('../models/adminModel');

async function run() {
  const username = process.argv[2] || 'admin';
  const password = process.argv[3] || 'admin123';

  try {
    const existing = await findAdminByUsername(username);
    if (existing) {
      console.log(`Admin user '${username}' already exists (id=${existing.id})`);
      process.exit(0);
    }

    const hash = await bcrypt.hash(password, 10);
    const admin = await createAdmin(username, hash);
    console.log('Created admin:', { id: admin.id, username: admin.username });
    process.exit(0);
  } catch (err) {
    console.error('Failed to create admin user:', err);
    process.exit(1);
  }
}

run();
