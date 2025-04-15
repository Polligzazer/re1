import React, { useState, useEffect } from "react";
import {
  auth,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "../src/firebase";
import { useNavigate, useLocation } from "react-router-dom";
import emailjs from "emailjs-com";
import "../css/reset.css";

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [_isResetLinkSent, setIsResetLinkSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oobCode, setOobCode] = useState<string | null>(null);

  const location = useLocation();
  
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search); 
    const code = queryParams.get("oobCode");
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
  }, [location]);
  
  const handleSendResetEmail = async () => {
    await sendPasswordResetEmail(auth, email, {
      url: `${window.location.origin}/reset-password`,
      handleCodeInApp: true,
    });
    setIsResetLinkSent(true);
    
    if (!email) {
      setError("Please enter a valid email.");
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3001/generate-reset-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      const resetLink = data.resetLink;

      if (!data.resetLink) throw new Error("No reset link received");

      emailjs
      .send(
        "service_a9p3n1f",
        "template_pi72mvc",
        {
            message:
            "We received a request to reset your password. Click the button below to reset it.",
            button_text: "Reset Password",
            action_link: resetLink,
            footer_message:
              "If you did not request a password reset, please ignore this email.",
            to_email: email,
          },
          "JoMHbOBfIABg9jZ_U"
        )
        .then(
          (result) => {
            console.log("EmailJS success:", result.text);
          },
          (error) => {
            console.error("EmailJS error:", error.text);
          }
        );

      setIsResetLinkSent(true);
      setSuccess("Check your email for a reset link.");
      setEmail("");

      setTimeout(() => navigate("/login"), 15000);
    } catch (err: any) {
      console.error("Error sending reset email:", err);
      setError(err.message || "Failed to send reset email.");
    }

    setLoading(false);
  };

  const handlePasswordReset = async () => {
    const oobCode = new URLSearchParams(window.location.search).get("oobCode");
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
      emailjs
        .send(
          "service_a9p3n1f",
          "template_pi72mvc",
          {
            message: "Your password has been reset successfully!",
            footer_message:
              "If you didn't perform this action, please contact our support immediately.",
            to_email: email,
          },
          "JoMHbOBfIABg9jZ_U"
        )
        .then(
          (result) => {
            console.log("EmailJS confirmation sent:", result.text);
          },
          (error) => {
            console.error("EmailJS confirmation error:", error.text);
          }
        );

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
    <div className="reset-transition p-4 rounded shadow bg-white text-center" style={{ width: "350px" }}>
      {loading && <div className="alert alert-info text-center">Processing...</div>}
      {!loading && error && <div className="alert alert-danger text-center">{error}</div>}
      {!loading && success && <div className="alert alert-success text-center">{success}</div>}

      {oobCode ? (
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
          <button className="btn btn-primary w-100 fw-bold" onClick={handlePasswordReset} disabled={loading}>
            {loading ? "Saving..." : "Save Password"}
          </button>
        </>
      ) : (
        <>
          <h2
            className="fw-bold mb-4 text-center"
            style={{
              fontFamily: "League Spartan, serif",
              color: "#454545",
            }}
          >
            Forgot Password
          </h2>
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
              borderRadius: "10px",
              fontFamily: "Work Sans, sans-serif",
            }}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          <button
            className="btn btn-link w-100 mt-3"
            onClick={() => navigate("/login")}
            style={{
              textDecoration: "none",
              fontFamily: "Work Sans, sans-serif",
              fontSize: "0.8125rem",
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