const express = require("express");
const router = express.Router();
const { registerUser, loginUser, listUsers, logoutUser, getProfile, updateProfile } = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/", authMiddleware("admin"), listUsers);
router.post("/logout", authMiddleware(), logoutUser);

// profile endpoints for authenticated user
router.get("/me", authMiddleware(), getProfile);
router.patch("/me", authMiddleware(), updateProfile);

// avatar upload
const multer = require('multer');
const path = require('path');
const upload = multer({ dest: path.join(__dirname, '..', 'uploads') });
const { uploadAvatar } = require('../controllers/userUploadController');
router.post('/me/avatar', authMiddleware(), upload.single('avatar'), uploadAvatar);

module.exports = router;