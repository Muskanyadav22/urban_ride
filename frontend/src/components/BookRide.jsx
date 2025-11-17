import { useState, useEffect } from "react";
import API from "../services/api";

export default function BookRide() {
  const [form, setForm] = useState({ 
    pickup: "", 
    destination: "",
    pickup_lat: null,
    pickup_lng: null,
    dest_lat: null,
    dest_lng: null
  });
  const [fare, setFare] = useState(null);
  const [distance, setDistance] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [calculatingFare, setCalculatingFare] = useState(false);

  // Get current location for pickup
  const getPickupLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser");
      return;
    }
    
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setForm(prev => ({
          ...prev,
          pickup: `📍 Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          pickup_lat: latitude,
          pickup_lng: longitude
        }));
        setError("");
        setLoading(false);
      },
      (err) => {
        setError(`Location error: ${err.message}`);
        setLoading(false);
      }
    );
  };

  // Calculate fare when both pickup and destination are provided
  useEffect(() => {
    const calculateFarePreview = async () => {
      if (form.pickup_lat && form.pickup_lng && form.dest_lat && form.dest_lng) {
        setCalculatingFare(true);
        try {
          // Calculate haversine distance on frontend
          const toRad = (deg) => deg * Math.PI / 180;
          const R = 6371; // km
          const dLat = toRad(form.dest_lat - form.pickup_lat);
          const dLon = toRad(form.dest_lng - form.pickup_lng);
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
                    Math.cos(toRad(form.pickup_lat)) * Math.cos(toRad(form.dest_lat)) * 
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distKm = R * c;
          
          // Calculate fare: ₹50 base + ₹20/km + ₹20 booking fee
          const calculatedFare = Math.round(50 + distKm * 20 + 20);
          
          setDistance(distKm.toFixed(2));
          setFare(calculatedFare);
        } catch (err) {
          console.error('Fare calculation error:', err);
        } finally {
          setCalculatingFare(false);
        }
      }
    };

    calculateFarePreview();
  }, [form.pickup_lat, form.pickup_lng, form.dest_lat, form.dest_lng]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setError("");
  };

  const handleDestinationChange = (e) => {
    const dest = e.target.value;
    setForm(prev => ({ ...prev, destination: dest }));
    setError("");
    // In a real app, you'd use a geocoding API here
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.pickup || !form.destination) {
      setError("Please enter both pickup and destination");
      return;
    }

    // Note: If no destination coordinates, backend will use fallback fare calculation
    if (!form.pickup_lat || !form.pickup_lng) {
      setError("Please click 📍 to get your current location");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const res = await API.post("/rides", {
        pickup: form.pickup,
        destination: form.destination,
        pickup_lat: form.pickup_lat,
        pickup_lng: form.pickup_lng,
        dest_lat: form.dest_lat,
        dest_lng: form.dest_lng
      });
      
      setSuccess(`Ride booked! Fare: ₹${res.data.fare}`);
      setForm({ 
        pickup: "", 
        destination: "",
        pickup_lat: null,
        pickup_lng: null,
        dest_lat: null,
        dest_lng: null
      });
      setFare(null);
      setDistance(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error('Book ride error:', err);
      setError(err.response?.data?.error || err.response?.data?.message || "Failed to book ride");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Book a Ride</h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div style={{ position: 'relative' }}>
          <input 
            type="text" 
            name="pickup" 
            placeholder="Pickup Location" 
            value={form.pickup}
            onChange={handleChange} 
            required 
          />
          <button 
            type="button"
            onClick={getPickupLocation}
            disabled={loading}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}
            title="Use current location"
          >
            📍
          </button>
        </div>

        <input 
          type="text" 
          name="destination" 
          placeholder="Destination" 
          value={form.destination}
          onChange={handleDestinationChange} 
          required 
        />

        {/* Fare Preview */}
        {fare && distance && (
          <div style={{
            background: '#f0f7ff',
            border: '2px solid #667eea',
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: 4 }}>
              📍 Distance: {distance} km
            </div>
            <div style={{ 
              fontSize: '1.4rem', 
              fontWeight: 'bold', 
              color: '#667eea'
            }}>
              Estimated Fare: ₹{fare}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#999', marginTop: 4 }}>
              Base ₹50 + ₹20/km + ₹20 booking fee
            </div>
          </div>
        )}

        {calculatingFare && (
          <div style={{ textAlign: 'center', color: '#667eea', marginBottom: 12 }}>
            Calculating fare...
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Booking Ride..." : `Book Ride${fare ? ` - ₹${fare}` : ''}`}
        </button>
      </form>
    </div>
  );
}