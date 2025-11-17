import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'error'
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [stats, setStats] = useState({ totalRides: 0, totalSpent: 0 });
  const [rides, setRides] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/users/me");
      setProfile(res.data);
      setForm({ name: res.data.name || "", email: res.data.email || "" });
      setMessage("");
    } catch (err) {
      const status = err.response?.status;
      const apiMsg = err.response?.data?.error || err.response?.data?.message;
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        return navigate('/login');
      }
      const fallback = err.message || "Failed to load profile";
      setMessage((status ? `Error ${status}: ` : "") + (apiMsg || fallback));
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await API.get("/rides");
      const rides = Array.isArray(res.data) ? res.data : [];
      setRides(rides);
      
      const totalSpent = rides.reduce((sum, ride) => {
        const fare = parseFloat(ride.fare) || 0;
        return sum + fare;
      }, 0);
      
      setStats({
        totalRides: rides.length,
        totalSpent: totalSpent.toFixed(2)
      });
    } catch (err) {
      console.warn("Failed to fetch ride stats:", err.message);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image size must be less than 5MB");
      setMessageType('error');
      return;
    }
    
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const res = await API.patch("/users/me", form);
      setProfile(res.data);
      setMessage("Profile updated successfully! 🎉");
      setMessageType('success');

      if (avatarFile) {
        try {
          const fd = new FormData();
          fd.append('avatar', avatarFile);
          await API.post('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
          setMessage("Profile and avatar updated successfully! 🎉");
        } catch (e) {
          console.warn('Avatar upload failed', e.message);
          setMessage("Profile updated, but avatar upload failed");
          setMessageType('error');
        }
      }
      
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      const status = err.response?.status;
      const apiMsg = err.response?.data?.error || err.response?.data?.message;
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        return navigate('/login');
      }
      setMessage(apiMsg || "Failed to update profile");
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{ fontSize: '1.2rem', color: '#667eea', fontWeight: 'bold' }}>⏳ Loading your profile...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
      minHeight: '100vh',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: 40
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            color: '#fff',
            marginBottom: 8,
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            👤 Your Profile
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1rem' }}>
            Update your personal information
          </p>
        </div>

        {/* Messages */}
        {message && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: messageType === 'success' ? '#c8e6c9' : '#ffcdd2',
            color: messageType === 'success' ? '#2e7d32' : '#c62828',
            border: `2px solid ${messageType === 'success' ? '#4caf50' : '#f44336'}`
          }}>
            <span>{message}</span>
            <button 
              onClick={() => setMessage("")}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                opacity: 0.7
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Card */}
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          padding: '40px',
          animation: 'slideUp 0.3s ease'
        }}>
          <form onSubmit={handleSave}>
            {/* Avatar Section */}
            <div style={{
              textAlign: 'center',
              marginBottom: '40px',
              paddingBottom: '40px',
              borderBottom: '2px solid #f0f0f0'
            }}>
              <div style={{
                position: 'relative',
                width: '140px',
                height: '140px',
                margin: '0 auto 20px',
                background: '#f5f5f5',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '4px solid #667eea'
              }}>
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="avatar preview" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: '3rem' }}>📷</span>
                )}
              </div>
              
              <label style={{
                display: 'inline-block',
                marginTop: '12px',
                padding: '8px 20px',
                background: '#667eea',
                color: '#fff',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#5568d3'}
              onMouseLeave={(e) => e.target.style.background = '#667eea'}
              >
                📷 Change Avatar
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatar}
                  style={{ display: 'none' }}
                />
              </label>
              <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '8px' }}>
                Max 5MB • JPG, PNG, GIF
              </p>
            </div>

            {/* Form Fields */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontWeight: '600',
                color: '#333',
                marginBottom: '8px',
                fontSize: '0.95rem'
              }}>
                👤 Full Name
              </label>
              <input 
                name="name" 
                value={form.name} 
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'border 0.3s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                fontWeight: '600',
                color: '#333',
                marginBottom: '8px',
                fontSize: '0.95rem'
              }}>
                ✉️ Email Address
              </label>
              <input 
                name="email" 
                type="email"
                value={form.email} 
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'border 0.3s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="submit"
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  background: '#667eea',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: saving ? 0.7 : 1
                }}
                onMouseEnter={(e) => !saving && (e.target.style.background = '#5568d3')}
                onMouseLeave={(e) => !saving && (e.target.style.background = '#667eea')}
              >
                {saving ? '💾 Saving...' : '✓ Save Changes'}
              </button>
              
              <button 
                type="button"
                onClick={() => navigate('/rider')}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  background: '#f0f0f0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = '#e0e0e0'}
                onMouseLeave={(e) => e.target.style.background = '#f0f0f0'}
              >
                ← Back
              </button>
            </div>
          </form>

          {/* Info Section */}
          <div style={{
            marginTop: '40px',
            paddingTop: '40px',
            borderTop: '2px solid #f0f0f0'
          }}>
            <h3 style={{ color: '#333', marginBottom: '16px', fontSize: '1.1rem' }}>
              ℹ️ Account Information
            </h3>
            <div style={{
              background: '#f9f9f9',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '0.95rem',
              color: '#666'
            }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>User ID:</strong> {profile?.id || 'N/A'}
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>Role:</strong> {profile?.role || 'user'}
              </p>
              <p>
                <strong>Member Since:</strong> {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          {/* Ride Statistics Section */}
          <div style={{
            marginTop: '40px',
            paddingTop: '40px',
            borderTop: '2px solid #f0f0f0'
          }}>
            <h3 style={{ color: '#333', marginBottom: '16px', fontSize: '1.1rem' }}>
              📊 Your Stats
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '20px',
                borderRadius: '8px',
                color: '#fff',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                  {stats.totalRides}
                </div>
                <div style={{ fontSize: '0.9rem', marginTop: '4px', opacity: 0.9 }}>
                  🚗 Total Rides
                </div>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                padding: '20px',
                borderRadius: '8px',
                color: '#fff',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                  ₹{stats.totalSpent}
                </div>
                <div style={{ fontSize: '0.9rem', marginTop: '4px', opacity: 0.9 }}>
                  💰 Total Spent
                </div>
              </div>
            </div>
          </div>

          {/* Recent Rides Section */}
          {rides.length > 0 && (
            <div style={{
              marginTop: '40px',
              paddingTop: '40px',
              borderTop: '2px solid #f0f0f0'
            }}>
              <h3 style={{ color: '#333', marginBottom: '16px', fontSize: '1.1rem' }}>
                🔄 Recent Rides
              </h3>
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                borderRadius: '8px',
                background: '#f9f9f9'
              }}>
                {rides.slice(0, 5).map((ride, idx) => (
                  <div key={idx} style={{
                    padding: '12px 16px',
                    borderBottom: idx < 4 ? '1px solid #e0e0e0' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333' }}>
                        📍 {ride.pickup || 'Pickup'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#999', marginTop: '4px' }}>
                        {ride.created_at ? new Date(ride.created_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '1rem', 
                      fontWeight: 'bold', 
                      color: '#667eea',
                      textAlign: 'right'
                    }}>
                      ₹{ride.fare || '0'}
                    </div>
                  </div>
                ))}
              </div>
              <button 
                type="button"
                onClick={() => navigate('/rider')}
                style={{
                  marginTop: '12px',
                  width: '100%',
                  padding: '10px',
                  background: '#f0f0f0',
                  color: '#667eea',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = '#e0e0e0'}
                onMouseLeave={(e) => e.target.style.background = '#f0f0f0'}
              >
                View All Rides →
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
