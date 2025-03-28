import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, applyActionCode } from "firebase/auth";
import { useSearchParams } from "react-router-dom";

const EmailVerified: React.FC = () => {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get("oobCode");
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    if (oobCode) {
      applyActionCode(auth, oobCode)
        .then(() => {
          navigate("/login");
        })
        .catch(() => {
          navigate("/error");
        });
    }
  }, [oobCode, auth, navigate]);

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <h2>Verifying your email...</h2>
    </div>
  );
};

export default EmailVerified;
