import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import emailjs from "emailjs-com";
import { db } from "../../src/firebase";
import { onSnapshot, collection, doc, addDoc, getDoc, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import categoryImages from "../../src/categoryimage";
import { FaChevronLeft } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { Modal, Button, Form } from "react-bootstrap";

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
}

const AdminApproval: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [showVerifyModal, setVerifyModal] = useState(false);

  const [showDenyModal, setShowDenyModal] = useState(false); //deny
  const [reportToDeny, setReportToDeny] = useState<Report | null>(null);

  const [showEmailModal, setShowEmailModal] = useState(false); //email
  const [emailMessage, setEmailMessage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false); 
  const [pendingClaims, setPendingClaims] = useState(0);

  const denyReport = async (reportId: string) => {
    try {
      const reportRefr = doc(db, "claim_items", reportId)
      await updateDoc(reportRefr, {status: "deniedclaim"});
    } catch (error) {
      console.error(error);
      alert("Deny error");
    }
  };

  const handleDenyClick = (event: React.MouseEvent, report: Report) => {
    event.stopPropagation();
    setReportToDeny(report);
    setShowDenyModal(true);
  };

  const confirmDenyReport = () => {
    if (reportToDeny) {
      denyReport(reportToDeny.id);
      setShowDenyModal(false);
      setReportToDeny(null);
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
  
      /*await sendEmail(report, receiptId, userEmail);  
      setReports((prevReports) => prevReports.filter((r) => r.id !== report.id));
    } catch (error) {
      console.error("Error verifying claim:", error);
      alert("Error processing claim.");
    } finally {
      setLoading(false);
      setShowModal(false);
    }*/
      await sendEmail(report, receiptId, userEmail);

      // Open the verification modal
      setSelectedReport(report);
      setVerifyModal(true);
      setShowConfirmModal(true);
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Error processing claim.");
    } finally {
      setLoading(false);
      setShowEmailModal(false);
    }
  
  };

  const handleConfirmClaim = async () => {
    if (!selectedReport) return;
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

      const lostItemRef = doc(db, "lost_items", referencePostId);

      await updateDoc(lostItemRef, { status: "claimed" });
      await updateDoc(reportRef, { status: "claimed" });
      
      // Remove the claim from pending list
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
          setPendingClaims(pendingReports.length);
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
     <div className="d-flex flex-row justify-content-evenly mb-4">   
      <div className="d-flex flex-column" style={{
        width:'65%'
      }}>
        <h2 className="text-start fw-bold mt-5"
        style={{
          color:'#212020',
          fontFamily: "DM Sans, sans-serif", 
           
        }}
      >Claim Approval</h2>
      <p className="" 
        style={{
          color:'#454545',  
          fontFamily:"Poppins, sans-serif"
        }}>
          Hello <span style={{color:'#0e5cc5'}}>Admin, </span> you have 
          <span style={{color:'red'}}> {pendingClaims}</span> pending claims</p>
        </div>
      <div style={{
        width:'20%'
      }}>    
         <div className="d-flex p-3 flex-column pb-4" style={{
            backgroundColor:'#f1f7ff',
            borderRadius:'10px',
            border:'1px solid #bfbdbc',

          }}>
            <div className="d-flex flex-row justify-content-between align-items-center px-4">
              <p className="mt-3 m-0 mb-1" style={{
                fontFamily: "DM Sans, sans-serif", 
                fontSize:'30px',
                color:'#0e5cc5',
                padding:'0'
                
              }}>{pendingClaims}</p>
              <FontAwesomeIcon 
                icon={faExclamationTriangle}
                style={{
                  position:'relative',
                  color:'#e86b70',
                  fontSize:'34px',
                  top:'-5px'
                }}/>
            </div>
            <h3 className="px-4 text-start" style={{
              color:'#636363',
              fontFamily:"Poppins, sans-serif",
              fontSize:'17.6px'
            }}>Pending Claims</h3>
          </div>
        </div>
       </div> 
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
      <p className="text-center">Loading reports...</p>
      ) : reports.length === 0 ? (
        <p className="text-center">No pending claims.</p>
      ) : (
        <div className="list-group custom-scrollbar d-flex ms-0 ms-lg-5 pb-4 flex-column">
          {reports.map((report) => (
            <button
              key={report.id}
              className="list-group-item list-group-item-action card-main d-flex align-items-center p-4 rounded-4 mb-3 text-light"
              style={{ backgroundColor: '#1B75BC', color: '#fff', width: "100%", borderRadius:'6px' }}
              onClick={() => {
                setSelectedReport(report);
                setShowReportModal(true);
              }}
            >
            <div  className="pending-card align-content-center">
             
             
              <div className="d-flex flex-row fcolumn" >
                 <div className="conimg justify-content-center ">
                   <div style={{
                     borderRight:'1px solid white'
                   }}>
                     <img className="img-cat"
                       src={categoryImages[report.category] || '../src/assets/othersIcon.png'} // Dynamic image
                       alt={report.category}
                       
                     />
                   </div>
                 </div>
               <div className=" details d-flex justify-content-center align-items-start ms-4 flex-column gap-2">
                  <div className="d-flex w-100 justify-content-between">
                    <p><b>{report.claimantName}</b> wants to claim an item:</p>
                    <small className="text-light">{report.timestamp}</small>
                  </div>
                <h5 className="mb-1"><span>Item:</span>{report.itemName}</h5>
                <p className="mb-1 text-light"><span> Description:</span>{report.description}</p>
                <p className="mb-1 text-light"><span>Post reference Id: </span><b>{report.referencePostId}</b></p>
                <p className="text-light">
                <span> Last location: </span>{report.location} 
                </p>
                <p><span>Date of Lost: </span>{report.date}</p>
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
                    setVerifyModal(true);
                  }}
                  style={{ 
                    backgroundColor: "#e8a627", 
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
                    backgroundColor: "#e8a627", 
                    borderRadius:'15px',
                     width: "90px", 
                     height: "30px", 
                     color: "white", 
                     fontSize: "clamp(9px, 1vw, 12px)" }}
                >
                  Deny
                </button>
                </div>
                </div>
              </div>
              
            </button>
          ))}
        </div>
      )}
      {/* Verify Claim Modal */}
    <Modal show={showVerifyModal && !!selectedReport} onHide={() => setVerifyModal(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>Verify {selectedReport?.claimantName}'s claim</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Are you sure you want to verify this claim?</p>
        <p><b>{selectedReport?.itemName}</b> ({selectedReport?.category})</p>
        <p><b>Description:</b> {selectedReport?.description}</p>
        <p><b>Location:</b> {selectedReport?.location} at <b>{selectedReport?.date}</b></p>
      </Modal.Body>
      <Modal.Footer>
        <p>If you are sure in approving this claim, press <b className="text-success">Send Email</b> to send their claim receipt.</p>
        <Button variant="outline-danger" onClick={() => setVerifyModal(false)}>Cancel</Button>
        <Button variant="success" 
          onClick={() => selectedReport && handleSendEmail(selectedReport)}
            >
          Send Email
        </Button>
      </Modal.Footer>
    </Modal>

    {/*confirm claimed*/}

    <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
    <Modal.Header closeButton>
      <Modal.Title>Verify Claim</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <p><strong>Verify this user attempting to claim their item</strong></p>
      <p>✅ You have successfully sent an email to the user!</p>
      <p><strong>REFID:</strong> {selectedReport?.id}</p>
      <p><strong>Claimant:</strong> {selectedReport?.claimantName}</p>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
      <Button variant="success" onClick={handleConfirmClaim}>Claimed</Button>
    </Modal.Footer>
  </Modal>

    {/* Report Details Modal */}
    <Modal show={showReportModal && !!selectedReport} onHide={() => setShowReportModal(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>Report Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h5>{selectedReport?.itemName} ({selectedReport?.category})</h5>
        <p><b>Description:</b> {selectedReport?.description}</p>
        <p><b>Location:</b> {selectedReport?.location} at {selectedReport?.date}</p>
        <p><b>Claimant:</b> {selectedReport?.claimantName}</p>
        <p><b>Reference Post ID:</b> {selectedReport?.referencePostId}</p>
        <p><b>Reported On:</b> {selectedReport?.timestamp}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowReportModal(false)}>Close</Button>
      </Modal.Footer>
    </Modal>

    {/* Confirm Denial Modal */}
    <Modal show={showDenyModal && !!reportToDeny} onHide={() => setShowDenyModal(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title className="text-danger">Confirm Denial</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Are you sure you want to <strong className="text-danger">deny</strong> the claim for <strong>{reportToDeny?.itemName}</strong>?</p>
        <p>This action <b>cannot be undone</b>.</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowDenyModal(false)}>Cancel</Button>
        <Button variant="danger" onClick={confirmDenyReport}>Yes, Deny Report</Button>
      </Modal.Footer>
    </Modal>

    {/* Send Email Modal */}
    <Modal show={showEmailModal && !!selectedReport} onHide={() => setShowEmailModal(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>Send Email to {selectedReport?.claimantName}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Send a confirmation email to <b>{selectedReport?.claimantName}</b>.</p>
        <Form.Group>
          <Form.Label>Message:</Form.Label>
          <Form.Control as="textarea" rows={4} placeholder="Enter your message..." value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowEmailModal(false)}>Cancel</Button>
        <Button variant="success"  onClick={() => selectedReport && handleSendEmail(selectedReport)}>Send Email</Button>
      </Modal.Footer>
    </Modal>
    
    </div>

  );
};

export default AdminApproval;
