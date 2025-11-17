import { useEffect, useState } from "react";
import API from "../services/api";

export default function ScheduleRideModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    pickup: "",
    destination: "",
    scheduled_time: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Set minimum datetime to now + 30 minutes
  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    const minDateTime = now.toISOString().slice(0, 16);
    setFormData(prev => ({ ...prev, min_time: minDateTime }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleScheduleRide = async (e) => {
    e.preventDefault();

    if (!formData.pickup || !formData.destination || !formData.scheduled_time) {
      setError("All fields are required");
      return;
    }

    const scheduledDate = new Date(formData.scheduled_time);
    if (scheduledDate <= new Date()) {
      setError("Scheduled time must be at least 30 minutes from now");
      return;
    }

    setLoading(true);
    try {
      await API.post("/scheduled-rides", {
        pickup: formData.pickup,
        destination: formData.destination,
        scheduled_time: scheduledDate.toISOString()
      });

      alert("✅ Ride scheduled successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to schedule ride");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }}>
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "24px",
        maxWidth: "500px",
        width: "90%",
        boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0 }}>📅 Schedule Your Ride</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#666"
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{
            padding: "12px",
            background: "#ffcdd2",
            color: "#c62828",
            borderRadius: "6px",
            marginBottom: "16px",
            border: "1px solid #ef5350"
          }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleScheduleRide}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", color: "#333" }}>
              Pickup Location
            </label>
            <input
              type="text"
              name="pickup"
              value={formData.pickup}
              onChange={handleChange}
              placeholder="e.g., Home, 123 Main St"
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                boxSizing: "border-box",
                fontSize: "14px"
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", color: "#333" }}>
              Destination
            </label>
            <input
              type="text"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              placeholder="e.g., Office, 456 Oak Ave"
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                boxSizing: "border-box",
                fontSize: "14px"
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", color: "#333" }}>
              Scheduled Time
            </label>
            <input
              type="datetime-local"
              name="scheduled_time"
              value={formData.scheduled_time}
              onChange={handleChange}
              min={formData.min_time}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                boxSizing: "border-box",
                fontSize: "14px"
              }}
            />
            <div style={{ fontSize: "0.85rem", color: "#999", marginTop: "4px" }}>
              Minimum 30 minutes from now
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "12px",
                background: "#f0f0f0",
                color: "#333",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => e.target.style.background = "#e0e0e0"}
              onMouseLeave={(e) => e.target.style.background = "#f0f0f0"}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: "12px",
                background: loading ? "#999" : "#667eea",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                if (!loading) e.target.style.background = "#5568d3";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.target.style.background = "#667eea";
              }}
            >
              {loading ? "Scheduling..." : "Schedule Ride"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
