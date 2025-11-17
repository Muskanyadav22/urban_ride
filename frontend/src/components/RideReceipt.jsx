import React, { useEffect, useState } from "react";
import "./RideReceipt.css";

const RideReceipt = ({ rideId, onClose }) => {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetchReceipt();
  }, [rideId]);

  const fetchReceipt = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/receipts/ride/${rideId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setReceipt(data.receipt);
      } else {
        setError(data.message || "Failed to fetch receipt");
      }
    } catch (err) {
      console.error("Error fetching receipt:", err);
      setError("Error fetching receipt");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!receipt) return;

    try {
      setSendingEmail(true);
      const response = await fetch(`/api/receipts/${receipt.id}/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (data.success) {
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000);
      } else {
        alert("Failed to send email: " + data.message);
      }
    } catch (err) {
      console.error("Error sending email:", err);
      alert("Error sending email");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDownloadPDF = () => {
    // In a real implementation, this would generate a PDF
    window.open(`/api/receipts/${receipt?.id}/view`, "_blank");
  };

  if (loading) {
    return (
      <div className="receipt-modal">
        <div className="receipt-container">
          <div className="loading">Loading receipt...</div>
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="receipt-modal">
        <div className="receipt-container">
          <div className="error-message">{error || "No receipt found"}</div>
          <button onClick={onClose} className="btn-close">
            Close
          </button>
        </div>
      </div>
    );
  }

  const surgeActive = receipt.surge_multiplier > 1;

  return (
    <div className="receipt-modal" onClick={onClose}>
      <div className="receipt-container" onClick={(e) => e.stopPropagation()}>
        <button className="btn-close-x" onClick={onClose}>
          ✕
        </button>

        <div className="receipt-header">
          <h1>🚗 Trip Receipt</h1>
          <p className="receipt-number">Receipt #{receipt.receipt_number}</p>
        </div>

        <div className="receipt-content">
          <div className="receipt-section location-section">
            <div className="location-row">
              <span className="location-icon">📍</span>
              <div className="location-details">
                <p className="location-label">Pickup</p>
                <p className="location-text">{receipt.pickup}</p>
              </div>
            </div>

            <div className="route-line"></div>

            <div className="location-row">
              <span className="location-icon">🗺️</span>
              <div className="location-details">
                <p className="location-label">Destination</p>
                <p className="location-text">{receipt.destination}</p>
              </div>
            </div>
          </div>

          <div className="receipt-section trip-details">
            <div className="detail-row">
              <span>👤 Driver</span>
              <strong>{receipt.driver_name}</strong>
            </div>
            <div className="detail-row">
              <span>📏 Distance</span>
              <strong>{receipt.distance_km} km</strong>
            </div>
            <div className="detail-row">
              <span>📅 Date</span>
              <strong>{new Date(receipt.created_at).toLocaleDateString()}</strong>
            </div>
            <div className="detail-row">
              <span>🕐 Time</span>
              <strong>{new Date(receipt.created_at).toLocaleTimeString()}</strong>
            </div>
          </div>

          <div className="receipt-section fare-section">
            <div className="fare-row">
              <span>Base Fare</span>
              <span>₹{receipt.base_fare}</span>
            </div>

            {surgeActive && (
              <>
                <div className="fare-row surge-highlight">
                  <span>Surge Pricing ({receipt.surge_multiplier}x)</span>
                  <span>₹{receipt.surge_amount}</span>
                </div>
                <div className="surge-badge">⚡ Surge pricing applied</div>
              </>
            )}

            <div className="fare-divider"></div>

            <div className="fare-row fare-total">
              <span>Total Fare</span>
              <span>₹{receipt.final_fare}</span>
            </div>

            <div className="detail-row">
              <span>Payment Method</span>
              <strong>{receipt.payment_method}</strong>
            </div>

            <div className="detail-row">
              <span>Status</span>
              <strong
                className={`status-badge status-${receipt.payment_status}`}
              >
                {receipt.payment_status.toUpperCase()}
              </strong>
            </div>
          </div>

          {receipt.email_sent && (
            <div className="email-status">
              ✓ Receipt sent to {receipt.rider_email}
            </div>
          )}
        </div>

        <div className="receipt-actions">
          <button
            className="btn btn-email"
            onClick={handleSendEmail}
            disabled={sendingEmail}
          >
            {sendingEmail ? "Sending..." : "📧 Send Email"}
          </button>
          <button className="btn btn-download" onClick={handleDownloadPDF}>
            📥 Download PDF
          </button>
          <button className="btn btn-close-modal" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="receipt-footer">
          <p>Thank you for your ride! 🙏</p>
          <p className="small-text">This receipt was generated by UberClone</p>
        </div>
      </div>
    </div>
  );
};

export default RideReceipt;
