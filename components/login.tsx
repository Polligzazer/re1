import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { auth, signInWithEmailAndPassword } from "../src/firebase";

const Login: React.FC = () => {
  const [emailError, setEmailError] = useState("");
  const [loginError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const emailPattern = /^([a-z]+\.\d{6}@meycauayan\.sti\.edu\.ph|[a-z]+\.[a-z]+@meycauayan\.sti\.edi\.ph)$/;

  useEffect(() => {
    if (email.length > 0) {
      setEmailError(emailPattern.test(email) ? "" : "Invalid email format");
    }
  }, [email]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please provide both email and password.");
      return;
    }

    try {
      // Sign in with Firebase Authentication using the provided email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await new Promise(resolve => setTimeout(resolve, 500));
      const user = userCredential.user;
      console.log("User logged in:", user);

      // Check if the email matches the fixed admin email
      const adminEmail = "admin.123456@meycauayan.sti.edu.ph"; // Fixed admin email

      if (user.email === adminEmail) {
        // If it's the admin email, navigate to admin home
        console.log("Admin logged in successfully");
        navigate("/home");
      } else {
        // If it's not the admin email, navigate to the home page
        console.log("User logged in successfully");
        navigate("/home");
      }
    } catch (error: any) {
      // Handle Firebase errors specifically
      if (error.code === "auth/invalid-credential") {
        console.error("Invalid credentials.");
        alert("Login failed due to invalid credentials. Please check your email and password.");
      } else {
        console.error("Login Error:", error.message);
        alert("Login error: " + error.message);
      }
    }
  };

  return (
    <div className="d-flex container-fluid justify-content-center align-items-center"
    style={{ height: "100vh", background: "transparent" }}>
      <div className="p-4 rounded shadow bg-white" style={{ width: "350px" }}>
        <h2 className="fw-bold mb-4">Login</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <input
              type="email"
              className={`form-control ${emailError ? "is-invalid" : ""}`}
              placeholder="School Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="text-danger small mt-1">{emailError}</div>
          </div>

          <div className="mb-3">
            <input
              type="password"
              className={`form-control ${loginError ? "is-invalid" : ""}`}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="text-danger small mt-1">{loginError}</div>
          </div>

          <button type="submit" className="btn btn-primary w-100 fw-bold">Login</button>

          <p className="text-center mt-2 small">
            Forgot password?{" "}
            <span className="text-primary fw-bold" style={{ cursor: "pointer" }} onClick={() => navigate("/reset-password")}>
              Reset here
            </span>
          </p>
        </form>

        <p className="text-center mt-3 small">
          Don't have an account?{" "}
          <Link to="/" className="text-primary fw-bold">Signup</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
