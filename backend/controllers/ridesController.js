const { createRide, getAllRides, getRideById, getPendingRides, updateRideStatus, deleteRide, getRidesByRiderId, startTrip, endTrip, getTripDetails } = require("../models/rideModel");
const { getAllDrivers, updateDriverStatus } = require("../models/driverModel");

const createRideController = async (req, res) => {
  try {
    const { pickup, destination, pickup_lat, pickup_lng, dest_lat, dest_lng } = req.body;
    const rider_id = req.user.id;

    // Validate inputs
    if (!pickup || !destination) {
      return res.status(400).json({ error: 'Pickup and destination are required' });
    }

    console.log('📍 Ride Request:', { pickup, destination, pickup_lat, pickup_lng, dest_lat, dest_lng });

    // Prepare coordinates if provided
    const coords = (pickup_lat && pickup_lng && dest_lat && dest_lng) 
      ? { pickup_lat, pickup_lng, dest_lat, dest_lng } 
      : null;

    if (!coords) {
      console.warn('⚠️ Ride created without destination coordinates - using fallback fare calculation');
    } else {
      console.log('✓ Coordinates received - will use distance-based fare');
    }

    const drivers = await getAllDrivers();
    const availableDriver = drivers.find(d => d.status === "available");

    let driver_id = null;
    if (availableDriver) {
      driver_id = availableDriver.id;
      await updateDriverStatus(driver_id, "busy");
      console.log(`🚗 Driver ${driver_id} assigned to ride`);
    } else {
      console.log('⏳ No available drivers - ride created as pending');
    }

    const ride = await createRide(rider_id, pickup, destination, driver_id, coords);
    
    console.log(`✅ Ride created: ID=${ride.id}, Fare=₹${ride.fare}, Driver=${driver_id || 'pending'}`);
    
    res.status(201).json(ride);
  } catch (err) {
    console.error('❌ createRideController error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const getAllRidesController = async (req, res) => {
  try {
    if (req.user.role === "user") {
      const rides = await getRidesByRiderId(req.user.id);
      return res.json(rides);
    }
    
    const rides = await getAllRides();
    res.json(rides);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getRideByIdController = async (req, res) => {
  try {
    const ride = await getRideById(req.params.id);
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    
    if (req.user.role === "user" && ride.rider_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    if (req.user.role === "driver" && ride.driver_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    res.json(ride);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getPendingRidesController = async (req, res) => {
  try {
    const rides = await getPendingRides();
    res.json(rides);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteRideController = async (req, res) => {
  try {
    const result = await deleteRide(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const exportRidesController = async (req, res) => {
  try {
    // if user role is user, export their rides; admins can export all when needed
    let rides;
    if (req.user.role === "user") {
      rides = await getRidesByRiderId(req.user.id);
    } else {
      rides = await getAllRides();
    }

    // build CSV
    const headers = ["id", "pickup", "destination", "status", "fare", "driver_name", "rider_name", "created_at"];
    const rows = rides.map(r => headers.map(h => (r[h] !== null && r[h] !== undefined) ? String(r[h]).replace(/\n/g, " ") : "").join(","));
    const csv = [headers.join(","), ...rows].join("\n");

    res.header('Content-Type', 'text/csv');
    res.attachment('rides.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const acceptRideController = async (req, res) => {
  console.log("acceptRideController called", { rideId: req.params.id, driverId: req.user.id }); // Log request info
  try {
    const rideId = req.params.id;
    const driverId = req.user.id;
    const updatedRide = await updateRideStatus(rideId, "accepted", driverId);
    if (!updatedRide) return res.status(404).json({ message: "Ride not found" });
    
    res.json(updatedRide);
  } catch (err) {
    console.error("Error in acceptRideController:", err); 
    res.status(500).json({ error: err.message });
  }
};

// Start trip (driver picks up rider)
const startTripController = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        message: "Latitude and longitude required" 
      });
    }
    
    const ride = await startTrip(id, latitude, longitude);
    
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }
    
    console.log(`✅ Trip started for ride ${id}`);
    res.json({ message: "Trip started", ride });
  } catch (error) {
    console.error("Error starting trip:", error);
    res.status(500).json({ error: error.message });
  }
};

// Send receipt email
// End trip (driver drops off rider)
const endTripController = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        message: "Latitude and longitude required" 
      });
    }
    
    const ride = await endTrip(id, latitude, longitude);
    
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    console.log(`✅ Trip ended for ride ${id}. Duration: ${ride.trip_duration_minutes} minutes`);
    res.json({ 
      message: "Trip ended", 
      ride,
      duration: ride.trip_duration_minutes
    });
  } catch (error) {
    console.error("❌ Error ending trip:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get trip details
const getTripDetailsController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tripDetails = await getTripDetails(id);
    
    if (!tripDetails) {
      return res.status(404).json({ message: "Trip not found" });
    }
    
    res.json({
      success: true,
      trip: tripDetails
    });
  } catch (error) {
    console.error("Error getting trip details:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createRideController, getAllRidesController, getRideByIdController, getPendingRidesController, deleteRideController, exportRidesController, acceptRideController, startTripController, endTripController, getTripDetailsController };