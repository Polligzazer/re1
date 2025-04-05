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
import { Modal, Button } from "react-bootstrap";
import "../css/signup.css";

const Signup: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checked, setChecked] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [termsModalShow, setTermsModalShow] = useState(false); // State for modal visibility
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

  // Toggle modal
  const handleShowTermsModal = () => setTermsModalShow(true);
  const handleCloseTermsModal = () => setTermsModalShow(false);

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
          className="signup-transition d-none d-md-flex flex-column justify-content-center align-items-center ps-5"
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
          className="signup-transition container-signup d-flex justify-content-lg-start justify-content-center align-items-center ps-lg-4 pe-lg-4"
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
                    <button
                      className="text-primary fw-bold"
                      style={{ border: "none", background: "transparent" }}
                      onClick={handleShowTermsModal}
                    >
                      Terms & Conditions
                    </button>
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

      <Modal
        show={termsModalShow}
        onHide={handleCloseTermsModal}
        centered
        style={{
          color:'#2169ac',
          fontFamily: "Poppins, sans-serif",
          fontSize:'16.4px'
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Terms & Conditions</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
          Welcome to FLO! These Terms and Conditions govern your use of our services, including our website and mobile application. By using the Service, you agree to comply with and be bound by these Terms and Conditions. Please read them carefully <br /> <br />
            1. General Information <br />
            FLO is a platform that allows users to report lost and found items, and does not support or facilitate the reporting of missing persons, perishable items, or any items with monetary value. <br /> <br />
            2. Eligibility <br />
            By using the Service, you confirm that: <br />
            You agree to abide by all applicable laws while using the Service. <br /> <br />
            3. Use of the Service <br />
            The Service allows users to: <br />
            Report lost items: Users can submit reports about lost personal items. <br />
            Report found items: Users can submit reports about found personal items. <br />
            Search for lost items: Users  can browse reports of lost and found items. <br /> 
            Claim lost items: Users can claim their items through the claiming verification process. <br />
            All items submitted must comply with the following guidelines: <br />
            The item must be non-cash and non-perishable. <br />
            The item must not involve missing persons or animals. <br />
            The item should be a personal belonging and not contain hazardous or illegal substances. <br /> <br />
            4. Prohibited Activities <br />
            You agree not to use the Service for any illegal, harmful, or inappropriate activities, including but not limited to: <br />
            Submitting reports of missing persons, animals, or perishable goods. <br />
            Submitting reports about cash, securities, or other forms of monetary transactions. <br />
            Engaging in fraudulent activities, including the submission of false reports. <br />
            Violating any local, state, or national laws. <br />
            5. Item Handling and Responsibility <br /> <br />
            FLO is a platform for reporting lost and found items. <br />
            FLO is not responsible for: <br />
            The condition of items found or lost. <br />
            Any disputes between users over ownership, condition, or return of lost items. <br />
            The accuracy of reports posted by users. <br /> <br />
            6. Privacy and Data Protection <br />
            Your use of the Service is subject to our Privacy Policy, which outlines how we collect, use, and protect your personal data. By using the Service, you consent to the collection and use of your personal data as described in our Privacy Policy. <br /><br />
            7. Limitations of Liability <br />
            FLO makes no guarantees regarding the availability, condition, or return of lost items. We are not responsible for any damage, loss, or injury resulting from your use of the Service, including: <br />
            Failure to recover lost items. <br />
            Disputes over ownership or item condition. <br />
            Any issues related to the interaction between users of the Service. <br />
            The Service is provided "as is," and we do not make any warranties, express or implied, about the Service's accuracy, reliability, or availability. <br /> <br />
            8. Indemnification <br />
            You agree to indemnify and hold harmless FLO, from any claims, damages, losses, or expenses arising out of your use of the Service, including: <br />
            Violation of these Terms and Conditions.<br />
            Submission of false or misleading reports.<br />
            Any disputes with other users regarding lost or found items. <br /> <br />
            9. Governing Law<br />
            These Terms and Conditions shall be governed by and construed in accordance with the laws of Meycauayan, Bulacan, without regard to its conflict of law principles. <br /> <br />
            10. Contact Information <br />
            If you have any questions or concerns regarding these Terms and Conditions, please contact us at: <br /> 
            Email: Support@flocodex.tech, <br /> Phone: 63+ 9359261892. <br /> Social media: @FLOcodeXservices <br /> <br />
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleCloseTermsModal}
            style={{
              backgroundColor:'#2169ac',
              color:'white',
              fontSize:'13px',
              outline:'none',
              border:'none',
              fontFamily: "Poppins, sans-serif",
            }}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Signup;
