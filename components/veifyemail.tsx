import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../src/firebase";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaSearch } from "react-icons/fa";
import { MdCheckCircle } from "react-icons/md";

const VerifyEmail: React.FC = () => {
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkVerification = async () => {
      await auth.currentUser?.reload(); // Reload user info
      if (auth.currentUser?.emailVerified) {
        setIsVerified(true);
        setTimeout(() => navigate("/complete-registration"), 2000); // Redirect
      }
    };
    const interval = setInterval(checkVerification, 3000); // Check every 3s
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="text-center p-4 bg-white shadow rounded" style={{ width: "400px" }}>
        {!isVerified ? (
          <>
            <FaSearch className="text-primary" size={50} />
            <h5 className="mt-3">Verifying your email...</h5>
            <p>Please wait while we confirm your email.</p>
          </>
        ) : (
          <>
            <div className="border border-success rounded p-3 d-flex align-items-center">
              <MdCheckCircle className="text-success" size={30} />
              <h6 className="ms-2 mb-0">Email has been verified</h6>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;

