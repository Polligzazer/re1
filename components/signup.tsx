import React, { useState, useEffect } from "react";
import {
  auth,
  fetchSignInMethodsForEmail,
} from "../src/firebase";
import { ref, set, serverTimestamp } from "firebase/database";
import { database } from "../src/firebase";
import emailjs from "emailjs-com";
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/signup.css";

const Signup: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checked, setChecked] = useState(false);
  const [emailError, setEmailError] = useState("");
  const navigate = useNavigate();

  const emailPattern = /^([a-z]+\.\d{6}@meycauayan\.sti\.edu\.ph|[a-z]+\.[a-z]+@meycauayan\.sti\.edu\.ph)$/;

  const passwordError = password.length > 0 && password.length < 8 ? "Password must be at least 8 characters" : "";
  const confirmPasswordError =
    confirmPassword.length > 0 && confirmPassword !== password ? "Passwords do not match" : "";

  useEffect(() => {
    if (email.length > 0) {
      if (!emailPattern.test(email)) {
        setEmailError("Invalid email format");
      } else {
        setEmailError("");
      }
    }
  }, [email]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
  
    if (!emailPattern.test(email)) {
      setEmailError("Invalid email format");
      return;
    }
  
    try {
      let signInMethods = [];
      try {
        signInMethods = await fetchSignInMethodsForEmail(auth, email);
      } catch (fetchError) {
        console.warn("Warning: Email check failed, proceeding with signup.", fetchError);
      }
  
      if (signInMethods.length > 0) {
        setEmailError("There is already an existing account with this email.");
        return;
      }
  
      // Generate a unique verification ID
      const verificationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const verificationLink = `${window.location.origin}/verify-email?uid=${verificationId}`;
  
      // Store the verification link in Firebase Realtime Database
      await set(ref(database, `verificationLinks/${verificationId}`), {
        email: email,
        password: password, // Store password temporarily
        expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes expiration
        createdAt: serverTimestamp(),
      });
  
      // Send verification email using EmailJS
      emailjs.send(
        "service_a9p3n1f",
        "template_pi72mvc",
        {
          to_email: email,
          verification_link: verificationLink,
        },
        "JoMHbOBfIABg9jZ_U"
      );
  
      navigate("/verify-email");
  
    } catch (err: any) {
      console.error("Signup Error:", err.message);
      setEmailError("An error occurred. Please try again.");
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        height: "100vh",
        background: "transparent",
      }}
    >
      <div
        className="d-flex flex-row justify-content-center align-items-center"
        style={{
          width: "1100px", 
          height: "700px",
          borderRadius: "20px",
          backgroundColor: "transparent",
          overflow: "hidden",
        }}
      >
        <div
          className="d-none d-md-flex flex-column justify-content-center align-items-center ps-5"
          style={{
            width: "600px",
            height: "100%",
            backgroundColor: "transparent",
          }}
        >
          <img
            className="FLOlogo bg-transparent"
            src="../src/assets/FLOLOGObg.png"
            style={{
              width: "100%",
              maxWidth: "282px",
              height: "auto",
              marginBottom: "1rem",
            }}
            alt="FLO Logo"
          />
          <p
            className="w-75 align-self-end"
            style={{
              fontSize: "1.25rem",
              fontFamily: "Poppins, sans-serif",
              color: "#333",
            }}
          >
            Returning lost objects, one item <br /> at a time.
          </p>
        </div>

        {/* RIGHT: Signup Form */}
        <div
          className="container-signup d-flex justify-content-lg-start justify-content-center align-items-center ps-lg-4 pe-lg-4"
          style={{
            width: "500px",
            height: "100%",
            
            backgroundColor: "transparent",
          }}
        >
          <div
            className="p-3 justify-content-center align-items-center"
            style={{
              background: "transparent",
              width: "100%",
              borderLeft: "1px solid black",
            }}
          >
            <div
              className="text-start justify-content-start mb-4"
              style={{
                height: "30%",
              }}
            >
              <h2
                className="fw-bold w-100 text-center"
                style={{
                  fontFamily: "League Spartan, serif",
                  fontSize: "clamp(1.5rem, 2.1vw, 2.5rem)",
                  fontWeight: "600",
                  color: "#454545",
                }}
              >
                Sign-up
              </h2>
            </div>

            <div className="justify-content-center align-items-center">
              <form className="formsignup" onSubmit={handleSignup}>
                {/* Email */}
                <div className="mb-3 pb-1 inputparent">
                  <input
                    type="email"
                    className={`form-control ${emailError ? "is-invalid" : email ? "is-valid" : ""}`}
                    placeholder="School Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <div
                    className="text-danger small mt-2 ps-1 error"
                    style={{ minHeight: "10px" }}
                  >
                    {emailError}
                  </div>
                </div>

                {/* Password */}
                <div className="mb-3 pb-1 pt-1 inputparent">
                  <input
                    type="password"
                    className={`form-control ${passwordError ? "is-invalid" : password ? "is-valid" : ""}`}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <div
                    className="text-danger small mt-1 ps-1 error"
                    style={{ minHeight: "10px" }}
                  >
                    {passwordError}
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="mb-3 pt-1 inputparent">
                  <input
                    type="password"
                    className={`form-control ${confirmPasswordError ? "is-invalid" : confirmPassword ? "is-valid" : ""}`}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <div
                    className="text-danger small mt-1 mb-3 ps-1 error"
                    style={{ minHeight: "10px" }}
                  >
                    {confirmPasswordError}
                  </div>
                </div>

                {/* Terms Checkbox */}
                <div className="mb-3 d-flex align-items-center justify-content-center">
                  <input
                    type="checkbox"
                    className="form-check-input fs-5 m-3 ms-0"
                    checked={checked}
                    onChange={() => setChecked(!checked)}
                    required
                  />
                  <span
                    className="small text-center pe-3"
                    style={{
                      fontSize: "clamp(10px, 1.2vw, 13px)",
                      fontFamily: "Work Sans, sans-serif",
                    }}
                  >
                    I have read and agree to the <br />
                    <span className="text-primary fw-bold">Terms & Conditions</span>
                  </span>
                </div>

                {/* Signup Button */}
                <div className="w-100 text-center">
                  <button
                    type="submit"
                    className="btn"
                    disabled={!checked}
                    style={{
                      width: "150px",
                      minWidth: "100px",
                      borderRadius: "20px",
                      fontFamily: "Work Sans, sans-serif",
                      fontSize: "clamp(14px, 1.5vw, 16px)",
                      color: "#fafcff",
                      backgroundColor: "#2169ac",
                    }}
                  >
                    Signup
                  </button>
                </div>
              </form>
            </div>

            <p
              className="text-center mt-2 pt-1 small"
              style={{
                fontFamily: "Work Sans, sans-serif",
                fontSize: "13px",
                opacity: "0.8",
                color: "black",
              }}
            >
              Already have an account?
              <Link
                to="/login"
                className="text-primary fw-bold"
                style={{
                  textDecoration: "none",
                  color: "#004aad",
                  fontWeight: "bold",
                }}
              >
                {" "}
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
