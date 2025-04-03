import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth, database } from "../src/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, get, remove } from "firebase/database";

const VerifyEmail: React.FC = () => {
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const verificationId = searchParams.get("uid");

  useEffect(() => {
    if (!verificationId) {
      setError("Please check your email for verification");
      return;
    }

    const verifyEmail = async () => {
      const verificationRef = ref(database, `verificationLinks/${verificationId}`);
      const snapshot = await get(verificationRef);

      if (!snapshot.exists()) {
        setError("Open your email and verify.");
        return;
      }

      const { email, password, expiresAt } = snapshot.val();

      if (Date.now() > expiresAt) {
        setError("Verification link has expired.");
        await remove(verificationRef);
        return;
      }

      try {
        // Create user account now
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("User created:", userCredential.user);

        setIsVerified(true);
        await remove(verificationRef);
        setTimeout(() => navigate("/complete-registration"), 2000);
      } catch (error: any) {
        console.error("Error creating user:", error.message);
        setError("An error occurred during account creation.");
      }
    };

    verifyEmail();
  }, [navigate, verificationId]);

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="text-center p-4 bg-white shadow rounded" style={{ width: "400px" }}>
        {!isVerified && !error ? (
          <h5 className="mt-3">Verifying your email...</h5>
        ) : error ? (
          <p className="text-danger">{error}</p>
        ) : (
          <h5 className="text-success">Email verified! Redirecting...</h5>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
