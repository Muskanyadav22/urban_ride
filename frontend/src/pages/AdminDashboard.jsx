import { useEffect, useState } from "react";
import API from "../services/api";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);
  const [creatingDriver, setCreatingDriver] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });
  const [newDriver, setNewDriver] = useState({ name: '', car_number: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, driversRes, ridesRes] = await Promise.all([
        API.get("/admin/users"),
        API.get("/admin/drivers"),
        API.get("/admin/rides")
      ]);
      setUsers(usersRes.data);
      setDrivers(driversRes.data);
      setRides(ridesRes.data);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!newUser.name || !newUser.email || !newUser.password) {
        setError('All fields are required');
        return;
      }
      setCreatingUser(true);
      setError('');
      await API.post('/admin/users', newUser);
      setNewUser({ name: '', email: '', password: '', role: 'user' });
      setSuccess('User created successfully!');
      setTimeout(() => setSuccess(''), 3000);
      await fetchData();
    } catch (e) { 
      const errorMsg = e.response?.data?.error || e.message || 'Failed to create user';
      setError(errorMsg);
      console.error('Create user error:', e);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try { 
        await API.delete(`/admin/users/${id}`); 
        setSuccess('User deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
        fetchData(); 
      } catch (e) { 
        console.error('Delete user error:', e);
        const errorMsg = e.response?.data?.error || e.message || 'Failed to delete user';
        setError(errorMsg); 
      }
    }
  };

  const handleCreateDriver = async () => {
    try { 
      if (!newDriver.name || !newDriver.car_number) {
        setError('Name and car number are required');
        return;
      }
      setCreatingDriver(true);
      setError('');
      await API.post('/admin/drivers', newDriver); 
      setNewDriver({ name: '', car_number: '' });
      setSuccess('Driver created successfully!');
      setTimeout(() => setSuccess(''), 3000);
      await fetchData(); 
    } catch (e) { 
      const errorMsg = e.response?.data?.error || e.message || 'Failed to create driver';
      setError(errorMsg);
      console.error('Create driver error:', e);
    } finally {
      setCreatingDriver(false);
    }
  };

  const handleDeleteDriver = async (id) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try { 
        await API.delete(`/admin/drivers/${id}`); 
        setSuccess('Driver deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
        fetchData(); 
      } catch (e) { 
        console.error('Delete driver error:', e);
        const errorMsg = e.response?.data?.error || e.message || 'Failed to delete driver';
        setError(errorMsg); 
      }
    }
  };

  if (loading) return <div className="loading">Loading dashboard data...</div>;

  return (
    <div className="dashboard">
      <h2>Admin Dashboard</h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="dashboard-section">
        <h3>Users ({users.length})</h3>
        <div style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
          <input placeholder="Name" value={newUser.name} onChange={e=>setNewUser({...newUser, name: e.target.value})} style={{ padding: 8, border: '1px solid #bdbdbd', borderRadius: 4 }} disabled={creatingUser} />
          <input placeholder="Email" value={newUser.email} onChange={e=>setNewUser({...newUser, email: e.target.value})} style={{ padding: 8, border: '1px solid #bdbdbd', borderRadius: 4 }} disabled={creatingUser} />
          <input type="password" placeholder="Password" value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} style={{ padding: 8, border: '1px solid #bdbdbd', borderRadius: 4 }} disabled={creatingUser} />
          <select value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})} style={{ padding: 8, border: '1px solid #bdbdbd', borderRadius: 4 }} disabled={creatingUser}>
            <option value="user">User</option>
            <option value="driver">Driver</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={handleCreateUser} className="btn btn-primary" disabled={creatingUser}>{creatingUser ? 'Creating...' : 'Create User'}</button>
        </div>
        <div className="card-container">
          {users.map((user) => (
            <div key={user.id} className="card">
              <h3>{user.name}</h3>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <button onClick={()=>handleDeleteUser(user.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-section">
        <h3>Drivers ({drivers.length})</h3>
        <div style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 12, display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end' }}>
          <input placeholder="Name" value={newDriver.name} onChange={e=>setNewDriver({...newDriver, name: e.target.value})} style={{ padding: 8, border: '1px solid #bdbdbd', borderRadius: 4 }} disabled={creatingDriver} />
          <input placeholder="Car number" value={newDriver.car_number} onChange={e=>setNewDriver({...newDriver, car_number: e.target.value})} style={{ padding: 8, border: '1px solid #bdbdbd', borderRadius: 4 }} disabled={creatingDriver} />
          <button onClick={handleCreateDriver} className="btn btn-primary" disabled={creatingDriver}>{creatingDriver ? 'Creating...' : 'Create Driver'}</button>
        </div>
        <div className="card-container">
          {drivers.map((driver) => (
            <div key={driver.id} className="card">
              <h3>{driver.name}</h3>
              <p><strong>Car Number:</strong> {driver.car_number}</p>
              <p><strong>Status:</strong> <span className={`status-${driver.status}`}>{driver.status}</span></p>
              <button onClick={()=>handleDeleteDriver(driver.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-section">
        <h3>Rides ({rides.length})</h3>
        <div className="card-container">
          {rides.map((ride) => (
            <div key={ride.id} className="card">
              <h3>Ride #{ride.id}</h3>
              <p><strong>From:</strong> {ride.pickup}</p>
              <p><strong>To:</strong> {ride.destination}</p>
              <p><strong>Status:</strong> <span className={`status-${ride.status}`}>{ride.status}</span></p>
              {ride.driver_name && <p><strong>Driver:</strong> {ride.driver_name}</p>}
              {ride.rider_name && <p><strong>Rider:</strong> {ride.rider_name}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}