const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const authMiddleware = require("./middleware/authMiddleware");

const userRoutes = require("./routes/user");
const driverRoutes = require("./routes/driver");
const rideRoutes = require("./routes/rides");
const adminRoutes = require("./routes/admin");
const surgePricingRoutes = require("./routes/surgePricing");
const scheduledRidesRoutes = require("./routes/scheduledRides");
const matchingRoutes = require("./routes/matching");
const receiptsRoutes = require("./routes/receipts");

const app = express();
app.use(bodyParser.json());
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
  credentials: true
}));

app.use("/api/users", userRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/surge-pricing", surgePricingRoutes);
app.use("/api/scheduled-rides", scheduledRidesRoutes);
app.use("/api/matching", matchingRoutes);
app.use("/api/receipts", receiptsRoutes);

app.get("/api/health", (req, res) => {
  res.json({ message: "Server is running!" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is working!", timestamp: new Date() });
});
const PORT = process.env.PORT || 5000;
let server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// --- Socket.IO real-time setup ---
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Drivers can join driver room and emit locations
  socket.on("driver:join", (payload) => {
    // payload: { driverId }
    socket.join("drivers");
    socket.driverId = payload?.driverId;
    console.log(`Driver joined: ${socket.driverId}`);
  });

  // Riders can join riders room to receive driver locations
  socket.on("rider:join", (payload) => {
    socket.join("riders");
    console.log(`Rider joined room: ${socket.id}`);
  });

  // Driver emits location updates
  socket.on("driver:location", (data) => {
    // data: { driverId, lat, lng, rideId?, timestamp }
    // Broadcast to riders room so riders can receive real-time driver positions
    io.to("riders").emit("driver:location", data);
  });

  // --- RIDE MATCHING EVENTS ---
  // Driver joins matching pool to receive ride offers
  socket.on("matching:driver-ready", (payload) => {
    // payload: { driverId, lat, lng }
    socket.join(`driver:${payload.driverId}`);
    socket.join("matching:drivers");
    socket.driverId = payload.driverId;
    console.log(`Driver ${payload.driverId} ready for matching`);
  });

  // Rider initiates ride search
  socket.on("matching:rider-search", (payload) => {
    // payload: { riderId, rideId, pickup_lat, pickup_lng }
    socket.join(`rider:${payload.riderId}`);
    socket.join("matching:riders");
    console.log(`Rider ${payload.riderId} searching for ride`);
    // Broadcast to drivers that a new ride is available
    io.to("matching:drivers").emit("matching:new-ride-available", {
      ride_id: payload.rideId,
      pickup_lat: payload.pickup_lat,
      pickup_lng: payload.pickup_lng
    });
  });

  // Send ride offer to specific driver
  socket.on("matching:offer", (payload) => {
    // payload: { driverId, queueId, rideId, riderId, pickup, destination, expires_in_seconds }
    io.to(`driver:${payload.driverId}`).emit("matching:ride-offer", {
      queue_id: payload.queueId,
      ride_id: payload.rideId,
      rider_id: payload.riderId,
      pickup: payload.pickup,
      destination: payload.destination,
      expires_in_seconds: payload.expires_in_seconds,
      received_at: new Date()
    });
    console.log(`Ride offer sent to driver ${payload.driverId} for ride ${payload.rideId}`);
  });

  // Driver accepts ride
  socket.on("matching:driver-accept", (payload) => {
    // payload: { driverId, queueId, rideId }
    io.to(`rider:${payload.riderId}`).emit("matching:driver-accepted", {
      queue_id: payload.queueId,
      driver_id: payload.driverId,
      ride_id: payload.rideId,
      accepted_at: new Date()
    });
    console.log(`Driver ${payload.driverId} accepted ride ${payload.rideId}`);
  });

  // Driver rejects ride
  socket.on("matching:driver-reject", (payload) => {
    // payload: { driverId, queueId, rideId }
    io.to("matching:drivers").emit("matching:driver-rejected", {
      queue_id: payload.queueId,
      ride_id: payload.rideId
    });
    console.log(`Driver ${payload.driverId} rejected ride ${payload.rideId}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

const pool = require("./db");

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection FAILED:', err);
  } else {
    console.log('Database connection SUCCESS:', res.rows[0]);
  }
});

app.get("/api/admin/users", authMiddleware("admin"), async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, role FROM users");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/drivers", authMiddleware("admin"), async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, car_number, status FROM drivers");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/rides", authMiddleware("admin"), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, u.name as rider_name, d.name as driver_name 
      FROM rides r 
      LEFT JOIN users u ON r.rider_id = u.id 
      LEFT JOIN drivers d ON r.driver_id = d.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/drivers/rides", authMiddleware("driver"), async (req, res) => {
  try {
    const driverId = req.user.id;
    const result = await pool.query(`
      SELECT r.*, u.name as rider_name 
      FROM rides r 
      LEFT JOIN users u ON r.rider_id = u.id 
      WHERE r.driver_id = $1
    `, [driverId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/rides", authMiddleware(), async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let query, params;
    
    if (userRole === "user") {
      query = `
        SELECT r.*, u.name as rider_name, d.name as driver_name 
        FROM rides r 
        LEFT JOIN users u ON r.rider_id = u.id 
        LEFT JOIN drivers d ON r.driver_id = d.id 
        WHERE r.rider_id = $1
      `;
      params = [userId];
    } else {
      query = `
        SELECT r.*, u.name as rider_name, d.name as driver_name 
        FROM rides r 
        LEFT JOIN users u ON r.rider_id = u.id 
        LEFT JOIN drivers d ON r.driver_id = d.id
      `;
      params = [];
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// (no external app export) - server runs as main entry point
