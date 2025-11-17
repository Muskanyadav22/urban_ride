import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DriverOfferScreen.css";

const DriverOfferScreen = ({ socket, driverId }) => {
  const navigate = useNavigate();
  const [currentOffer, setCurrentOffer] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [offerHistory, setOfferHistory] = useState([]);

  useEffect(() => {
    if (!socket) return;

    // Listen for incoming ride offers
    socket.on("matching:ride-offer", (offer) => {
      console.log("New ride offer received:", offer);
      setCurrentOffer(offer);
      setTimeRemaining(offer.expires_in_seconds || 30);
      setIsCountingDown(true);
    });

    return () => {
      socket.off("matching:ride-offer");
    };
  }, [socket]);

  // Countdown timer
  useEffect(() => {
    if (!isCountingDown || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsCountingDown(false);
          setCurrentOffer(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCountingDown, timeRemaining]);

  const handleAcceptOffer = async () => {
    if (!currentOffer) return;

    try {
      const response = await fetch("/api/matching/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          queue_id: currentOffer.queue_id,
          driver_id: driverId
        })
      });

      const data = await response.json();

      if (data.success) {
        // Emit acceptance via Socket.io
        socket.emit("matching:driver-accept", {
          driverId: driverId,
          queueId: currentOffer.queue_id,
          rideId: currentOffer.ride_id,
          riderId: currentOffer.rider_id
        });

        // Add to history
        setOfferHistory([
          { ...currentOffer, status: "accepted", timestamp: new Date() },
          ...offerHistory
        ]);

        setCurrentOffer(null);
        setIsCountingDown(false);

        // Navigate to active ride screen
        navigate(`/driver/active-ride/${data.ride_id}`);
      } else {
        alert("Failed to accept offer: " + data.message);
      }
    } catch (error) {
      console.error("Error accepting offer:", error);
      alert("Error accepting offer");
    }
  };

  const handleRejectOffer = async () => {
    if (!currentOffer) return;

    try {
      const response = await fetch("/api/matching/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          queue_id: currentOffer.queue_id,
          driver_id: driverId
        })
      });

      const data = await response.json();

      if (data.success) {
        // Emit rejection via Socket.io
        socket.emit("matching:driver-reject", {
          driverId: driverId,
          queueId: currentOffer.queue_id,
          rideId: currentOffer.ride_id
        });

        // Add to history
        setOfferHistory([
          { ...currentOffer, status: "rejected", timestamp: new Date() },
          ...offerHistory
        ]);

        setCurrentOffer(null);
        setIsCountingDown(false);
      } else {
        alert("Failed to reject offer: " + data.message);
      }
    } catch (error) {
      console.error("Error rejecting offer:", error);
      alert("Error rejecting offer");
    }
  };

  const getProgressPercentage = () => {
    const total = currentOffer?.expires_in_seconds || 30;
    return (timeRemaining / total) * 100;
  };

  return (
    <div className="driver-offer-screen">
      {currentOffer ? (
        <div className="offer-card">
          <div className="offer-header">
            <h2>New Ride Offer! 🚗</h2>
            <div className="timer">
              <div
                className="timer-circle"
                style={{
                  background: `conic-gradient(#667eea 0deg ${
                    (timeRemaining / (currentOffer.expires_in_seconds || 30)) * 360
                  }deg, #eee ${
                    (timeRemaining / (currentOffer.expires_in_seconds || 30)) * 360
                  }deg)`
                }}
              >
                <div className="timer-text">{timeRemaining}s</div>
              </div>
            </div>
          </div>

          <div className="offer-details">
            <div className="location-info">
              <div className="location-item">
                <span className="label">📍 Pickup</span>
                <p>{currentOffer.pickup}</p>
              </div>
              <div className="location-item">
                <span className="label">🗺️ Destination</span>
                <p>{currentOffer.destination}</p>
              </div>
            </div>

            <div className="offer-actions">
              <button
                className="btn btn-accept"
                onClick={handleAcceptOffer}
                disabled={!isCountingDown}
              >
                ✓ Accept Ride
              </button>
              <button
                className="btn btn-reject"
                onClick={handleRejectOffer}
              >
                ✗ Reject
              </button>
            </div>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>
      ) : (
        <div className="no-offer">
          <div className="waiting-animation">
            <div className="dot dot-1"></div>
            <div className="dot dot-2"></div>
            <div className="dot dot-3"></div>
          </div>
          <h3>Waiting for ride offers...</h3>
          <p>Keep your app open to receive ride offers</p>
        </div>
      )}

      {offerHistory.length > 0 && (
        <div className="offer-history">
          <h3>Recent Offers ({offerHistory.length})</h3>
          <div className="history-list">
            {offerHistory.map((offer, index) => (
              <div
                key={index}
                className={`history-item status-${offer.status}`}
              >
                <div className="history-time">
                  {offer.timestamp?.toLocaleTimeString()}
                </div>
                <div className="history-location">{offer.pickup}</div>
                <div className={`history-status status-${offer.status}`}>
                  {offer.status.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverOfferScreen;
