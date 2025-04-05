import React, { useState, useEffect } from "react";
import {
  auth,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "../src/firebase";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../css/reset.css";

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [oobCode, setOobCode] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("oobCode");
    if (code) {
      setLoading(true);
      verifyPasswordResetCode(auth, code)
        .then(() => {
          setOobCode(code);
        })
        .catch(() => {
          setError("Invalid or expired reset link.");
        })
        .finally(() => setLoading(false));
    }
  }, [searchParams]);

  // Handle sending the reset email
  const handleSendResetEmail = async () => {
    setError("");
    setSuccess("");

    if (!email) {
      setError("Please enter a valid email.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Check your email for a reset link. Come back here after you change your password");

      // Clear the email input
      setEmail("");

      // Go back to /admin after 3 seconds
      setTimeout(() => navigate("/login"), 15000);
    } catch (err: any) {
      console.error("Error sending reset email:", err);
      setError(err.message || "Failed to send reset email.");
    }

    setLoading(false);
  };

  // Handle resetting the password (only when accessed through the oobCode link)
  const handlePasswordReset = async () => {
    setError("");
    setSuccess("");

    if (!oobCode) {
      setError("Invalid reset attempt.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess("Password reset successfully! You can now log in with your new password.");

      // Go back to /admin after 3 seconds
      setTimeout(() => navigate("/login"), 10000);
    } catch (err: any) {
      console.error("Error resetting password:", err);
      setError(err.message || "Failed to reset password. Try again.");
    }

    setLoading(false);
  };

  return (
    <div
      className="d-flex container-fluid justify-content-center align-items-center"
      style={{ height: "100vh", background: "transparent" }}
    >
      <div className=" reset-transition p-4 rounded shadow bg-white text-center" style={{ width: "350px" }}>
        {loading && <div className="alert alert-info text-center">Processing...</div>}
        {!loading && error && <div className="alert alert-danger text-center">{error}</div>}
        {!loading && success && <div className="alert alert-success text-center">{success}</div>}

        {oobCode ? (
          // Password Reset Form (when opened via email link)
          <>
            <h2 className="fw-bold mb-4 text-center">Reset Password</h2>
            <input
              type="password"
              className="form-control mb-3"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              className="form-control mb-3"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              className="btn btn-primary w-100 fw-bold"
              onClick={handlePasswordReset}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Password"}
            </button>
          </>
        ) : (
          // Email Input for Reset Link (default view)
          <>
            <h2 className="fw-bold mb-4 text-center"style={{
               fontFamily: "League Spartan, serif",
               color:' #454545',
            }}>Forgot Password</h2>
            <input
              type="email"
              className="form-control mb-3"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              className="btn btn-primary w-100 fw-bold"
              onClick={handleSendResetEmail}
              disabled={loading}
              style={{
                borderRadius:' 10px',
                fontFamily: "Work Sans, sans-serif",
              }}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <button
              className="btn btn-link w-100 mt-3"
              onClick={() => navigate("/login")}
              style={{
                textDecoration:'none',
                 fontFamily:"Work Sans, sans-serif",
                fontSize:' 0.8125rem'
              }}
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
