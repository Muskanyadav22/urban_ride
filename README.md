# 🚕 Urban Ride - Full Stack Ride-Sharing Application

A complete, production-ready ride-sharing platform built with **Node.js**, **Express**, **React**, **PostgreSQL**, and **Socket.io** for real-time updates.

## ✨ Key Features

✅ **User Authentication** - JWT-based signup/login for riders  
✅ **Driver Management** - Driver registration, login, and profile management  
✅ **Real-Time Tracking** - Live driver location updates via Socket.io  
✅ **Ride Booking & Matching** - Browse available rides and book instantly  
✅ **Trip Management** - Start/end trips with GPS coordinates  
✅ **Driver-Rider Matching** - Automatic assignment using Haversine algorithm  
✅ **Fare Calculation** - Distance-based dynamic pricing  
✅ **Surge Pricing** - Time and area-based surge multipliers  
✅ **Trip Receipts** - View detailed trip receipts on rider profile  
✅ **Scheduled Rides** - Book rides in advance with cron-based scheduling  
✅ **Admin Dashboard** - Manage users, drivers, and rides  
✅ **CSV Export** - Export rides data for analysis  
✅ **Live Map Integration** - Leaflet + OpenStreetMap   

**Status**: ✅ 14/16 features completed  
⏳ Pending: Stripe payments, Ratings & Reviews

---

## 🛠️ Tech Stack

### Backend

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 20.17.0+ |
| Framework | Express.js | 5.1.0 |
| Database | PostgreSQL | 12+ |
| Authentication | JWT | jsonwebtoken 9.1.2 |
| Real-Time | Socket.io | 4.8.1 |
| Password Hashing | bcryptjs | 2.4.3 |
| Task Scheduler | node-cron | Latest |
| Email | Nodemailer | 6.9.7 |

### Frontend

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | React | 19.1.1 |
| Build Tool | Vite | 5.4.6+ |
| Routing | React Router | 7.x |
| HTTP Client | Axios | 1.7.7 |
| Real-Time | Socket.io Client | 4.8.1 |
| Maps | Leaflet | 1.9.4 |
| Styling | CSS | Custom |

---

## 📋 Table of Contents

1. [Prerequisites](#-prerequisites)
2. [Installation & Setup](#-installation--setup)
3. [Configuration](#-configuration)
4. [Running the Application](#-running-the-application)
5. [API Documentation](#-api-documentation)
6. [Database Schema](#-database-schema)
7. [How It Works](#-how-it-works)
8. [Testing Credentials](#-testing-credentials)
9. [Troubleshooting](#-troubleshooting)

---

## 📦 Prerequisites

Before you begin, ensure you have:

1. **Node.js** v20.17.0+ - [Download](https://nodejs.org/)
2. **PostgreSQL** 12+ - [Download](https://www.postgresql.org/)
3. **Git** - [Download](https://git-scm.com/)

Verify installation:
```bash
node --version      # Should show v20.17.0+
npm --version       # Should show 10.x+
psql --version      # Should show 12+
```

---

## 🚀 Installation & Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/Muskanyadav22/uber_clone.git
cd uber_clone
```

### Step 2: Backend Setup

```bash
cd backend
npm install
```

### Step 3: Frontend Setup

```bash
cd ../frontend
npm install
```

### Step 4: Create PostgreSQL Database

```bash
psql -U postgres -c "CREATE DATABASE uberclone;"
```

### Step 5: Create Database Tables

Run this SQL in psql:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  phone VARCHAR(15),
  role VARCHAR(20) DEFAULT 'user',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE drivers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  car_number VARCHAR(20) UNIQUE,
  status VARCHAR(20) DEFAULT 'available',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  rating DECIMAL(3, 2) DEFAULT 0,
  total_trips INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rides (
  id SERIAL PRIMARY KEY,
  rider_id INT REFERENCES users(id),
  driver_id INT REFERENCES drivers(id),
  pickup VARCHAR(255),
  destination VARCHAR(255),
  pickup_lat DECIMAL(10, 8),
  pickup_lng DECIMAL(11, 8),
  dest_lat DECIMAL(10, 8),
  dest_lng DECIMAL(11, 8),
  status VARCHAR(20) DEFAULT 'pending',
  fare DECIMAL(10, 2),
  rating INT,
  review TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  started_location_lat DECIMAL(10, 8),
  started_location_lng DECIMAL(11, 8),
  ended_location_lat DECIMAL(10, 8),
  ended_location_lng DECIMAL(11, 8),
  trip_duration_minutes INT
);

CREATE TABLE scheduled_rides (
  id SERIAL PRIMARY KEY,
  rider_id INT REFERENCES users(id),
  pickup VARCHAR(255),
  destination VARCHAR(255),
  scheduled_time TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE surge_pricing (
  id SERIAL PRIMARY KEY,
  area VARCHAR(100),
  start_time TIME,
  end_time TIME,
  multiplier DECIMAL(4, 2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE receipts (
  id SERIAL PRIMARY KEY,
  ride_id INT UNIQUE REFERENCES rides(id),
  receipt_number VARCHAR(50) UNIQUE,
  amount DECIMAL(10, 2),
  pickup VARCHAR(255),
  destination VARCHAR(255),
  duration_minutes INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## ⚙️ Configuration

### Backend Environment (.env)

Create `.env` file in `backend/` directory:

```env
# Server
port=5000
NODE_ENV=development

# Database
DB_USER=postgres
DB_PASS=your_password_here
DB=uberclone
HOST=localhost
DB_PORT=5432

# JWT
JWT_SECRET=zxcvbnmkjhgfdsaqwertyup123456789

# Email (Optional - for receipt delivery)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
EMAIL_FROM=noreply@uberclone.com
```

> **Note**: For Gmail, use an [App Password](https://myaccount.google.com/apppasswords), not your regular password.

---

## ▶️ Running the Application

### Terminal 1: Start Backend

```bash
cd backend
npm start
```

Expected output: `Server running on port 5000`

### Terminal 2: Start Frontend

```bash
cd frontend
npm run dev
```

Expected output: `Local: http://localhost:5173`

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api

---

## 📚 API Documentation

### Base URL: `http://localhost:5000/api`

### User Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/users/signup` | Register user | ❌ |
| POST | `/users/login` | Login user | ❌ |
| GET | `/users/profile` | Get user profile | ✅ |
| PATCH | `/users/profile` | Update profile | ✅ |

### Driver Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/drivers/signup` | Register driver | ❌ |
| POST | `/drivers/login` | Login driver | ❌ |
| GET | `/drivers/profile` | Get driver profile | ✅ |
| GET | `/drivers/rides` | Get driver's rides | ✅ |

### Ride Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/rides` | Create new ride | ✅ |
| GET | `/rides/pending/all` | Get pending rides | ✅ |
| PATCH | `/rides/:id/accept` | Accept ride | ✅ |
| POST | `/rides/:id/start` | Start trip | ✅ |
| POST | `/rides/:id/end` | End trip | ✅ |
| GET | `/rides/:id/details` | Get trip details | ✅ |

### Scheduled Rides

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/scheduled-rides` | Schedule ride | ✅ |
| GET | `/scheduled-rides` | Get scheduled rides | ✅ |
| POST | `/scheduled-rides/:id/cancel` | Cancel ride | ✅ |

### Admin Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/admin/users` | Get all users | ✅ |
| GET | `/admin/drivers` | Get all drivers | ✅ |
| GET | `/admin/rides` | Get all rides | ✅ |
| GET | `/admin/dashboard` | Admin statistics | ✅ |

---

## 📁 Project Structure

```
uber_clone/
├── backend/
│   ├── controllers/              # Request handlers
│   │   ├── userController.js
│   │   ├── driverController.js
│   │   ├── ridesController.js
│   │   ├── adminController.js
│   │   └── scheduledRidesController.js
│   ├── models/                   # Database queries
│   │   ├── userModel.js
│   │   ├── driverModel.js
│   │   ├── rideModel.js
│   │   └── ...
│   ├── routes/                   # API endpoints
│   │   ├── user.js
│   │   ├── driver.js
│   │   ├── rides.js
│   │   ├── admin.js
│   │   └── scheduledRides.js
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT verification
│   ├── server.js                 # Express + Socket.io
│   ├── db.js                     # PostgreSQL connection
│   ├── package.json
│   └── .env                      # Environment variables
│
└── frontend/
    ├── src/
    │   ├── pages/                # Page components
    │   │   ├── HomePage.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── SignupPage.jsx
    │   │   ├── RiderDashboard.jsx
    │   │   ├── DriverDashboard.jsx
    │   │   └── AdminDashboard.jsx
    │   ├── components/           # Reusable components
    │   │   ├── Navbar.jsx
    │   │   ├── RideCard.jsx
    │   │   ├── BookRide.jsx
    │   │   ├── TripReceipt.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── services/
    │   │   ├── api.js           # Axios API client
    │   │   └── socket.js        # Socket.io client
    │   ├── styles/              # CSS files
    │   │   └── *.css
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    ├── vite.config.js
    └── index.html
```

---

## 🗄️ Database Schema

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR(100) | User name |
| email | VARCHAR(100) | Unique email |
| password | VARCHAR(255) | Hashed password |
| phone | VARCHAR(15) | Phone number |
| role | VARCHAR(20) | 'user' or 'admin' |
| status | VARCHAR(20) | 'active' or 'inactive' |
| created_at | TIMESTAMP | Account creation time |

### Drivers Table
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR(100) | Driver name |
| car_number | VARCHAR(20) | Unique car number |
| status | VARCHAR(20) | 'available' or 'busy' |
| latitude | DECIMAL(10,8) | Current latitude |
| longitude | DECIMAL(11,8) | Current longitude |
| rating | DECIMAL(3,2) | Average rating (0-5) |
| total_trips | INT | Completed trips count |
| created_at | TIMESTAMP | Registration time |

### Rides Table
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| rider_id | INT | FK to users |
| driver_id | INT | FK to drivers |
| pickup | VARCHAR(255) | Pickup location |
| destination | VARCHAR(255) | Destination location |
| status | VARCHAR(20) | pending/accepted/started/ended |
| fare | DECIMAL(10,2) | Trip fare in ₹ |
| trip_duration_minutes | INT | Trip duration |
| started_at | TIMESTAMP | Trip start time |
| ended_at | TIMESTAMP | Trip end time |
| created_at | TIMESTAMP | Booking time |

### Scheduled Rides Table
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| rider_id | INT | FK to users |
| pickup | VARCHAR(255) | Pickup location |
| destination | VARCHAR(255) | Destination location |
| scheduled_time | TIMESTAMP | Scheduled ride time |
| status | VARCHAR(20) | pending/active/canceled |
| created_at | TIMESTAMP | Booking time |

### Surge Pricing Table
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| area | VARCHAR(100) | Affected area |
| start_time | TIME | Surge start time |
| end_time | TIME | Surge end time |
| multiplier | DECIMAL(4, 2) | Surge multiplier |
| is_active | BOOLEAN | Active status |
| created_at | TIMESTAMP | Creation time |

### Receipts Table
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| ride_id | INT | FK to rides |
| receipt_number | VARCHAR(50) | Unique receipt number |
| amount | DECIMAL(10, 2) | Amount in ₹ |
| pickup | VARCHAR(255) | Pickup location |
| destination | VARCHAR(255) | Destination location |
| duration_minutes | INT | Trip duration in minutes |
| created_at | TIMESTAMP | Creation time |

---

## 🔄 How It Works

### Complete Ride Booking Flow

```
1. RIDER BOOKS RIDE
   ↓
   User enters pickup/destination with GPS coordinates
   System calculates fare based on distance + surge pricing
   Ride status → 'pending'

2. DRIVER MATCHING
   ↓
   Backend finds nearest available driver using Haversine formula
   Driver receives notification via Socket.io
   Driver has 30 seconds to accept/reject

3. DRIVER ACCEPTS
   ↓
   Ride status → 'accepted'
   Rider sees driver details and live location

4. REAL-TIME TRACKING
   ↓
   Driver's location emitted every 3-5 seconds via Socket.io
   Rider sees driver approaching on map in real-time

5. START TRIP
   ↓
   Driver clicks "Start Trip" with GPS coordinates
   Ride status → 'started'
   Trip start time recorded

6. END TRIP
   ↓
   Driver clicks "End Trip" with GPS coordinates
   Ride status → 'ended'
   Trip duration calculated automatically
   Fare confirmed

7. RECEIPT
   ↓
   Rider views receipt on dashboard
   Shows: pickup, destination, duration, fare, driver info
   Can rate and review driver
```

---

## 🔐 Authentication

### JWT Flow
1. User registers → Password hashed with bcryptjs (salt: 10)
2. User logs in → Credentials verified → JWT token generated
3. Token stored in browser localStorage
4. All API calls include token in Authorization header: `Bearer <token>`
5. Backend verifies token signature and extracts user ID
6. Token expires after 8 hours (user must re-login)

### Protected Routes
Routes with ✅ require valid JWT token in Authorization header.

---

## 📡 Real-Time Features (Socket.io)

### Events
- **driver:join** - Driver comes online
- **driver:location** - Driver's GPS coordinates (every 3-5 seconds)
- **rider:join** - Rider waiting for driver
- **matching:ride-offer** - Server sends offer to driver
- **matching:driver-accept** - Driver accepts ride
- **matching:driver-reject** - Driver rejects ride
- **disconnect** - Driver/Rider goes offline

---

## 🧪 Testing Credentials

### Test User
- **Email**: `user@test.com`
- **Password**: `password123`

### Test Driver
- **Car Number**: `HR-26-AA-1234`

### Test Admin
- **Email**: `admin@test.com`
- **Password**: `admin123`

---

## 🔧 Troubleshooting

### Database Connection Failed
**Solution**:
1. Check PostgreSQL is running
2. Verify .env credentials (DB_USER, DB_PASS, DB_PORT)
3. Ensure 'uberclone' database exists

### Port 5000 Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID {PID} /F

# Change port in .env if needed
port=5001
```

### CORS Errors
- Check backend is running on port 5000
- Frontend should be on port 5173
- Verify CORS enabled in `server.js`

### Map Not Showing
- Check geolocation is enabled in browser
- Verify Leaflet and OpenStreetMap libraries loaded
- Check browser console for errors

### Socket.io Not Connecting
- Verify backend Socket.io is initialized
- Check firewall settings
- Check browser DevTools Console for errors

### Email Not Sending
- Generate app password at https://myaccount.google.com/apppasswords
- Use app password (not regular password) in `.env`
- Verify EMAIL_USER and EMAIL_PASSWORD are correct

### Ride Accept Button Not Working
- Verify driver is authenticated (valid token)
- Check backend logs for errors
- Ensure ride status is 'pending'
- Verify ride ID is correct

---

## 📝 Notes

- All passwords hashed with bcryptjs (salt: 10)
- JWT tokens expire in 8 hours
- Surge pricing applied during booking calculation
- Socket.io emits location every 3-5 seconds
- Trip duration calculated in minutes
- Fares in Indian Rupees (₹)
- Distance calculated using Haversine formula

---



## 📄 License

Educational project - Free for learning purposes

---

## 🔗 Important Links

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **GitHub**: https://github.com/Muskanyadav22/uber_clone

---

**Last Updated**: November 17, 2025  
**Status**: ✅ Production Ready (14/16 features completed)
