import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import RideCard from "../components/RideCard";
import DriverProfileCard from "../components/DriverProfileCard";
import socket from "../services/socket";

export default function DriverDashboard() {
  const [pendingRides, setPendingRides] = useState([]);
  const [myRides, setMyRides] = useState([]);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ totalRides: 0, totalEarnings: 0, avgRating: 0 });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRides();
    fetchProfile();
  }, []);

  // start emitting driver location when profile is loaded and role is driver
  const geoWatchId = useRef(null);
  useEffect(() => {
    if (!profile) return;
    if (profile.role !== 'driver') return;

    // inform server this socket belongs to a driver
    socket.emit('driver:join', { driverId: profile.id });

    // use geolocation to watch position and emit
    if (navigator.geolocation) {
      geoWatchId.current = navigator.geolocation.watchPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        socket.emit('driver:location', { driverId: profile.id, lat, lng, timestamp: Date.now() });
      }, (err) => {
        console.warn('Geolocation error:', err.message);
      }, { enableHighAccuracy: true, maximumAge: 3000, timeout: 5000 });
    }

    return () => {
      if (geoWatchId.current && navigator.geolocation) {
        navigator.geolocation.clearWatch(geoWatchId.current);
      }
    };
  }, [profile]);

  const fetchRides = async () => {
    try {
      const [pendingRes, myRidesRes] = await Promise.all([
        API.get("/rides/pending/all"),
        API.get("/drivers/rides")
      ]);
      setPendingRides(pendingRes.data || []);
      setMyRides(myRidesRes.data || []);
      
      // Calculate stats
      const totalEarnings = (myRidesRes.data || []).reduce((sum, ride) => {
        const fare = parseFloat(ride.fare) || 0;
        return sum + fare;
      }, 0);
      
      const avgRating = (Math.random() * 2 + 3).toFixed(1); // Random 3-5 stars
      
      setStats({
        totalRides: (myRidesRes.data || []).length,
        totalEarnings: totalEarnings.toFixed(2),
        avgRating: avgRating
      });
    } catch (err) {
      console.error('Fetch rides error:', err);
      setPendingRides([]);
      setMyRides([]);
      setError("Failed to load rides: " + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await API.get("/drivers/profile");
      console.log('📊 Profile fetched:', res.data);
      setProfile(res.data || {});
    } catch (err) {
      console.warn("Failed to fetch driver profile:", err.message);
      setProfile(null); // Continue without profile
    }
  };
  const handleAccept = async (rideId) => {
    try {
      await API.patch(`/rides/${rideId}/accept`);
      setSuccess("Ride accepted successfully");
      fetchRides(); 
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to accept ride");
    }
  };

  const handleReject = async (rideId) => {
    try {
      await API.put(`/drivers/${rideId}/reject`);
      setSuccess("Ride rejected successfully");
      fetchRides(); 
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to reject ride");
    }
  };

  // Start trip - Driver picks up rider
  const handleStartTrip = async (rideId) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            const response = await API.post(
              `/rides/${rideId}/start`,
              { latitude, longitude }
            );
            
            console.log('✅ Trip started!', response.data);
            setSuccess("📍 Trip started! Driving to destination...");
            fetchRides();
            setTimeout(() => setSuccess(""), 3000);
          } catch (error) {
            console.error('Error starting trip:', error);
            setError("❌ Failed to start trip");
            setTimeout(() => setError(""), 3000);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setError("📍 Please enable geolocation to start trip");
          setTimeout(() => setError(""), 3000);
        }
      );
    } else {
      setError("Geolocation not supported on your device");
      setTimeout(() => setError(""), 3000);
    }
  };

  // End trip - Driver drops off rider
  const handleEndTrip = async (rideId) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            const response = await API.post(
              `/rides/${rideId}/end`,
              { latitude, longitude }
            );
            
            console.log('✅ Trip ended!', response.data);
            const duration = response.data.trip_duration_minutes || 0;
            const ride = response.data.ride;
            
            setSuccess(`🏁 Trip ended! Duration: ${duration} minutes | Fare: ₹${ride.fare}`);
            fetchRides();
            setTimeout(() => setSuccess(""), 5000);
          } catch (error) {
            console.error('Error ending trip:', error);
            setError("❌ Failed to end trip");
            setTimeout(() => setError(""), 3000);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setError("📍 Please enable geolocation to end trip");
          setTimeout(() => setError(""), 3000);
        }
      );
    } else {
      setError("Geolocation not supported on your device");
      setTimeout(() => setError(""), 3000);
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
      <h2 style={{ marginBottom: '20px' }}>🚕 Driver Dashboard</h2>
      
      {/* Driver Profile Card */}
      {profile && (
        <DriverProfileCard 
          profile={profile}
          stats={stats}
        />
      )}

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

      {/* Success Message */}
      {success && <div style={{
        padding: '12px 16px',
        background: '#c8e6c9',
        color: '#2e7d32',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '2px solid #4caf50'
      }}>
        ✅ {success}
      </div>}
      
      <div className="dashboard-section">
        <h3>Available Rides</h3>
        <div className="card-container">
          {pendingRides.length > 0 ? (
            pendingRides.map((ride) => (
              <RideCard 
                key={ride.id} 
                ride={ride} 
                onAccept={handleAccept}
                onReject={handleReject}
                showActions={true}
              />
            ))
          ) : (
            <div className="card">
              <h3>No pending rides</h3>
              <p>Check back later for new ride requests.</p>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-section">
        <h3>Your Rides</h3>
        <div className="card-container">
          {myRides.length > 0 ? (
            myRides.map((ride) => (
              <div key={ride.id} style={{ position: 'relative' }}>
                <RideCard ride={ride} />
                
                {/* Trip Control Buttons */}
                <div style={{ padding: '0 12px 12px 12px', display: 'flex', gap: '8px', flexDirection: 'column' }}>
                  {/* Start Trip Button - Show when ride accepted */}
                  {ride.status === 'accepted' && (
                    <button 
                      onClick={() => handleStartTrip(ride.id)}
                      style={{
                        width: '100%',
                        background: '#4caf50',
                        color: 'white',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#45a049'}
                      onMouseLeave={(e) => e.target.style.background = '#4caf50'}
                    >
                      📍 Start Trip (Picked up rider)
                    </button>
                  )}
                  
                  {/* End Trip Button - Show when trip started */}
                  {ride.status === 'started' && (
                    <button 
                      onClick={() => handleEndTrip(ride.id)}
                      style={{
                        width: '100%',
                        background: '#ff9800',
                        color: 'white',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#e68900'}
                      onMouseLeave={(e) => e.target.style.background = '#ff9800'}
                    >
                      🏁 End Trip (Dropped off rider)
                    </button>
                  )}
                  
                  {/* Trip Status Display - Started */}
                  {ride.status === 'started' && ride.started_at && (
                    <div style={{ 
                      padding: '10px', 
                      backgroundColor: '#e8f5e9',
                      borderRadius: '5px',
                      fontSize: '13px',
                      lineHeight: '1.5'
                    }}>
                      <p style={{ margin: '0 0 4px 0' }}>✅ <strong>Trip started</strong></p>
                      <p style={{ margin: '0 0 4px 0' }}>⏰ {new Date(ride.started_at).toLocaleTimeString()}</p>
                      {ride.started_location_lat && (
                        <p style={{ margin: '0' }}>📍 Pickup: {parseFloat(ride.started_location_lat).toFixed(4)}, {parseFloat(ride.started_location_lng).toFixed(4)}</p>
                      )}
                    </div>
                  )}
                  
                  {/* Trip Status Display - Ended */}
                  {ride.status === 'ended' && ride.ended_at && (
                    <div style={{
                      padding: '10px',
                      backgroundColor: '#fff3cd',
                      borderRadius: '5px',
                      fontSize: '13px',
                      lineHeight: '1.5'
                    }}>
                      <p style={{ margin: '0 0 4px 0' }}>🏁 <strong>Trip completed</strong></p>
                      <p style={{ margin: '0 0 4px 0' }}>⏰ {new Date(ride.ended_at).toLocaleTimeString()}</p>
                      <p style={{ margin: '0 0 4px 0' }}>⏱️ Duration: {ride.trip_duration_minutes || 0} minutes</p>
                      {ride.ended_location_lat && (
                        <p style={{ margin: '0' }}>📍 Dropoff: {parseFloat(ride.ended_location_lat).toFixed(4)}, {parseFloat(ride.ended_location_lng).toFixed(4)}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="card">
              <h3>No rides accepted yet</h3>
              <p>Accept a ride from the available rides above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}