import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function DriverLogin() {
  const [form, setForm] = useState({ car_number: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await API.post("/drivers/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", "driver");
      navigate("/driver");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Driver Login</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="car_number"
          placeholder="Car Number"
          value={form.car_number}
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login as Driver"}
        </button>
      </form>
    </div>
  );
}
