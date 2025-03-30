  import { useEffect, useState } from "react";
  import { useNavigate } from "react-router-dom";
  import emailjs from "emailjs-com";
  import { db } from "../../src/firebase";
  import { onSnapshot, collection, doc, addDoc, getDoc, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
  import categoryImages from "../../src/categoryimage";
  import { FaChevronLeft } from "react-icons/fa";
  import "bootstrap/dist/css/bootstrap.min.css";

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
    const [showModal, setShowModal] = useState(false);

    const [showDenyModal, setShowDenyModal] = useState(false); //deny
    const [reportToDeny, setReportToDeny] = useState<Report | null>(null);

    const [showEmailModal, setShowEmailModal] = useState(false); //email
    const [emailMessage, setEmailMessage] = useState("");

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

    const handleVerify = async (report: Report) => {
      if (!selectedReport) return;
      setLoading(true);
    
      try {
        const userEmail = await fetchUserEmail(report.userId);
        if (!userEmail || !userEmail.includes("@")) {
          console.error("❌ Invalid or missing email. Claim cannot proceed.");
          alert("❌ Invalid email detected. Cannot proceed with claim.");
          return;
        }

        const reportRef = doc(db, "claim_items", report.id);
        await updateDoc(reportRef, { status: "claimed" });
    
        const receiptId = await storeReceiptInDatabase(report, userEmail);
        if (!receiptId) {
          console.error("❌ Failed to store receipt. Aborting email sending.");
          alert("❌ Failed to generate claim receipt. Try again.");
          return;
        }
    
        await sendEmail(report, receiptId, userEmail);  
        setReports((prevReports) => prevReports.filter((r) => r.id !== report.id));
      } catch (error) {
        console.error("Error verifying claim:", error);
        alert("Error processing claim.");
      } finally {
        setLoading(false);
        setShowModal(false);
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
        alert(`✅ Claim receipt sent to ${userEmail} and stored in database.`);
      } catch (error) {
        console.error("Error sending email:", error);
        alert("Failed to send email.");
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
        <h1 className="text-center mb-4">Claim Approval</h1>
          <button 
            className="btn d-flex align-items-center mb-2" 
            onClick={() => navigate("/dashboard")}
            style={{
              fontSize:'clamp(12px, 3vw, 18px)'
            }}
          >
            <FaChevronLeft /> Return
          </button>
          {loading ? (
        <p className="text-center">Loading reports...</p>
        ) : reports.length === 0 ? (
          <p className="text-center">No pending claims.</p>
        ) : (
          <div className="list-group">
            {reports.map((report) => (
              <button
                key={report.id}
                className="list-group-item list-group-item-action d-flex text-start rounded-4 mb-3 text-light"
                style={{
                  backgroundColor: "#2169ac",
                  border: "none",
                  textAlign: "left",
                }}
                onClick={() => {
                  setSelectedReport(report);
                  setShowReportModal(true);
                }}
              >
                <div className="d-flex justify-content-center align-items-center" style={{ width: "20%" }}>
                  <img
                    src={categoryImages[report.category] || "../src/assets/othersIcon.png"}
                    alt={report.category}
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "contain",
                    }}
                  />
                </div>
                <div className="d-flex p-2 flex-column justify-content-between" style={{ width: "80%" }}>
                  <div className="d-flex w-100 justify-content-between">
                    <p><b>{report.claimantName}</b> wants to claim an item:</p>
                    <small className="text-light">{report.timestamp}</small>
                  </div>
                  <h5 className="mb-1">{report.itemName} ({report.category})</h5>
                  <p className="mb-1 text-light"><b>{report.description}</b></p>
                  <p className="mb-1 text-light">with the referenced post: <b>{report.referencePostId}</b></p>
                  <p className="text-light">
                    Last location: <strong>{report.location}</strong> at <strong>{report.date}</strong>
                  </p>

                  <div className="d-flex gap-2 translate-end float-end">
                  <button
                    className="btn btn-warning"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedReport(report);
                      setShowModal(true);
                    }}
                  >
                    Verify
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={(event) => handleDenyClick(event, report)}
                  >
                    Deny
                  </button>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        {showModal && selectedReport && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Verify {selectedReport.claimantName}'s claim</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to verify this claim?</p>
                <p><b>{selectedReport.itemName}</b> ({selectedReport.category}) </p>
                <p><b>Description:</b> {selectedReport.description}</p>
                <p><b>Location:</b> {selectedReport.location} at <b>{selectedReport.date}</b></p>
              </div>
              <div className="modal-footer">
                <p>If you are sure in approving this claim press <b className="text-success">Send Email</b> to send their claim receipt.</p>
                <button type="button" className="btn btn-outline-danger" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-success" onClick={() => selectedReport && handleVerify(selectedReport)} disabled={loading}>
                  {loading ? "Processing..." : "Send Email"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showReportModal && selectedReport && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Report Details</h5>
                <button type="button" className="btn-close" onClick={() => setShowReportModal(false)}></button>
              </div>
              <div className="modal-body">
                <h5>{selectedReport.itemName} ({selectedReport.category})</h5>
                <p><b>Description:</b> {selectedReport.description}</p>
                <p><b>Location:</b> {selectedReport.location} at {selectedReport.date}</p>
                <p><b>Claimant:</b> {selectedReport.claimantName}</p>
                <p><b>Reference Post ID:</b> {selectedReport.referencePostId}</p>
                <p><b>Reported On:</b> {selectedReport.timestamp}</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowReportModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showDenyModal && reportToDeny && (
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.5)" }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title text-danger">Confirm Denial</h5>
              <button type="button" className="btn-close" onClick={() => setShowDenyModal(false)}></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to <strong className="text-danger">deny</strong> the claim for <strong>{reportToDeny.itemName}</strong>?</p>
              <p>This action <b>cannot be undone</b>.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDenyModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={confirmDenyReport}>
                Yes, Deny Report
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
      {showEmailModal && selectedReport && (
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.5)" }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Send Email to {selectedReport.claimantName}</h5>
              <button type="button" className="btn-close" onClick={() => setShowEmailModal(false)}></button>
            </div>
            <div className="modal-body">
              <p>Send a confirmation email to <b>{selectedReport.claimantName}</b>.</p>
              <label className="form-label">Message:</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Enter your message..."
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
              ></textarea>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowEmailModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-success">
                Send Email
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
      </div>

    );
  };

  export default AdminApproval;
