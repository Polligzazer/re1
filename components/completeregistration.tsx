import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../src/firebase";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "../css/completeregistration.css";
import { motion } from 'framer-motion';
import { Modal } from "react-bootstrap";

const CompleteRegistration: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [userEmail, setUserEmail] = useState("");
  const [userUID, setUserUID] = useState<string | null>(null);
  const [_loading, setLoading] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    middleInitial: "",
    lastName: "",
    contact: "",
    role: "",
    strandOrCourse: "",
    yearSection: "",
    schoolId: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.email && user.email !== userEmail) {
        setUserEmail(user.email);
        setUserUID(user.uid);

        const extractedId = user.email.match(/\d+/)?.[0] || "000000";
        setFormData((prev) => ({
          ...prev,
          schoolId: `02000${extractedId}`,
        }));
      }
    });

    return () => unsubscribe();
  }, [userEmail]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "role" && value !== "student"
        ? { strandOrCourse: "", yearSection: "" }
        : {}),
    }));
  };

  // 🔄 Function to refresh user data
  const refreshUser = async (uid: string) => {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const refreshedData = userSnap.data();
        console.log("✅ User data refreshed:", refreshedData);

      } else {
        console.warn("⚠️ No user data found to refresh.");
      }
    } catch (error) {
      console.error("❌ Failed to refresh user data:", error);
    }
  };

  const handleSubmit = async () => {
    if (!userUID || !userEmail) {
      alert("No authenticated user found.");
      return;
    }

    try {
      setShowLoadingModal(true);
      setLoading(true);

      const requiredFields = ["firstName", "lastName", "contact", "role"];
      if (formData.role === "student") {
        requiredFields.push("strandOrCourse", "yearSection");
      }

      for (const field of requiredFields) {
        if (!formData[field as keyof typeof formData].trim()) {
          alert(`Please fill out ${field}`);
          setLoading(false);
          setShowLoadingModal(false);
          return;
        }
      }

      
      const userRef = doc(db, "users", userUID);
      await setDoc(userRef, {
        ...formData,
        email: userEmail,
        uid: userUID,
      });

      const userChatsRef = doc(db, "userChats", userUID);
      await setDoc(userChatsRef, {});

      const adminUID = "rWU1JksUQzUhGX42FueojcWo9a82"; 
      const combinedId =
        userUID > adminUID ? userUID + adminUID : adminUID + userUID;

      const chatRef = doc(db, "chats", combinedId);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) {
        await setDoc(chatRef, { messages: [] });

        await updateDoc(doc(db, "userChats", userUID), {
          [combinedId]: {
            userInfo: {
              uid: adminUID,
              displayName: "Admin", 
              
            },
            date: serverTimestamp(),
          },
        });

        await updateDoc(doc(db, "userChats", adminUID), {
          [combinedId]: {
            userInfo: {
              uid: userUID,
              displayName: formData.lastName,
              
            },
            date: serverTimestamp(),
          },
        });
      }

     
      await refreshUser(userUID);

      console.log("✅ Registration and chat setup complete.");
      setLoading(false);
      setTimeout(() => {
        setShowLoadingModal(false);
        navigate("/home");
      }, 1000); 
    } catch (error) {
      console.error("❌ Error during registration:", error);
      alert("An error occurred.");
    } 
  };

  const [progress, setProgress] = useState(11);
  const handleButtonClick = () =>{
    if (progress < 100) {
      setProgress(progress + 50);
    }
  }

  const handleButtonReset = () => {
    setProgress(progress - 50);
  }

  const getColor = () => {
    if (progress < 40) {
      return "#e8a627";
    } else if (progress < 70) {
      return "#e8a627";
    } else {
      return "#2ecc71";
    }
  }

  return (
    <div className="main d-flex justify-content-start align-items-center px-5">
      <div className="regcontainer p-3 mb-5">
      <motion.p
          className="welcometoflo p-0 m-0"
          style={{
            fontSize: "clamp(25px, 2vw, 45px)",
          }}
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.3 }}
        >
          Welcome to FLO
        </motion.p>
        <motion.p
          className="wewouldlike"
          style={{
            fontSize: "clamp(14px, 1.3vw, 19px)"
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          We would like to know you better, fill in the following below
        </motion.p>
      <div className="progress-bar">
        {[1, 2, 3].map((num) => (
          <div key={num} className={`progress-step ${step >= num ? "active" : ""}`}></div>
        ))}
        </div>

        <div className="progress-barr">
          <div className="progress-bar-fill" style={{ width: `${progress}%`, backgroundColor: getColor() }}>
          </div>
        </div>  
        
      {step === 1 && (
          <motion.div
            className="textfields3 p-3 d-flex flex-column"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="textfields p-3 d-flex flex-column flex-md-row">
              <input
                className="regFname me-4"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="First Name"
                aria-label="First Name"
              />
              <input
                className="regMinitial me-4"
                type="text"
                name="middleInitial"
                value={formData.middleInitial}
                onChange={handleChange}
                placeholder="MI"
                aria-label="Middle Initial"
              />
              <input
                className="regLname"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Last Name"
                aria-label="Last Name"
              />
            </div>
            <div className="textfields2 p-3 d-flex flex-row">
              <input
                className="regcontact"
                type="text"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                required
                placeholder="Contact Number"
                aria-label="Contact Number"
              />
          </div>
          <div>
              <button className="regnext1 p-1 mt-2 px-4 rounded-5" onClick={() => {
                setStep(2)
                handleButtonClick()
              }}> Next </button>
          </div>   
        </motion.div>
      )}

      {step === 2 && (
          <motion.div
            className="mt-3 px-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <select className="selectroledrop" name="role" value={formData.role} onChange={handleChange} required aria-label="Select Role">
            <option value="">Select Role</option>
            <option value="faculty">Faculty</option>
            <option value="staff">Staff</option>
            <option value="student">Student</option>
          </select>

          {formData.role === "student" && (
            <>
              <select
                  className="selectstrand mx-3"
                name="strandOrCourse"
                value={formData.strandOrCourse}
                onChange={handleChange}
                required
                aria-label="Select Strand or Course"
              >
                <option value="">Select Strand/Course</option>
                <option value="MAWD">MAWD (SHS)</option>
                <option value="ABM">ABM (SHS)</option>
                <option value="CA">CA (SHS)</option>
                <option value="STEM">STEM (SHS)</option>
                <option value="BSBAOM">BSBAOM (Tertiary)</option>
                <option value="BSTM">BSTM (Tertiary)</option>
                <option value="BSHM">BSHM (Tertiary)</option>
                <option value="BSIT">BSIT (Tertiary)</option>
                <option value="BSCPE">BSCPE (Tertiary)</option>
                </select>

              <input
                  className="selectyear"
                  type="text"
                  name="yearSection"
                  value={formData.yearSection}
                  onChange={handleChange}
                  placeholder="Year & Section"
                  required
                  aria-label="Year and Section"
                />    
            </>
          )}
            <div className="mt-3">
          <button className="regprevious me-2 p-1 px-4 rounded-5" onClick={() => {
                setStep(1)
                handleButtonReset()
              }}>Previous</button>
          <button className="regnext2 p-1 px-4 rounded-5" onClick={() => {
                setStep(3)
                handleButtonClick()}}>Next</button>
        </div>
        </motion.div>
      )}

      {step === 3 && (
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 0.5 }}
         >
            <p className="regreview"> Please review your details before submitting</p>
            <button className="regprevious2 me-2 p-1 px-4 rounded-5" onClick={() => {
                setStep(2)
                handleButtonReset()
              }}>Previous</button>
            <button className="regsubmit p-1 px-4 rounded-5" onClick={handleSubmit}>Submit</button>
        </motion.div>
        )}
      </div>  
      <motion.div
        className="imgcustomshow"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <img
          src="/assets/image.png"
          style={{
            maxWidth: '100%',
            height: '100%',
            objectFit: "cover",
          }}
        />
      </motion.div>
      <Modal show={showLoadingModal} onHide={() => setShowLoadingModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{_loading ? "Registering..." : "Registration Complete"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {_loading ? (
            <div className="d-flex justify-content-center align-items-center flex-column">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <span className="mt-2" style={{ fontFamily: 'Poppins, sans-serif', color: '#2169ac' }}>
                Registering your account...
              </span>
            </div>
          ) : (
            <div className="d-flex justify-content-center align-items-center flex-column">
              <div className="check-container pb-1">
                <div className="check-background">
                  <svg viewBox="0 0 65 51" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 25L27.3077 44L58.5 7" stroke="white" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <span className="mt-2" style={{ fontFamily: 'Poppins, sans-serif', color: '#2169ac' }}>
                Registered successfully!
              </span>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
    
  );
};

export default CompleteRegistration;
