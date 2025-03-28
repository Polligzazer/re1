import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth, applyActionCode, verifyPasswordResetCode } from "../src/firebase";

const FirebaseActionHandler: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");

    if (!mode || !oobCode) {
      setError("Invalid link. Missing required parameters.");
      setLoading(false);
      return;
    }

    const handleAction = async () => {
      try {
        switch (mode) {
          case "verifyEmail":
            await applyActionCode(auth, oobCode);
            // ✅ Email verified! Redirect to your complete registration or login
            navigate("/complete-registration", { replace: true });
            break;

          case "resetPassword":
            // ✅ Verify the password reset code before redirecting
            await verifyPasswordResetCode(auth, oobCode);
            // If successful, redirect to password input screen with the oobCode
            navigate(`/reset-password?oobCode=${oobCode}`, { replace: true });
            break;

          default:
            setError("Invalid action mode.");
            setLoading(false);
            break;
        }
      } catch (err: any) {
        console.error("Firebase action error:", err);
        setError(err.message || "An unexpected error occurred.");
        setLoading(false);
      }
    };

    handleAction();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <h4>Processing your request...</h4>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div>
          <h4>Error</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return null; // Should redirect automatically
};

export default FirebaseActionHandler;
