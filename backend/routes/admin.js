const express = require("express");
const router = express.Router();
const { listUsers, listDrivers, listRides, adminCreateUser, adminUpdateUser, adminDeleteUser, adminCreateDriver, adminDeleteDriver } = require("../controllers/adminController");
const { adminLogin } = require("../controllers/adminAuthController");

router.post("/login", adminLogin);
const authMiddleware = require("../middleware/authMiddleware");

router.get("/users", authMiddleware("admin"), listUsers);
router.get("/drivers", authMiddleware("admin"), listDrivers);
router.get("/rides", authMiddleware("admin"), listRides);
// admin CRUD
router.post("/users", authMiddleware("admin"), adminCreateUser);
router.patch("/users/:id", authMiddleware("admin"), adminUpdateUser);
router.delete("/users/:id", authMiddleware("admin"), adminDeleteUser);

router.post("/drivers", authMiddleware("admin"), adminCreateDriver);
router.delete("/drivers/:id", authMiddleware("admin"), adminDeleteDriver);

module.exports = router;