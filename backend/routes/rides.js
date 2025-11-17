const express = require("express");
const router = express.Router();
const { acceptRideController , createRideController, getAllRidesController, getRideByIdController, getPendingRidesController, deleteRideController, exportRidesController, previewFareController, postDriverLocationController } = require("../controllers/ridesController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware("user"), createRideController);

router.get("/", authMiddleware(), getAllRidesController);

// specific routes first
router.get("/pending/all", authMiddleware("driver"), getPendingRidesController);

// export rides as CSV for authenticated user
router.get("/export", authMiddleware(), exportRidesController);

// Trip start/end routes
router.post("/:id/start", authMiddleware(), require("../controllers/ridesController").startTripController);
router.post("/:id/end", authMiddleware(), require("../controllers/ridesController").endTripController);
router.get("/:id/details", authMiddleware(), require("../controllers/ridesController").getTripDetailsController);

// then dynamic id-based route
router.get("/:id", authMiddleware(), getRideByIdController);

router.patch("/:id/accept", authMiddleware("driver"), acceptRideController);

router.delete("/:id", authMiddleware("admin"), deleteRideController);

module.exports = router;