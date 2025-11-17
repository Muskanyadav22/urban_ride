const bcrypt = require("bcryptjs");
const { createAdmin } = require("./models/adminModel");

const setupAdmin = async () => {
  try {
    const username = "admin";
    const password = "admin123";
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const admin = await createAdmin(username, hashedPassword);
    console.log("✓ Admin user created successfully!");
    console.log("Username:", username);
    console.log("Password:", password);
    console.log("Admin ID:", admin.id);
    process.exit(0);
  } catch (error) {
    console.error("✗ Error creating admin:", error.message);
    process.exit(1);
  }
};

setupAdmin();
