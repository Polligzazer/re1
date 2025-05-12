import React, { useState, useEffect } from "react";
import { auth, db } from "../src/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import PrivacyPreviewModal from "../components/privacypolicy";
import PFP from "/assets/notifpfpicon.png"
import UserReportsTable from "../components/UserReportsTable";
import "../css/profile.css"

const Profile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [reportCount, setReportCount] = useState(0);
  const [claimCount, setClaimCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    const fetchUserData = async (uid: string) => {
      try {
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

  return (
    <div className="mt-5 pt-5">
      <div className="d-flex pb-3 ms-2 flex-row flex-column flex-sm-row justify-content-center align-items-center justify-content-lg-start">
        <img src={PFP} className="rounded-circle"
          style={{
            width: "clamp(70px, 2vw, 120px)",
            minWidth: "50px",
          }} />
        <span className="d-flex ps-3 align-items-center pt-3 pt-sm-0"
          style={{
            fontSize: "clamp(30px, 2vw, 35px)",
            color: "#0e5cc5",
            fontFamily: "Poppins, sans-serif"
          }}>{user.firstName}  {user.middleInitial}  {user.lastName}
        </span>
      </div>

      <div className="d-flex flex-column align-items-center align-items-lg-start">
        <div className="d-flex flex-column pt-3 pb-3"
          style={{
            color: "#0e5cc5",
            fontSize: "clamp(20px, 3vw, 15px)",
            fontFamily: "Work Sans, sans-serif",
            gap:"0.5px"
          }}>
          <div>
            <li> <span className="">Role: </span> <span> {user.role}</span> </li>
            {user.role === "student" && (
              <>
                <div>
                  <li> <span> <span>Section & Year: </span>{user.yearSection}</span> </li>
                </div>
              </>
            )}
          </div>
          <div>
            <li> <span> School ID:</span> <span> {user.schoolId}</span> </li>
          </div>

         <div>
           <li> <span> <span>Contact info:</span> {user.contact}</span> </li>
         </div> 
        </div>

        <div className="d-flex flex-column flex-lg-row flex-md-column align-items-sm-center w-100" style={{gap: "5vw"}}>
          <div className="d-flex flex-column flex-md-row align-items-center">
            <div className="d-flex flex-column align-items-sm-center flex-md-row" style={{gap: "3vw"}}>
              <div
                className="ps-4 pt-1 pb-3"
                style={{
                width: "clamp(305px, 3vw, 30px)",
                minWidth: "200px",
                border: "2px solid #bfbdbc",
                borderRadius: "10px",
                fontSize: "clamp(10px, 2vw, 15px)",
                fontFamily: "Work Sans, sans-serif",
                boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.2)"
                }}>

              <div className="d-flex justify-content-between align-items-center pt-3">
                <span
                  style={{
                    fontSize: "clamp(30px, 2vw, 50px)",
                    fontWeight: "bold",
                    color: "#0e5cc5",
                  }}> {reportCount}
                </span>

                <img
                  src="/assets/Reporticonbutred.png" alt="" className="pb-4 me-4"
                  style={{
                    width: "clamp(35px, 3vw, 30px)",
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
                width: "clamp(305px, 3vw, 30px)",
                minWidth: "200px",
                border: "2px solid #bfbdbc",
                borderRadius: "10px",
                fontFamily: "Work Sans, sans-serif",
                boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.2)"
              }}>

              <div className="d-flex justify-content-between align-items-center pt-3">
                <span
                  style={{
                    fontSize: "clamp(30px, 2vw, 50px)",
                    fontWeight: "bold",
                    color: "#0e5cc5",
                  }}> {claimCount}
                </span>

                <img
                  src="/assets/Walletwcheck.png" alt="" className="pb-4 me-3"
                  style={{
                    width: "clamp(45px, 3vw, 30px)",
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


          <div className="d-flex flex-column align-items-center">
            <div className="flex-column align-items-center justify-content-center" >
              <div className="pb-4">
              <button
                onClick={() => setShowModal(true)}
                className="btn text-start"
                style={{
                  width: "clamp(250px, 2vw, 300px)",
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
                onClick={() => navigate("/", { state: { from: "profile" } })}
                className="btn text-start"
                style={{
                  width: "clamp(250px, 2vw, 300px)",
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
                  width: "clamp(250px, 2vw, 300px)",
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
      <UserReportsTable userId={user?.uid} />
      </div>
    </div >
  );
};

export default Profile;
