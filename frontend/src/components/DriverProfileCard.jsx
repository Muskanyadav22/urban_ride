import { useState } from "react";

export default function DriverProfileCard({ profile, stats }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!profile) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      borderRadius: '12px',
      padding: '20px',
      color: '#fff',
      marginBottom: '20px',
      boxShadow: '0 8px 24px rgba(245, 87, 108, 0.3)',
      cursor: 'pointer',
      transition: 'transform 0.3s ease'
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    onClick={() => setShowDetails(!showDetails)}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            border: '2px solid rgba(255, 255, 255, 0.5)'
          }}>
            🚕
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>
              {profile.name || 'Driver'}
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>
              ✉️ {profile.email || 'email@example.com'}
            </p>
          </div>
        </div>
      </div>

      {/* Car Info Row */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '12px',
        fontSize: '0.9rem'
      }}>
        <p style={{ margin: '4px 0' }}>
          🏷️ Car Number: <strong>{profile.car_number || 'Not Set'}</strong>
        </p>
        <p style={{ margin: '4px 0' }}>
          📍 Status: <strong>{profile.status?.charAt(0).toUpperCase() + profile.status?.slice(1) || 'Available'}</strong>
        </p>
      </div>

      {/* Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '12px',
        marginBottom: '12px',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
            {stats?.totalRides || 0}
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
            🚗 Rides
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
            ₹{stats?.totalEarnings || 0}
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
            💰 Earnings
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
            ⭐ {stats?.avgRating || '0'}
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
            Rating
          </div>
        </div>
      </div>

      {/* Details Toggle */}
      {showDetails && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '0.9rem',
          animation: 'slideDown 0.3s ease'
        }}>
          <p style={{ margin: '8px 0' }}>
            <strong>Driver ID:</strong> {profile.id}
          </p>
          <p style={{ margin: '8px 0' }}>
            <strong>Member Since:</strong> {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
          </p>
          <p style={{ margin: '8px 0' }}>
            <strong>Status:</strong> {profile.status === 'available' ? '🟢' : '🔴'} {profile.status?.toUpperCase() || 'AVAILABLE'}
          </p>
          <p style={{ margin: '8px 0' }}>
            <strong>Car Number:</strong> {profile.car_number}
          </p>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            maxHeight: 0;
          }
          to {
            opacity: 1;
            maxHeight: 200px;
          }
        }
      `}</style>
    </div>
  );
}
