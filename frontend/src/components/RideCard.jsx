export default function RideCard({ ride, onAccept, onReject, showActions = false }) {
  const getStatusClass = (status) => {
    switch (status) {
      case "pending": return "status-pending";
      case "accepted": return "status-accepted";
      case "rejected": return "status-rejected";
      case "completed": return "status-completed";
      default: return "";
    }
  };

  return (
    <div className="card">
      <h3>Ride #{ride.id}</h3>
      <p><strong>📍 Pickup:</strong> {ride.pickup}</p>
      <p><strong>📍 Destination:</strong> {ride.destination}</p>
      <p><strong>Status:</strong> <span className={getStatusClass(ride.status)}>{ride.status.toUpperCase()}</span></p>
      
      {ride.fare && (
        <p style={{ 
          fontSize: '1.1rem', 
          fontWeight: 'bold', 
          color: '#667eea',
          margin: '8px 0',
          padding: '8px',
          backgroundColor: '#f0f7ff',
          borderRadius: '4px'
        }}>
          💰 Fare: ₹{ride.fare}
        </p>
      )}
      
      {ride.driver_name && (
        <p><strong>🚗 Driver:</strong> {ride.driver_name}</p>
      )}
      {ride.rider_name && (
        <p><strong>👤 Rider:</strong> {ride.rider_name}</p>
      )}
      
      {showActions && ride.status === "pending" && (
        <div className="card-actions">
          <button 
            onClick={() => onAccept(ride.id)} 
            className="btn btn-success"
            style={{ background: '#388e3c', color: 'white' }}
          >
            ✓ Accept
          </button>
          <button 
            onClick={() => onReject(ride.id)} 
            className="btn btn-danger"
            style={{ background: '#c62828', color: 'white' }}
          >
            ✗ Reject
          </button>
        </div>
      )}
    </div>
  );
}