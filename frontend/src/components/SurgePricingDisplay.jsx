import { useEffect, useState } from "react";
import API from "../services/api";

export default function SurgePricingDisplay() {
  const [surge, setSurge] = useState(null);
  const [baseFare, setBaseFare] = useState(100);
  const [calculatedFare, setCalculatedFare] = useState(null);
  const [area, setArea] = useState("default");
  const [loading, setLoading] = useState(false);

  // Fetch current surge multiplier
  useEffect(() => {
    const fetchSurge = async () => {
      try {
        const res = await API.get(`/surge-pricing/current?area=${area}`);
        setSurge(res.data);
      } catch (err) {
        console.error("Failed to fetch surge:", err);
      }
    };

    fetchSurge();
    const interval = setInterval(fetchSurge, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [area]);

  // Calculate fare with surge
  const handleCalculateFare = async () => {
    if (baseFare <= 0) {
      alert("Please enter a valid base fare");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/surge-pricing/calculate", {
        baseFare: parseFloat(baseFare),
        area
      });
      setCalculatedFare(res.data);
    } catch (err) {
      alert("Failed to calculate fare: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      borderRadius: "12px",
      padding: "20px",
      marginBottom: "20px",
      color: "white"
    }}>
      <h3 style={{ marginTop: 0, marginBottom: "16px" }}>⚡ Surge Pricing</h3>

      {surge && (
        <div style={{
          background: "rgba(255,255,255,0.1)",
          padding: "12px",
          borderRadius: "8px",
          marginBottom: "16px",
          backdropFilter: "blur(10px)"
        }}>
          <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
            Current Multiplier: {surge.multiplier.toFixed(2)}x
          </div>
          <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
            {surge.reason}
          </div>
          <div style={{ fontSize: "0.85rem", opacity: 0.8, marginTop: "4px" }}>
            Last updated: {new Date(surge.applied_at).toLocaleTimeString()}
          </div>
        </div>
      )}

      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "6px", fontSize: "0.9rem" }}>
          Area:
        </label>
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "6px",
            border: "none",
            background: "rgba(255,255,255,0.2)",
            color: "white",
            fontWeight: "500"
          }}
        >
          <option value="default" style={{ color: "#333" }}>Default Area</option>
          <option value="downtown" style={{ color: "#333" }}>Downtown</option>
          <option value="airport" style={{ color: "#333" }}>Airport</option>
          <option value="suburbs" style={{ color: "#333" }}>Suburbs</option>
        </select>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "6px", fontSize: "0.9rem" }}>
          Base Fare (₹):
        </label>
        <input
          type="number"
          value={baseFare}
          onChange={(e) => setBaseFare(e.target.value)}
          placeholder="Enter base fare"
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "6px",
            border: "none",
            boxSizing: "border-box"
          }}
        />
      </div>

      <button
        onClick={handleCalculateFare}
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px",
          background: loading ? "#999" : "#fff",
          color: loading ? "#666" : "#667eea",
          border: "none",
          borderRadius: "6px",
          fontWeight: "bold",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "all 0.3s ease"
        }}
        onMouseEnter={(e) => {
          if (!loading) e.target.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          if (!loading) e.target.style.transform = "translateY(0)";
        }}
      >
        {loading ? "Calculating..." : "Calculate Final Fare"}
      </button>

      {calculatedFare && (
        <div style={{
          marginTop: "16px",
          background: "rgba(255,255,255,0.15)",
          padding: "12px",
          borderRadius: "8px",
          border: "2px solid rgba(255,255,255,0.3)"
        }}>
          <div style={{ marginBottom: "8px" }}>
            <span style={{ opacity: 0.9 }}>Base Fare: </span>
            <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>₹{calculatedFare.baseFare}</span>
          </div>
          <div style={{ marginBottom: "8px" }}>
            <span style={{ opacity: 0.9 }}>Multiplier: </span>
            <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{calculatedFare.multiplier.toFixed(2)}x</span>
          </div>
          <div style={{
            paddingTop: "8px",
            borderTop: "1px solid rgba(255,255,255,0.3)",
            marginTop: "8px"
          }}>
            <span style={{ opacity: 0.9 }}>Final Fare: </span>
            <span style={{ fontWeight: "bold", fontSize: "1.3rem", color: "#ffeb3b" }}>
              ₹{calculatedFare.surgeFare}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
