import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../src/firebase";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const CompleteRegistration: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [userEmail, setUserEmail] = useState("");
  const [userUID, setUserUID] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

        // Optional: you can update local state or context here if necessary
        // Example:
        // setFormData(prev => ({
        //   ...prev,
        //   ...refreshedData
        // }));

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
      setLoading(true);

      const requiredFields = ["firstName", "lastName", "contact", "role"];
      if (formData.role === "student") {
        requiredFields.push("strandOrCourse", "yearSection");
      }

      for (const field of requiredFields) {
        if (!formData[field as keyof typeof formData].trim()) {
          alert(`Please fill out ${field}`);
          setLoading(false);
          return;
        }
      }

      // Save user data in 'users' collection
      const userRef = doc(db, "users", userUID);
      await setDoc(userRef, {
        ...formData,
        email: userEmail,
        uid: userUID,
      });

      // Initialize their userChats document (empty at start)
      const userChatsRef = doc(db, "userChats", userUID);
      await setDoc(userChatsRef, {});

      // OPTIONAL: Automatically create a chat with admin user
      const adminUID = "rWU1JksUQzUhGX42FueojcWo9a82"; // Replace with your actual admin UID
      const combinedId =
        userUID > adminUID ? userUID + adminUID : adminUID + userUID;

      // Check if the chat already exists
      const chatRef = doc(db, "chats", combinedId);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) {
        // Create the chat document with an empty messages array
        await setDoc(chatRef, { messages: [] });

        // Update userChats for both user and admin
        await updateDoc(doc(db, "userChats", userUID), {
          [combinedId]: {
            userInfo: {
              uid: adminUID,
              displayName: "Admin", // Use admin display name
              photoURL: "", // Optional admin profile photo
            },
            date: serverTimestamp(),
          },
        });

        await updateDoc(doc(db, "userChats", adminUID), {
          [combinedId]: {
            userInfo: {
              uid: userUID,
              displayName: formData.lastName, // Or full name
              photoURL: "", // Optional photo
            },
            date: serverTimestamp(),
          },
        });
      }

      // 🔄 Call refreshUser after registration complete
      await refreshUser(userUID);

      console.log("✅ Registration and chat setup complete.");
      navigate("/home");
    } catch (error) {
      console.error("❌ Error during registration:", error);
      alert("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="progress-bar">
        {[1, 2, 3].map((num) => (
          <div key={num} className={`progress-step ${step >= num ? "active" : ""}`}></div>
        ))}
      </div>

      {step === 1 && (
        <div>
          <h2>Welcome to FLO</h2>
          <p>We would like to know you better, fill in the following below</p>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            placeholder="First Name"
            aria-label="First Name"
          />
          <input
            type="text"
            name="middleInitial"
            value={formData.middleInitial}
            onChange={handleChange}
            placeholder="Middle Initial"
            aria-label="Middle Initial"
          />
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            placeholder="Last Name"
            aria-label="Last Name"
          />
          <input
            type="text"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            required
            placeholder="Contact Number"
            aria-label="Contact Number"
          />
          <button onClick={() => setStep(2)}>Next</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>Role Selection</h2>
          <select name="role" value={formData.role} onChange={handleChange} required aria-label="Select Role">
            <option value="">Select Role</option>
            <option value="faculty">Faculty</option>
            <option value="staff">Staff</option>
            <option value="student">Student</option>
          </select>

          {formData.role === "student" && (
            <>
              <select
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
                type="text"
                name="yearSection"
                value={formData.yearSection}
                onChange={handleChange}
                placeholder="Year & Section (e.g., MAWD-12A)"
                required
                aria-label="Year and Section"
              />
            </>
          )}

          <button onClick={() => setStep(1)}>Previous</button>
          <button onClick={() => setStep(3)}>Next</button>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2>Confirmation</h2>
          <p>Review your details before submitting.</p>
          <button onClick={() => setStep(2)}>Previous</button>
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      )}
    </div>
  );
};

export default CompleteRegistration;
