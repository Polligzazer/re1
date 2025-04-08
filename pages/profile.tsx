import React, { useState, useEffect } from "react";
import { auth, db } from "../src/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import PrivacyPreviewModal from "../components/privacypolicy";


const Profile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [reportCount, setReportCount] = useState(0);
  const [claimCount, setClaimCount] = useState(0);
  // const [modalContent, setModalContent] = useState({ title: "", body: "" });
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    const fetchUserData = async (uid: string) => {
      try {
        // Fetch user profile data
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          setUser(userDoc.data());
        } else {
          console.log("User data not found.");
        }

        const reportsQuery = query(collection(db, "lost_items"), where("userId", "==", uid));
        const reportSnapshot = await getDocs(reportsQuery);
        setReportCount(reportSnapshot.size);

        const claimsQuery = query(collection(db, "claim_items"), where("userId", "==", uid));
        const claimSnapshot = await getDocs(claimsQuery);
        setClaimCount(claimSnapshot.size);

      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        fetchUserData(currentUser.uid);
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  if (!user) return <p>Loading...</p>;

  // const handleInquireClick = () => {
  //   setModalContent({
  //     title: "Privacy Policy",
  //     body: (
  //       <p>
  //         This is our privacy policy. We respect your privacy and do not share your information with third parties.
  //       </p>
  //     ),
  //   });
  //   setShowModal(true);
  // };

  return (
    <div className="mt-5" style={{paddingTop:"5vw"}}>

      <div className="pb-3 ms-2">
        <img src="../../src/assets/notifpfpicon.png" className="rounded-circle"
          style={{
            width: "7vw"
          }} />
        <span className="ps-3"
          style={{
            fontSize:"3vw",
            color: "#0e5cc5",
            fontFamily: "Poppins, sans-serif"
          }}>{user.firstName}  {user.middleInitial}  {user.lastName}</span>
      </div>

      <div className="d-flex flex-column gap-5">
        <div className="d-flex flex-row p-3"
          style={{
            color: "#0e5cc5",
            fontSize: "clamp(20px, 3vw, 15px)",
            fontFamily: "Work Sans, sans-serif",
            gap: "1.5vw"
          }}>
          <div className="">

            <li> <span className="">Role: </span> <span> {user.role}</span> </li>
            {user.role === "student" && (
              <>
                <div className="">
                  <li> <span> <span>Section & Year: </span>{user.yearSection}</span> </li>
                </div>
              </>
            )}

          </div>
          <div className="ms-5">
            <li> <span className="">School ID:</span> <span> {user.schoolId}</span> </li>
            <li> <span> <span>Contact info:</span> {user.contact}</span> </li>
          </div>
        </div>

        <div className="d-flex flex-column flex-md-row" style={{gap: "5vw"}}>
          <div className="d-flex flex-column flex-md-row align-items-center w-50">
            <div className="d-flex flex-column flex-md-row w-100" style={{gap: "3vw"}}>
              <div
                className="ps-4 pt-1 pb-3"
                style={{
                width: "60%",
                border: "2px solid #bfbdbc",
                borderRadius: "10px",
                fontSize: "clamp(10px, 2vw, 15px)",
                fontFamily: "Work Sans, sans-serif",
                }}>

              <div className="d-flex justify-content-between align-items-center pt-3">
                <span
                  style={{
                    fontSize: "2vw",
                    fontWeight: "bold",
                    color: "#0e5cc5",
                  }}> {reportCount}
                </span>

                <img
                  src="../../src/assets/profilereport.png"
                  alt=""
                  className="pb-4 me-4"
                  style={{
                    width: "2.5vw",
                    minWidth: "15px",
                    height: "auto",
                  }} />
              </div>

              <span className="d-block"
                style={{
                  color: "#636363",
                  fontSize: "clamp(20px, 3vw, 20px)"
                }}>Total reports</span>
            </div>
            <div
              className="ps-4 pt-1 pb-3"
              style={{
                width: "60%",
                border: "2px solid #bfbdbc",
                borderRadius: "10px",
                fontFamily: "Work Sans, sans-serif",
              }}>

              <div className="d-flex justify-content-between align-items-center pt-3">
                <span
                  style={{
                    fontSize: "2vw",
                    fontWeight: "bold",
                    color: "#0e5cc5",
                  }}> {claimCount}
                </span>

                <img
                  src="../../src/assets/profileclaim.png"
                  alt=""
                  className="pb-4 me-3"
                  style={{
                    width: "2.5vw",
                    minWidth: "15px",
                    height: "auto",
                  }} />
              </div>

              <span className="d-block"
                style={{
                  color: "#636363",
                  fontSize: "clamp(20px, 3vw, 20px)"
                }}>Total claimed</span>
            </div>
                </div>
          </div>


          <div className="d-flex flex-column align-items-center" style={{width: "50vw"}}>
            <div className="d-flex flex-column w-75 align-items-center">
              <div className="pb-4">
              <button
                onClick={() => setShowModal(true)}
                className="btn text-start"
                style={{
                  width: "27vw",
                  borderRadius: "20px",
                  fontFamily: "Work Sans, sans-serif",
                  fontSize: "clamp(20px, 3vw, 20px)",
                  color: "#fafcff",
                  backgroundColor: "#3998ff",
                }}>
                <span className="d-flex justify-content-center">Privacy and policy</span>
              </button>
              <PrivacyPreviewModal show={showModal} onClose={() => setShowModal(false)} />
            </div>

            <div className="pb-4">
              <button
                onClick={() => navigate("/aboutus")}
                className="btn text-start"
                style={{
                  width: "27vw",
                  borderRadius: "20px",
                  fontFamily: "Work Sans, sans-serif",
                  fontSize: "clamp(20px, 3vw, 20px)",
                  color: "#fafcff",
                  backgroundColor: "#3998ff",
                }}
              >
                <span className="d-flex justify-content-center">About us</span>
              </button>
            </div>

            <div className="">
              <button
                onClick={() => navigate("/reset-password")}
                className="btn text-start"
                style={{
                  width: "27vw",
                  borderRadius: "20px",
                  fontFamily: "Work Sans, sans-serif",
                  fontSize: "clamp(20px, 3vw, 20px)",
                  color: "#fafcff",
                  backgroundColor: "#3998ff",
                }}
              >
                <span className="d-flex justify-content-center">Reset password</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div >
  );
};

export default Profile;
