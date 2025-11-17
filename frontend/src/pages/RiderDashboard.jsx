import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import RideCard from "../components/RideCard";
import RiderProfile from "../components/RiderProfile";
import BookRide from "../components/BookRide";
import LiveMap from "../components/LiveMap";
import SurgePricingDisplay from "../components/SurgePricingDisplay";
import ScheduleRideModal from "../components/ScheduleRideModal";
import ScheduledRidesList from "../components/ScheduledRidesList";
import TripReceipt from "../components/TripReceipt";
import ErrorBoundary from "../components/ErrorBoundary";
import socket from "../services/socket";

// Helper to calculate trip duration live
const getTripDuration = (startTime) => {
  if (!startTime) return '0';
  const start = new Date(startTime);
  const now = new Date();
  const minutes = Math.floor((now - start) / 60000);
  return minutes;
};

export default function RiderDashboard() {
  const [rides, setRides] = useState([]);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ totalRides: 0, totalSpent: 0 });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [liveDrivers, setLiveDrivers] = useState({});
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [tripDuration, setTripDuration] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRides();
    fetchProfile();
  }, []);

  // Track active trip and update duration every second
  useEffect(() => {
    if (rides.length > 0) {
      const activeTrip = rides.find(r => r.status === 'started' || r.status === 'pending' || r.status === 'accepted' || r.status === 'ended');
      setCurrentTrip(activeTrip || null);
    }
  }, [rides]);

  useEffect(() => {
    if (!currentTrip || currentTrip.status !== 'started') return;
    
    const interval = setInterval(() => {
      setTripDuration(getTripDuration(currentTrip.started_at));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [currentTrip]);

  useEffect(() => {
    // join riders room to receive driver location updates
    socket.emit('rider:join', {});

    const handler = (data) => {
      // data: { driverId, lat, lng, timestamp }
      // For now, we push to a temporary list of liveDrivers
      setLiveDrivers((prev) => {
        const next = { ...(prev || {}) };
        next[data.driverId] = data;
        return next;
      });
    };

    socket.on('driver:location', handler);

    return () => {
      socket.off('driver:location', handler);
    };
  }, []);

  const fetchRides = async () => {
    try {
      const res = await API.get("/rides");
      setRides(res.data || []);
      
      // Calculate stats
      const totalSpent = (res.data || []).reduce((sum, ride) => {
        const fare = parseFloat(ride.fare) || 0;
        return sum + fare;
      }, 0);
      
      setStats({
        totalRides: (res.data || []).length,
        totalSpent: totalSpent.toFixed(2)
      });
    } catch (err) {
      console.error('Fetch rides error:', err);
      setRides([]);
      setError("Failed to load rides: " + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await API.get("/users/me");
      setProfile(res.data || {});
    } catch (err) {
      console.warn("Failed to fetch profile:", err.message);
      setProfile(null); // Continue without profile
    }
  };

  const handleExport = async () => {
    try {
      const res = await API.get('/rides/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'rides.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Export rides error:', err);
      // Prefer a detailed message: server error, HTTP status, or network error
      const status = err.response?.status;
      const apiMsg = err.response?.data?.error || err.response?.data?.message;
      if (err.request && !err.response) {
        setError('Network Error: could not reach backend (is server running?)');
      } else {
        setError((status ? `Error ${status}: ` : '') + (apiMsg || err.message || 'Failed to export rides'));
      }
    }
  };

  if (loading) return (
    <div className="loading" style={{ padding: '40px', textAlign: 'center', fontSize: '18px' }}>
      <p>⏳ Loading your dashboard...</p>
      <p style={{ fontSize: '14px', color: '#999', marginTop: '10px' }}>Fetching rides and profile data...</p>
    </div>
  );

  return (
    <div className="dashboard" style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>🚗 Rider Dashboard</h2>
      
      {/* Rider Profile Card */}
      {profile && (
        <RiderProfile 
          profile={profile} 
          stats={stats}
          onEditClick={() => navigate('/profile')}
        />
      )}
      {/* Surge Pricing Display */}
      <div style={{ marginBottom: '20px' }}>
        <ErrorBoundary>
          <SurgePricingDisplay />
        </ErrorBoundary>
      </div>

      {/* Live drivers quick view */}
      <div style={{ margin: '12px 0 20px 0' }}>
        {Object.keys(liveDrivers || {}).length > 0 ? (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {Object.entries(liveDrivers || {}).slice(0,5).map(([id, d]) => (
              <div key={id} style={{ padding: '8px 12px', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                🚗 Driver {id} — {d.lat.toFixed(4)}, {d.lng.toFixed(4)}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#666', fontSize: '0.9rem' }}>No live drivers nearby</div>
        )}
      </div>

      {/* Live Map - shows driver markers moving in real-time */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '12px', color: '#333' }}>🗺️ Live Driver Locations</h3>
        <ErrorBoundary>
          <LiveMap 
            liveDrivers={liveDrivers || {}}
            userLocation={profile?.location}
            destination={null}
          />
        </ErrorBoundary>
      </div>

      {/* Error Message */}
      {error && <div style={{
        padding: '12px 16px',
        background: '#ffcdd2',
        color: '#c62828',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '2px solid #f44336'
      }}>
        ❌ {error}
      </div>}
      
      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <ErrorBoundary>
          <BookRide />
        </ErrorBoundary>
        <button
          onClick={() => setShowScheduleModal(true)}
          style={{
            background: '#4caf50',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.background = '#45a049'}
          onMouseLeave={(e) => e.target.style.background = '#4caf50'}
        >
          📅 Schedule Ride
        </button>
        <button className="btn btn-outline" onClick={handleExport} style={{
          background: '#f0f0f0',
          color: '#333',
          border: '2px solid #ddd',
          padding: '10px 20px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = '#e0e0e0';
          e.target.style.borderColor = '#bbb';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = '#f0f0f0';
          e.target.style.borderColor = '#ddd';
        }}
        >
          📥 Export Rides
        </button>
      </div>

      {/* Current Trip Status Display */}
      {currentTrip && (
        <ErrorBoundary>
          <div className="dashboard-section" style={{
            marginBottom: '20px',
            padding: '16px',
            background: '#f0f7ff',
            borderLeft: '4px solid #2196f3',
            borderRadius: '8px'
          }}>
            <h3 style={{ marginTop: 0, color: '#1976d2' }}>🚗 Current Trip Status</h3>
            
            {currentTrip.status === 'pending' && (
              <div style={{ color: '#f57c00', fontSize: '15px' }}>
                <p>⏳ <strong>Waiting for driver acceptance...</strong></p>
                <p>From: <strong>{currentTrip.pickup}</strong></p>
                <p>To: <strong>{currentTrip.destination}</strong></p>
                <p>Estimated Fare: <strong>₹{currentTrip.fare}</strong></p>
              </div>
            )}
            
            {currentTrip.status === 'accepted' && (
              <div style={{ color: '#1976d2', fontSize: '15px' }}>
                <p>🚗 <strong>Driver is coming to pick you up...</strong></p>
                <p>Driver: <strong>{currentTrip.driver_name || 'En route'}</strong></p>
                <p>From: <strong>{currentTrip.pickup}</strong></p>
                <p>To: <strong>{currentTrip.destination}</strong></p>
              </div>
            )}
            
            {currentTrip.status === 'started' && currentTrip.started_at && (
              <div style={{ color: '#388e3c', fontSize: '15px', lineHeight: '1.6' }}>
                <p>✅ <strong>Trip Started!</strong></p>
                <p>Started at: <strong>{new Date(currentTrip.started_at).toLocaleTimeString()}</strong></p>
                <p style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  padding: '8px 12px',
                  background: 'rgba(56, 142, 60, 0.1)',
                  borderRadius: '6px',
                  display: 'inline-block'
                }}>
                  ⏱️ Duration: <span style={{ color: '#ff6f00' }}>{tripDuration}</span> minutes
                </p>
                {currentTrip.started_location_lat && (
                  <p>📍 Picked up at: ({parseFloat(currentTrip.started_location_lat).toFixed(4)}, {parseFloat(currentTrip.started_location_lng).toFixed(4)})</p>
                )}
                <p>Destination: <strong>{currentTrip.destination}</strong></p>
              </div>
            )}
            
            {currentTrip.status === 'ended' && currentTrip.ended_at && (
              <div style={{ color: '#c62828', fontSize: '15px', lineHeight: '1.6' }}>
                <p>🏁 <strong>Trip Completed!</strong></p>
                <p>Ended at: <strong>{new Date(currentTrip.ended_at).toLocaleTimeString()}</strong></p>
                <p>⏱️ Duration: <strong>{currentTrip.trip_duration_minutes || 0} minutes</strong></p>
                <p>💰 Fare: <strong style={{ fontSize: '16px', color: '#ff6f00' }}>₹{currentTrip.fare}</strong></p>
                {currentTrip.ended_location_lat && (
                  <p>📍 Dropped off at: ({parseFloat(currentTrip.ended_location_lat).toFixed(4)}, {parseFloat(currentTrip.ended_location_lng).toFixed(4)})</p>
                )}
              </div>
            )}
          </div>
        </ErrorBoundary>
      )}

      {/* Trip Receipt - Shows when trip is ended */}
      {currentTrip && currentTrip.status === 'ended' && (
        <ErrorBoundary>
          <TripReceipt trip={currentTrip} />
        </ErrorBoundary>
      )}

      {/* Schedule Ride Modal */}
      {showScheduleModal && (
        <ScheduleRideModal
          onClose={() => setShowScheduleModal(false)}
          onSuccess={() => {
            setShowScheduleModal(false);
            // Optionally refresh scheduled rides list
          }}
        />
      )}

      {/* Scheduled Rides Section */}
      <div className="dashboard-section" style={{ marginBottom: '20px', background: '#f9f9f9', borderRadius: '8px', padding: '16px' }}>
        <ErrorBoundary>
          <ScheduledRidesList key={Math.random()} />
        </ErrorBoundary>
      </div>
      <div className="dashboard-section">
        <h3>Your Rides</h3>
        <div className="card-container">
          {rides && rides.length > 0 ? (
            rides.map((ride) => (
              <RideCard key={ride.id} ride={ride} />
            ))
          ) : (
            <div className="card">
              <h3>No rides yet</h3>
              <p>Book your first ride to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}