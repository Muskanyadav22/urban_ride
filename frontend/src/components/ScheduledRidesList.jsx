import { useEffect, useState } from "react";
import API from "../services/api";

export default function ScheduledRidesList() {
  const [scheduledRides, setScheduledRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchScheduledRides();
  }, []);

  const fetchScheduledRides = async () => {
    try {
      const res = await API.get("/scheduled-rides/my-schedules");
      setScheduledRides(res.data);
    } catch (err) {
      setError("Failed to load scheduled rides");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRide = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this scheduled ride?")) {
      return;
    }

    try {
      await API.post(`/scheduled-rides/${id}/cancel`);
      alert("✅ Scheduled ride cancelled");
      fetchScheduledRides();
    } catch (err) {
      alert("Failed to cancel ride: " + (err.response?.data?.error || err.message));
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      scheduled: { bg: "#e3f2fd", color: "#1976d2", label: "📋 Scheduled" },
      confirmed: { bg: "#f3e5f5", color: "#7b1fa2", label: "✅ Confirmed" },
      completed: { bg: "#e8f5e9", color: "#388e3c", label: "✓ Completed" },
      cancelled: { bg: "#ffebee", color: "#c62828", label: "✕ Cancelled" }
    };

    const style = statusStyles[status] || statusStyles.scheduled;
    return (
      <span style={{
        background: style.bg,
        color: style.color,
        padding: "4px 12px",
        borderRadius: "20px",
        fontSize: "0.85rem",
        fontWeight: "600"
      }}>
        {style.label}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) return <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>Loading scheduled rides...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h3 style={{ marginTop: 0, marginBottom: "16px" }}>📅 Scheduled Rides</h3>

      {error && (
        <div style={{
          padding: "12px",
          background: "#ffcdd2",
          color: "#c62828",
          borderRadius: "6px",
          marginBottom: "16px"
        }}>
          {error}
        </div>
      )}

      {scheduledRides.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "40px 20px",
          background: "#f5f5f5",
          borderRadius: "8px",
          color: "#999"
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📭</div>
          <p style={{ margin: 0 }}>No scheduled rides yet</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {scheduledRides.map((ride) => (
            <div
              key={ride.id}
              style={{
                background: "white",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                padding: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "all 0.3s ease",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: "12px", marginBottom: "8px", alignItems: "center" }}>
                  <span style={{ fontSize: "1.2rem" }}>🚗</span>
                  <div>
                    <div style={{ fontWeight: "600", color: "#333" }}>
                      {ride.pickup} → {ride.destination}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#999", marginTop: "4px" }}>
                      📅 {formatDate(ride.scheduled_time)}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "8px" }}>
                  {getStatusBadge(ride.status)}
                  {ride.driver_name && (
                    <span style={{ fontSize: "0.9rem", color: "#666" }}>
                      👤 {ride.driver_name}
                    </span>
                  )}
                  {ride.estimated_fare && (
                    <span style={{ fontSize: "0.9rem", color: "#666", fontWeight: "600" }}>
                      ₹{ride.estimated_fare}
                    </span>
                  )}
                </div>
              </div>

              {["scheduled", "confirmed"].includes(ride.status) && (
                <button
                  onClick={() => handleCancelRide(ride.id)}
                  style={{
                    padding: "8px 16px",
                    background: "#ffebee",
                    color: "#c62828",
                    border: "1px solid #ef5350",
                    borderRadius: "6px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    fontSize: "0.9rem"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "#ffcdd2";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "#ffebee";
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
