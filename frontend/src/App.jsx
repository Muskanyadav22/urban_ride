import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ErrorBoundary from "./components/ErrorBoundary";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import RiderDashboard from "./pages/RiderDashboard";
import Profile from "./pages/Profile";
import DriverDashboard from "./pages/DriverDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import BookRide from "./components/BookRide";
import DriverSignup from "./components/DriverSignup";
import ProtectedRoute from "./components/ProtectedRoute";
import "./styles/global.css";
import DriverLogin from "./pages/DriverLogin";
import RoleSelect from "./components/RoleSelect";
import AdminLogin from "./pages/AdminLogin";

function App() {
  return (
    <ErrorBoundary>
      <>
        <Navbar />
        <Routes>
  <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/login-select" element={<RoleSelect type="login" />} />
        <Route path="/signup-select" element={<RoleSelect type="signup" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/driver-signup" element={<DriverSignup />} />
        <Route path="/driver-login" element={<DriverLogin />} />
        <Route 
          path="/rider" 
          element={
            <ProtectedRoute role="user">
              <RiderDashboard />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute role="user">
              <Profile />
            </ProtectedRoute>
          }
        />
        
        <Route 
          path="/book-ride" 
          element={
            <ProtectedRoute role="user">
              <BookRide />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/driver" 
          element={
            <ProtectedRoute role="driver">
              <DriverDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
      </>
    </ErrorBoundary>
  );
}

export default App;