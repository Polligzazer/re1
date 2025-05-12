import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import emailjs from "emailjs-com";
import { createNotification, sendPushNotification } from "../../components/notificationService";
import { db } from "../../src/firebase";
import { onSnapshot, collection, doc, where, addDoc, getDoc, getDocs, updateDoc, serverTimestamp, query, orderBy, writeBatch } from "firebase/firestore";
import categoryImages from "../../src/categoryimage";
import { FaChevronLeft } from "react-icons/fa";
import { AuthContext } from '../../components/Authcontext';
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faUser, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import "../../css/ModalProgress.css";
import "../../css/PendingClaimDash.css"
import "../../css/loading.css"

interface Report {
  id: string;
  category: string;
  date: string;
  claimantName: string;
  description: string;
  itemName: string;
  location: string;
  status: string;
  referencePostId: string;
  timestamp: string;
  userId: string;
  emailSent: boolean;
  imageUrl?: string;
  receiptId?: string;

}

interface Claim {
  id: string;
  item: string;
  category: string;
  location: string;
  date: string;
  status: string;
  emailSent: boolean;
  imageUrl?: string;
}

const AdminApproval: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const { currentUser } = useContext(AuthContext);

  const [showReportModal, setShowReportModal] = useState(false);
  const [showVerifyModal, setVerifyModal] = useState(false); //send receipt final

  const [showDenyModal, setShowDenyModal] = useState(false); //deny
  const [reportToDeny, setReportToDeny] = useState<Report | null>(null);

  const [showEmailModal, setShowEmailModal] = useState(false); //email
  const [emailMessage, setEmailMessage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false); //verify email
  const [, setPendingClaims] = useState<Claim[]>([]);
  const [pendingClaimCount, setPendingClaimCount] = useState<number>(0);

  const [linkedPostData, setLinkedPostData] = useState<any | null>(null);
  const [reporterName, setReporterName] = useState('');

  useEffect(() => {
    const fetchPendingData = async () => {
      if (!currentUser) return;
  
      try {
        setLoading(true);
  
        const claimsQuery = query(
          collection(db, "claim_items"),
          where("userId", "==", currentUser.uid),
          where("status", "in", ["pendingclaim"])
        );
        const claimsSnapshot = await getDocs(claimsQuery);
        const fetchedClaims = claimsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Claim[];
  
        setPendingClaims(fetchedClaims); 
      } catch (error) {
        console.error("❗ Error fetching pending data:", error);
      }finally {
        setLoading(false); 
      }
    };
  
    fetchPendingData();
  }, [currentUser]);

  const denyReport = async (reportId: string) => {
    try {
      const reportRefr = doc(db, "claim_items", reportId)
      await updateDoc(reportRefr, {status: "deniedclaim"});
    } catch (error) {
      console.error(error);
      alert("Deny error");
    }
  };

  const handleDenyClick = async (event: React.MouseEvent, report: Report) => {
    event.stopPropagation();
      if (loading) return;
  
    setReportToDeny(report);
    setShowDenyModal(true);
  };

  const handleCloseDenyModal = () => {
  setShowDenyModal(false);
  setReportToDeny(null);
};

  const confirmDenyReport = async () => {
    if (!reportToDeny) return;
  
    setLoading(true);
  
    try {
      await denyReport(reportToDeny.id);
  
      await createNotification(
        reportToDeny.userId,
        "Your claim request has been denied",
        reportToDeny.id
      );
  
      const userDoc = await getDoc(doc(db, "users", reportToDeny.userId));
      const userToken = userDoc.exists() ? userDoc.data().fcmToken : null;
  
      if (userToken) {
        await sendPushNotification(userToken, {
          title: "Denied claim request",
          body: "Your claim request has been denied by the admin. Inquire for more details.",
          url: "/home",
        });
      } else {
        console.warn("⚠️ No FCM token found for denied user.");
      }
      setReports(prevReports => prevReports.filter(r => r.id !== reportToDeny.id));
      setLoading(false);
      handleCloseDenyModal();
    } catch (err) {
      console.error("❌ Error denying claim report:", err);
      alert("Failed to deny claim request.");
    } finally {
      // 5. Reset modal state
      setShowDenyModal(false);
      setReportToDeny(null);
      setLoading(false);
    }
  };

  const fetchUserEmail = async (userId: string): Promise<string> => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && userSnap.data().email) {
        return userSnap.data().email;
      } else {
        console.error("❌ User email not found in Firestore.");
        return "";
      }
    } catch (error) {
      console.error("Error fetching user email:", error);
      return "";
    }
  };

  const handleSendEmail = async (report: Report) => {
    if (!selectedReport) return;
    setLoading(true);
  
    try {
      const userEmail = await fetchUserEmail(report.userId);
      if (!userEmail || !userEmail.includes("@")) {
        console.error("❌ Invalid or missing email. Claim cannot proceed.");
        alert("❌ Invalid email detected. Cannot proceed with claim.");
        return;
      }
  
      const receiptId = await storeReceiptInDatabase(report, userEmail);
      if (!receiptId) {
        console.error("❌ Failed to store receipt. Aborting email sending.");
        alert("❌ Failed to generate claim receipt. Try again.");
        return;
      }
  
      await sendEmail(report, receiptId, userEmail);
      console.log("receiptId:", receiptId); 
  
      const reportWithReceipt = { ...report, receiptId };
      setSelectedReport(reportWithReceipt);
      console.log("🔍 reportWithReceipt:", JSON.stringify(reportWithReceipt, null, 2));
      console.log("🧾 Selected report set:", reportWithReceipt);
  
      const claimRef = doc(db, "claim_items", report.id);
      await updateDoc(claimRef, { emailSent: true });
  
      const updatedReport = { ...report, emailSent: true };
      setReports(prev => prev.map(r => r.id === report.id ? updatedReport : r));
  
      await createNotification(
        report.userId,
        "Receipt has been sent in the mail, claim your lost item.",
        report.id
      );

      const userDoc = await getDoc(doc(db, "users", report.userId));
      const userToken = userDoc.exists() ? userDoc.data().fcmToken : null;
      if (userToken) {
        await sendPushNotification(userToken, {
          title: "Claim your item",
          body: "Claim receipt has been sent to your mail. Claim your belonging in the lost and found. ",
          url: "/home",
        });
      }
  
      setVerifyModal(false);
      setLoading(false);
      setShowConfirmModal(true);
  
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Error processing claim.");
    } finally {
      setShowEmailModal(false);
    }
  };

  const handleConfirmClaim = async () => {
    if (!selectedReport) {
      console.error("❌ No selected report found.");
      return; }
    setLoading(true);
    try {
      const reportRef = doc(db, "claim_items", selectedReport.id);
      const claimSnap = await getDoc(reportRef);
  
      if (!claimSnap.exists()) {
        alert("❗ Claim not found.");
        return;
      }
  
      const claimData = claimSnap.data();
      const referencePostId = claimData.referencePostId;
      const claimantUserId = claimData.userId;

      const lostItemRef = doc(db, "lost_items", referencePostId);
      const lostItemSnap = await getDoc(lostItemRef);
      if(!lostItemSnap.exists()){
        throw new Error("Lost item not found");
      }
      
      const originalPosterId = lostItemSnap.data().userId;
      const isFound = lostItemSnap.data().type === "found";
      const batch = writeBatch(db);
  
      batch.update(lostItemRef, {
        status: "claimed",
        claimedBy: claimantUserId,
        claimedAt: serverTimestamp()
      });
  
      batch.update(reportRef, {
        status: "claimed",
        claimedDate: serverTimestamp()
      });
      
      const claimantNotificationRef = doc(collection(db, "users", claimantUserId, "notifications"));
      batch.set(claimantNotificationRef, {
        description: "Item has been successfully claimed",
        isRead: false,
        timestamp: serverTimestamp(),
        relatedPostId: referencePostId,
        type: "claim_success"
      });
      if (isFound) {
        const posterNotifRef = doc(collection(db, "users", originalPosterId, "notifications"));
        batch.set(posterNotifRef, {
          description: "Your item has been claimed by a user",
          isRead: false,
          timestamp: serverTimestamp(),
          relatedPostId: referencePostId,
          type: "item_claimed",
        });
      }

      await batch.commit();
      const [claimantDoc, posterDoc] = await Promise.all([
        getDoc(doc(db, "users", claimantUserId)),
        isFound ? getDoc(doc(db, "users", originalPosterId)) : null,
      ]);

      const claimantToken = claimantDoc.exists() ? claimantDoc.data().fcmToken : null;
      const posterToken = isFound && posterDoc?.exists() ? posterDoc.data().fcmToken : null;
      if (claimantToken) {
        await sendPushNotification(claimantToken, {
          title: "Item claimed successfully",
          body: "Your requested item has been claimed successfully",
          url: "/home",
        });
      }
      if (isFound && posterToken) {
        await sendPushNotification(posterToken, {
          title: "Reported item claimed",
          body: "Your reported item has been claimed by a user.",
          url: "/home",
        });
      }
      setReports((prevReports) => prevReports.filter((r) => r.id !== selectedReport.id));
  
      setShowConfirmModal(false);
      setVerifyModal(false);
      setSelectedReport(null);
    } catch (error) {
      console.error("Error updating claim status:", error);
      alert("Error processing claim.");
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  const storeReceiptInDatabase = async (report: Report, userEmail: string): Promise<string> => {
    try {
      const receiptRef = await addDoc(collection(db, "claim_receipts"), {
        claimantName: report.claimantName,
        claimantEmail: userEmail,
        itemName: report.itemName,
        referencePost: report.referencePostId,
        referenceId: report.id,
        location: report.location,
        dateFound: report.date,
        claimDate: new Date().toLocaleDateString(),
        itemDescription: report.description,
        timestamp: serverTimestamp(),
      });
  
      console.log("✅ Receipt stored in database with ID:", receiptRef.id);
      return receiptRef.id;
    } catch (error) {
      console.error("❌ Error storing receipt:", error);
      return "";
    }
  };

  const sendEmail = async (report: Report, receiptId: string, userEmail: string) => {
    if (!userEmail || !userEmail.includes("@")) {
      console.error("❌ Invalid recipient email detected:", userEmail);
      alert("❌ Cannot send email. Invalid recipient email.");
      return;
    }
    console.log("📨 Sending email to:", userEmail);
    

    try {
      const response = await emailjs.send(
        "service_a9p3n1f",
        "template_qejwqqi",
        {
          to_email: userEmail,
          to_name: report.claimantName,
          item_name: report.itemName,
          reference_id: receiptId,
          reference_post: report.referencePostId,
          location: report.location,
          date_found: report.date,
          claim_date: new Date().toLocaleDateString(),
          item_description: report.description,
          claimant_name: report.claimantName,
          claimant_email: userEmail,
        },
        "JoMHbOBfIABg9jZ_U"
      );
      console.log("✅ Email sent successfully:", response);
    } catch (error: any) {
      console.error("Error sending email:", error);
      alert(`Failed to send email. Error: ${error.text || error.message}`);
    }
  };

  const handleSelectReport = async (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (report) {
      try {
        const receiptQuery = query(
          collection(db, "claim_receipts"),
          where("referenceId", "==", report.id)
        );
        const receiptSnapshot = await getDocs(receiptQuery);
  
        let receiptId = "";
        if (!receiptSnapshot.empty) {
          const receiptDoc = receiptSnapshot.docs[0];
          receiptId = receiptDoc.id;
          console.log("📄 Found receipt ID:", receiptId);
        } else {
          console.log("🛑 No receipt found for report ID:", report.id);
        }
  
        const updatedReport = { ...report, receiptId };
        setSelectedReport(updatedReport);
        setShowReportModal(true);
      
  
     
      if (report.referencePostId) {
        try {
          const refPostDoc = await getDoc(doc(db, "lost_items", report.referencePostId));
          console.log("Attempting to fetch reference post with ID:", report.referencePostId);
          if (refPostDoc.exists()) {
            const postData = refPostDoc.data();
            console.log("Reference post data found:", refPostDoc.data());
            setLinkedPostData(postData);
           
            if (postData.userId) {
              try {
                const userDoc = await getDoc(doc(db, "users", postData.userId));
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  console.log("Fetched user data:", userData);
                  const fullName = `${userData?.firstName || ""} ${userData?.middleInitial || ""} ${userData?.lastName || ""}`.trim();
                  setReporterName(fullName || "Admin");
                } else {
                  console.warn("User not found for userId in linked post");
                  setReporterName("User not found");
                }
              } catch (userFetchErr) {
                console.error("Error fetching user data:", userFetchErr);
                setReporterName("Error fetching user");
              }
            } else {
              setReporterName("N/A");
            }
          } else {
            setLinkedPostData(null);
            console.warn("Reference post not found");
          }
        } catch (error) {
          console.error("Error fetching reference post:", error);
          setLinkedPostData(null);
        }
      }
    }catch (err) {
      console.error("Error fetching receipt ID:", err);
      setSelectedReport(report); // fallback to normal report
      setShowReportModal(true);
    }
  }
  };
  
  useEffect(() => {
    const q = query(collection(db, "claim_items"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        try {
          console.log(`📌 Retrieved ${querySnapshot.docs.length} documents.`);
          const reportData: Report[] = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            console.log("✅ Data:", data);
            return {
              id: doc.id,
              ...data,
              timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toLocaleString() : "N/A",
            } as Report;
          });

          const pendingReports = reportData.filter((report) => report.status === "pendingclaim");
          console.log("📌 Pending Reports:", pendingReports);
          setReports(pendingReports);
          setPendingClaimCount(pendingReports.length); 
          setLoading(false);
        } catch (error) {
          console.error("❗ Error processing reports:", error);
          setLoading(false);
        }
      },
      (error) => {
        console.error("❗ Firestore error:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  return (
    <div className="container mt-4">
      <button 
          className="btn d-flex align-items-center mb-0 pb-0" 
          onClick={() => navigate("/dashboard")}
          style={{
            fontSize:'clamp(12px, 3vw, 18px)'
          }}
        >
          <FaChevronLeft /> Return
        </button>
     <div className="claim-top-text d-flex flex-row align-items-center">   
      <div className="claim-top-text-text d-flex flex-column" style={{
        width:'70%'
      }}>
        <p className="text-start fw-bold m-0 pb-2 mt-5"
        style={{
          fontSize:"24px",
          color:'#212020',
          fontFamily: "DM Sans, sans-serif", 
           
        }}
      >Claim Approval</p>
      <p className="" 
        style={{
          color:'#454545',  
          fontFamily:"Poppins, sans-serif"
        }}>
          Hello <span style={{color:'#0e5cc5'}}>Admin, </span> you have 
          <span style={{color:'red'}}> {pendingClaimCount}</span> pending claim approval</p>
        </div>
      <div className="countdiv">    
         <div className="number-of-pending d-flex p-2 flex-column pb-4" style={{
            backgroundColor:'#f1f7ff',
            borderRadius:'10px',
            border:'1px solid #bfbdbc',

          }}>
            <div className="d-flex flex-row justify-content-between align-items-center px-4">
              <p className="number-of-pending-text mt-3 m-0 mb-1" style={{
                fontFamily: "DM Sans, sans-serif", 
                fontSize:'25px',
                color:'#0e5cc5',
                padding:'0'
                
              }}>{pendingClaimCount}</p>
              <FontAwesomeIcon 
                icon={faExclamationTriangle}
                style={{
                  position:'relative',
                  color:'#e86b70',
                  fontSize:'29px',
                  top:'-5px'
                }}/>
            </div>
            <p className="px-4 text-start" style={{
              color:'#636363',
              fontFamily:"Poppins, sans-serif",
              fontSize:'13.6px'
            }}>Pending Claims</p>
          </div>
        </div>
       </div> 
       <div className="container d-flex flex-column justify-content-center align-items-center px-0 mt-5"> 
          <div className=" ms-5 mt-5 d-flex justify-content-end" style={{ width: '85%' }}>
            <div className="d-lg-flex d-none justify-content-center" style={{
              width:'30%'
            }}>
              <p className='text-center mb-3 me-3 pb-2' style={{
                borderBottom:'2px solid #0e5cc5',
                width:'50%',
                fontSize: '13.8px',
                fontFamily: 'Poppins, sans-serif',
                color:'#0e5cc5'
              }}>Status</p>
            </div>
          </div>  
        {loading ? (
      <div className="d-flex justify-content-center align-items-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
      ) : reports.length === 0 ? (
        <p className="text-center">No pending claims.</p>
      ) : (
        <div className="custom-scrollbar d-flex ms-0 ps-lg-5 ms-lg-5 pb-4 flex-column">
          {reports.map((report) => (
            <button
              key={report.id}
              className="d-flex flex-lg-row flex-column align-items-center mb-1 p-0 m-0"
              style={{ backgroundColor: 'transparent', border:"none", color: '#fff', width: "100%", borderRadius:'6px' }}
              onClick={() => {
                handleSelectReport(report.id);
                setShowReportModal(true);
              }}
            >
          
          <div  className="pending-card align-content-center">
            <div className="card-main d-flex align-items-center p-4"
            style={{ backgroundColor: '#1B75BC', color: '#fff', width: "100%", borderRadius:'6px' }}>
              <div className="d-flex flex-row fcolumn w-100">
                 <div className="conimg d-flex align-items-center justify-content-center "style={{
                     borderRight:'1px solid white'
                   }}>
                   <div>
                     <img className="img-cat"
                       src={categoryImages[report.category] || '/assets/othersIcon.png'}
                       alt={report.category}
                       
                     />
                   </div>
                 </div>
               <div className="details d-flex justify-content-center align-items-start ms-4 flex-column">
                  
                <p className="m-1"><strong> Claimnant: </strong>{report.claimantName}</p>
                <p className="m-1"><span className="fw-bold">Item: </span>{report.itemName}</p>
                <p className="m-1 text-start">
                <span className="fw-bold"> Last location: </span>{report.location} 
                </p>
                <p className="m-1"><span className="fw-bold">Date of Lost: </span>{report.date}</p>
              </div>  
              </div>

              <div className="card-button d-flex gap-2 align-self-end justify-content-end" style={{
                    width:'22%',
                    fontFamily: "Poppins, sans-serif"
                  }}>
                <button
                  className="btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedReport(report);
                
                    const hasSentEmail = report.emailSent;
                
                    if (hasSentEmail) {

                      setShowConfirmModal(true);
                    } else {
                      setVerifyModal(true);
                    }
                  }}
                  style={{ 
                    backgroundColor: "#67d753", 
                    borderRadius:'15px',
                     width: "90px", 
                     height: "30px", 
                     color: "white", 
                     fontSize: "clamp(9px, 1vw, 12px)" }}
                >
                 Verify
                </button>
                <button
                  className="btn"
                  onClick={(event) => handleDenyClick(event, report)}
                  style={{ 
                    backgroundColor: "#f0474e", 
                    borderRadius:'15px',
                     width: "auto", 
                     height: "30px", 
                     color: "white", 
                     fontSize: "clamp(9px, 1vw, 12px)" }}
                >
                   <FontAwesomeIcon icon={faXmark}/>
                </button>
                </div>
                </div>
              
              </div>
              <div className="stsdiv mt-lg-0 mt-3 align-content-center" >
                <div className="d-flex text-center align-items-center ps-lg-0 ps-2 justify-content-lg-center justify-content-start">
                  
                  <span className='labelstatus fw-bold pe-2 me-1 d-lg-none d-flex' style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize:'16px',
                    color:'#0e5cc5'
                  }}>Status:</span>
                  <span
                    className="text-white py-2 px-4"
                    style={{
                      width: '150px',
                      height:'auto',
                      minHeight: "35px",
                      textAlign: 'center',
                      borderRadius: '11px',
                      fontSize: "11.8px",
                      fontFamily: "Poppins, sans-serif",
                      backgroundColor: 
                        report.emailSent === true
                          ? '#67d753' 
                          : report.emailSent === false
                          ? '#59b9ff'  
                          : '#ffc107', 
                    }}
                  >
                    {report.emailSent === true
                      ? 'Waiting for the receipt'
                      : report.emailSent === false
                      ? 'Verifying information'
                      : 'Unknown Status'}
                  </span>
                </div>
              </div>
            </button>
            
          ))}
        </div>
       
        
      )}
       </div>
      {/* Verify Claim Modal */}
    <Modal contentClassName="custom-modal" show={showVerifyModal && !!selectedReport} onHide={() => setVerifyModal(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title 
               style={{
                color:'#2169ac',
                fontFamily: "Poppins, sans-serif",
                fontSize:'17.4px',
                backgroundColor:'#f1f7ff'
              }}>
        Verify {selectedReport?.claimantName}'s claim</Modal.Title>
      </Modal.Header>
      <Modal.Body
       style={{
          color:'#2169ac',
          fontFamily: "Poppins, sans-serif",
          fontSize:'13.4px',
          backgroundColor:'#f1f7ff'
        }}>
         {loading ? (
        <div className="d-flex justify-content-center align-items-center mt-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden"> Sending email...</span>
          </Spinner>
          <span className=""> Sending receipt...</span>
        </div>
      ) : (
        <>
          <p>Are you sure you want to verify this claim?</p>
          <p><strong>Item: </strong> {selectedReport?.itemName}</p>
          <p><strong>Description:</strong> {selectedReport?.description}</p>
          <p><strong>Lost at:</strong> {selectedReport?.location} </p>
          <p><strong> Date of lost: </strong>{selectedReport?.date}</p>
        </>
      )}
      </Modal.Body>
      <Modal.Footer>
        <p
            style={{
              color:'#2169ac',
              fontFamily: "Poppins, sans-serif",
              fontSize:'13.4px',
              
        }}>
          If you are sure in approving this claim, press <b className="text-success">Send Email</b> to send their claim receipt.</p>
        <Button onClick={() => setVerifyModal(false)}
          style={{
            backgroundColor:' #e86b70',
            color:'white',
            fontSize:'13px',
            outline:'none',
            border:'none',
            fontFamily: "Poppins, sans-serif",
          }}
         >Cancel</Button>
        <Button 
        onClick={(event) => {
          event.stopPropagation();
          if (!selectedReport) {
            console.error("No report selected");
            return;
          }
          handleSendEmail(selectedReport);
        }}
            style={{
              backgroundColor:'#67d753',
              color:'white',
              fontSize:'13px',
              outline:'none',
              border:'none',
              fontFamily: "Poppins, sans-serif",
            }}>
          Send Email
        </Button>
      </Modal.Footer>
    </Modal>

    {/*confirm claimed*/}

    <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered
        style={{
          color:'#2169ac',
          fontFamily: "Poppins, sans-serif",
        }}>
      
    <Modal.Header closeButton>
      <Modal.Title>Verify Claim</Modal.Title>
    </Modal.Header>
    <Modal.Body
        style={{
          fontSize:'13.4px'
        }}>
      <p><strong>Verify this user attempting to claim their item</strong></p>
      <p>✅ You have successfully sent an email to the user!</p>
      
        <p><strong>Receipt ID:</strong> {selectedReport?.receiptId}</p>
    
      <p><strong>Claimant:</strong> {selectedReport?.claimantName}</p>
    </Modal.Body>
    <Modal.Footer>
      <Button onClick={() => setShowConfirmModal(false)}
       style={{
        backgroundColor:' #e86b70',
        color:'white',
        fontSize:'13px',
        outline:'none',
        border:'none',
        fontFamily: "Poppins, sans-serif",
        }}>
       Cancel</Button>
      <Button onClick={handleConfirmClaim}
        style={{
          backgroundColor:'#67d753',
          color:'white',
          fontSize:'13px',
          outline:'none',
          border:'none',
          fontFamily: "Poppins, sans-serif",
        }}>
        Claimed</Button>
    </Modal.Footer>
  </Modal>

    {/* Report Details Modal */}
    <Modal contentClassName='custom-modal2' show={showReportModal && !!selectedReport} onHide={() => setShowReportModal(false)} centered size="lg"
        style={{
            color:'#2169ac',
            fontFamily: "Poppins, sans-serif",
        }}>
      <Modal.Header closeButton>
        <Modal.Title  style={{
          fontSize:'14.4px',
          fontFamily: "Poppins, sans-serif",
        }}>Claim form details</Modal.Title>
      </Modal.Header>
      <Modal.Body
        className="d-flex flex-column flex-lg-row justify-content-evenly"
        style={{
          fontSize:'14px',
          fontFamily: "Poppins, sans-serif",
          width:'100%'
        }}>
        {selectedReport && (
      <>
      <div className=" p-3 modal-custom d-flex flex-column">
        <div className="d-flex p-3 flex-row" style={{
          backgroundColor:'#e8a627',
          color:'white',
        }}>
        <FontAwesomeIcon icon={faUser} style={{
          color:'white',
          fontSize:'26px'
         
        }}/>
          <p className="p-0 m-1"><strong>{selectedReport.claimantName}</strong> (Claimnant)</p>
        </div>
          <div className="p-2">
            <p className="p-0 my-2"><strong>Lost Item:</strong> {selectedReport.itemName}</p>
            <p className="p-0 my-2"><strong>Category:</strong> {selectedReport.category}</p>
            <p className="p-0 my-2"><strong>Lost at:</strong> {selectedReport.location}</p>
            <p className="p-0 my-2"><strong>Description:</strong> {selectedReport.description}</p>
            <p className="p-0 my-2"><strong>Date of Lost:</strong> {selectedReport.date}</p>
          </div>
          {selectedReport.imageUrl && (
          <a
            href={selectedReport.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={selectedReport.imageUrl}
              alt={selectedReport.itemName}
              style={{
                width: '100%',
                maxHeight: '250px',
                objectFit: 'contain',
                borderRadius: '8px',
                marginTop: '10px',
                cursor: 'pointer'
              }}
              onError={(e) => {
                console.error("Image failed to load:", e.currentTarget.src);
                e.currentTarget.style.display = "none";
              }}
            />
          </a>
        )}
        </div>
      </>
    )}

    {linkedPostData ? (
      <>
      <div className="p-3 modal-custom d-flex flex-column">
        <div className="d-flex p-3 flex-row" style={{
          backgroundColor:'#2169ac',
          color:'white',
        }}>
           <FontAwesomeIcon icon={faUser} style={{
            color:'white',
            fontSize:'26px'
          
            }}/>
            <p className="p-0 m-1"><strong>{reporterName ||"Admin"}</strong> (Finder) </p>
          </div>
          <div className="p-2">
            <p className="p-0 my-2"><strong>Found Item:</strong> {linkedPostData.item}</p>
            <p className="p-0 my-2"><strong>Category:</strong> {linkedPostData.category}</p>
            <p className="p-0 my-2"><strong>Found at:</strong> {linkedPostData.location}</p>
            <p className="p-0 my-2"><strong>Description:</strong> {linkedPostData.description}</p>
            <p className="p-0 my-2"><strong>Date sighted:</strong> {linkedPostData.date}</p>
          </div>
          {linkedPostData.imageUrl && (
          <a
            href={linkedPostData.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={linkedPostData.imageUrl}
              alt={linkedPostData.itemName}
              style={{
                width: '100%',
                maxHeight: '250px',
                objectFit: 'contain',
                borderRadius: '8px',
                marginTop: '10px',
                cursor: 'pointer'
              }}
              onError={(e) => {
                console.error("Image failed to load:", e.currentTarget.src);
                e.currentTarget.style.display = "none";
              }}
            />
          </a>
          )}
        </div>
      </>
    ) : (
      <p className="text-muted">No linked reference post found or failed to load.</p>
    )}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={() => setShowReportModal(false)}
        style={{
          backgroundColor:'#2169ac',
          color:'white',
          fontSize:'13px',
          outline:'none',
          border:'none',
          fontFamily: "Poppins, sans-serif",  
        }}>Close</Button>
      </Modal.Footer>
    </Modal>

    {/* Confirm Denial Modal */}
    <Modal show={!loading && showDenyModal && !!reportToDeny} onHide={handleCloseDenyModal} centered>
      <Modal.Header closeButton>
        <Modal.Title className="" style={{
          color:'#2169ac',
        }}>Confirm Denial</Modal.Title>
      </Modal.Header>
      <Modal.Body
             style={{
              color:'#2169ac',
              fontFamily: "Poppins, sans-serif",
              fontSize:'13px'
            }}>
        <p>Are you sure you want to <strong className="text-danger">deny</strong> the claim for <strong>{reportToDeny?.itemName}</strong>?</p>
        <p>This action <b>cannot be undone</b>.</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowDenyModal(false)}
         style={{
          color:'white',
          fontSize:'13px',
          outline:'none',
          border:'none',
          fontFamily: "Poppins, sans-serif",
         }}
          disabled={loading} 
         >Cancel</Button>
        <Button onClick={confirmDenyReport}
         style={{
          backgroundColor:' #e86b70',
          color:'white',
          fontSize:'13px',
          outline:'none',
          border:'none',
          fontFamily: "Poppins, sans-serif",
          }}
           disabled={loading}
          >
         {loading ? 'Denying...' : 'Yes, Deny Report'}
        </Button>
      </Modal.Footer>
    </Modal>

    {/* Send Email Modal */}
    <Modal show={showEmailModal && !!selectedReport} onHide={() => setShowEmailModal(false)} centered
            style={{
              color:'#2169ac',
              fontFamily: "Poppins, sans-serif",
            }}>
      <Modal.Header closeButton>
        <Modal.Title>Send Email to {selectedReport?.claimantName}</Modal.Title>
      </Modal.Header>
      <Modal.Body
            style={{
              fontSize:'16.4px'  
            }}>
        <p>Send a confirmation email to <b>{selectedReport?.claimantName}</b>.</p>
        <Form.Group>
          <Form.Label>Message:</Form.Label>
          <Form.Control as="textarea" rows={4} placeholder="Enter your message..." value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={() => setShowEmailModal(false)}
          style={{
            backgroundColor:' #e86b70',
            color:'white',
            fontSize:'13px',
            outline:'none',
            border:'none',
            fontFamily: "Poppins, sans-serif",
            }}>Cancel</Button>
        <Button onClick={() => selectedReport && handleSendEmail(selectedReport)}
          style={{
            backgroundColor:"#2169ac",
            color:'white',
            fontSize:'13px',
            outline:'none',
            border:'none',
            fontFamily: "Poppins, sans-serif",
           }}>Send Email</Button>
      </Modal.Footer>
    </Modal>
    
    </div>
    

  );
};

export default AdminApproval;
