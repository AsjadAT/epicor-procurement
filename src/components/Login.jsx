import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Login.css";
import logo from "../assets/company-logo.jpg";
import Icon from "@mdi/react";
import { mdiEye, mdiEyeOff } from "@mdi/js";

// Configurable variables
//const API_URL = "https://epicorsi/kinetic/api/v2/odata/EPIC03/Ice.BO.UserFileSvc/UserFiles";
const API_URL = "https://192.168.1.142/kinetic2025demo/api/v2/odata/EPIC06/Ice.BO.UserFileSvc/UserFiles";

//const API_KEY = "s2IQ6kMDvdlP42poSZTG9VJ1Z6EbMhEd4PbmFUi4nVZVK";
const API_KEY = "wqgWS6cVVd4WnydMRoTNUkLbiBRFY93LJmhp2UzeLmvsC";


const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Base64 encode username:password
      const auth = btoa(`${username}:${password}`);

      const response = await fetch(`${API_URL}('${username}')`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error("Invalid username or password");
      }

      console.log("Login successful");
      sessionStorage.setItem("username", username);
      sessionStorage.setItem("password", password);

      navigate("/requisitions");


    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="ep-radial-light"></div>
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="logo-wrapper">
          <img src={logo} alt="Company Logo" className="company-logo" />
        </div>

        <h2>Epicor Procurement</h2>
        <p className="subtitle">Sign in to continue</p>

        {/* Username */}
        <div className="field password-wrapper">
          <label>Username</label>
          <div className="input-with-icon">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter Epicor username"
              required
            />
            <span className="eye-icon" style={{ visibility: "hidden" }} />
          </div>
        </div>

        {/* Password */}
        <div className="field password-wrapper">
          <label>Password</label>
          <div className="input-with-icon">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
            <span
              className="eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              <Icon path={showPassword ? mdiEyeOff : mdiEye} size={1} />
            </span>
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;
