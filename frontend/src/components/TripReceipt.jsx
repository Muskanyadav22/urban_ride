import React from 'react';
import '../styles/TripReceipt.css';

const TripReceipt = ({ trip }) => {
  if (!trip || trip.status !== 'ended') {
    return null;
  }

  const startTime = trip.started_at ? new Date(trip.started_at) : null;
  const endTime = trip.ended_at ? new Date(trip.ended_at) : null;

  const formatTime = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="trip-receipt">
      <div className="receipt-header">
        <div className="receipt-icon">🚗</div>
        <h2>Trip Receipt</h2>
        <p className="receipt-status">✅ Trip Completed</p>
      </div>

      <div className="receipt-content">
        {/* Trip Details */}
        <div className="receipt-section">
          <h3 className="section-title">Trip Details</h3>
          
          <div className="receipt-row">
            <span className="receipt-label">📍 Pickup Location</span>
            <span className="receipt-value">{trip.pickup || 'N/A'}</span>
          </div>

          <div className="receipt-row">
            <span className="receipt-label">📍 Destination</span>
            <span className="receipt-value">{trip.destination || 'N/A'}</span>
          </div>
        </div>

        {/* Duration & Fare */}
        <div className="receipt-section">
          <h3 className="section-title">Trip Summary</h3>

          <div className="receipt-row">
            <span className="receipt-label">⏱️ Duration</span>
            <span className="receipt-value">
              {trip.trip_duration_minutes ? `${trip.trip_duration_minutes} minutes` : 'N/A'}
            </span>
          </div>

          <div className="receipt-row">
            <span className="receipt-label">💰 Fare</span>
            <span className="receipt-value fare-highlight">₹{trip.fare || 0}</span>
          </div>
        </div>

        {/* GPS Coordinates */}
        {(trip.started_location_lat || trip.ended_location_lat) && (
          <div className="receipt-section">
            <h3 className="section-title">📍 Coordinates</h3>

            {trip.started_location_lat && (
              <div className="receipt-row">
                <span className="receipt-label">Pickup Location</span>
                <span className="receipt-value coordinates">
                  ({parseFloat(trip.started_location_lat).toFixed(4)}, {parseFloat(trip.started_location_lng).toFixed(4)})
                </span>
              </div>
            )}

            {trip.ended_location_lat && (
              <div className="receipt-row">
                <span className="receipt-label">Dropoff Location</span>
                <span className="receipt-value coordinates">
                  ({parseFloat(trip.ended_location_lat).toFixed(4)}, {parseFloat(trip.ended_location_lng).toFixed(4)})
                </span>
              </div>
            )}
          </div>
        )}

        {/* Timeline */}
        {(startTime || endTime) && (
          <div className="receipt-section">
            <h3 className="section-title">🕐 Timeline</h3>

            {startTime && (
              <div className="receipt-row">
                <span className="receipt-label">Started At</span>
                <span className="receipt-value">
                  <div>{formatDate(startTime)}</div>
                  <div className="time-small">{formatTime(startTime)}</div>
                </span>
              </div>
            )}

            {endTime && (
              <div className="receipt-row">
                <span className="receipt-label">Ended At</span>
                <span className="receipt-value">
                  <div>{formatDate(endTime)}</div>
                  <div className="time-small">{formatTime(endTime)}</div>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Total Amount */}
        <div className="receipt-section total-section">
          <div className="receipt-row">
            <span className="receipt-label total-label">Total Amount</span>
            <span className="receipt-value total-amount">₹{trip.fare || 0}</span>
          </div>
        </div>

        {/* Footer Message */}
        <div className="receipt-footer">
          <p>Thank you for using our service! 🙏</p>
          <p className="footer-small">Rate your trip and help us improve</p>
        </div>
      </div>
    </div>
  );
};

export default TripReceipt;
