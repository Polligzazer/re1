import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { auth, signInWithEmailAndPassword } from "../src/firebase";
import "../css/login.css"

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
     
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await new Promise(resolve => setTimeout(resolve, 500));
      const user = userCredential.user;
      console.log("User logged in:", user);

     
      const adminEmail = "admin.123456@meycauayan.sti.edu.ph"; // Fixed admin email

      if (user.email === adminEmail) {
        console.log("Admin logged in successfully");
        navigate("/home");

      } else {
        console.log("User logged in successfully");
        navigate("/home");
      }
    } catch (error: any) {
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
      <div className="p-4 login-transition rounded shadow bg-white" style={{ width: "350px" }}>
        <h2 className="fw-bold mb-4 text-center" style={{
          fontFamily: "League Spartan, serif",
          color:' #454545',
        }}>Login</h2>
        <form className="" onSubmit={handleLogin}>
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

          <div className="mb-3 text-end">
            <input
              type="password"
              className={`form-control ${loginError ? "is-invalid" : ""}`}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="text-danger  small mt-1">{loginError}</div>
            
            <span className="text-primary small me-2" style={{ 
              cursor: "pointer", 
              fontFamily:"Work Sans, sans-serif",
              color:"#2169ac",
              fontSize:'12px'
              }} onClick={() => navigate("/reset-password")}>
              Forgot password?
            </span>
         
          </div>
          <div className="w-100 text-center justify-content-center">
          <button type="submit" className="btn btn-primary mt-2 w-75 fw-bold" style={{
            color: '#fafcff',
        
            borderRadius:' 10px',
	          fontFamily: "Work Sans, sans-serif",
          }}>Login</button>
          </div>

        </form>

        <p className="text-center mt-3 small" 
        style={{
          fontFamily:"Work Sans, sans-serif",
            fontSize:' 0.8125rem'
        }}
        >
          Don't have an account?{" "}
          <Link to="/" className="text-primary fw-bold" style={{
            textDecoration:'none',
          }}>Signup</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;