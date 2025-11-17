const express = require("express");
const router = express.Router();
const { signupDriver, loginDriver, getDriverRides, acceptRide, rejectRide, logoutDriver, getDriverProfile } = require("../controllers/driverController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/signup", signupDriver);
router.post("/login", loginDriver);

router.get("/profile", authMiddleware(), getDriverProfile);
router.get("/rides", authMiddleware(), getDriverRides);
router.put("/:id/accept", authMiddleware(), acceptRide);
router.put("/:id/reject", authMiddleware(), rejectRide);
router.post("/logout", authMiddleware(), logoutDriver);

module.exports = router;