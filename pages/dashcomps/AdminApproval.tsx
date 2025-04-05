import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../src/firebase";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { createNotification } from "../../components/notificationService";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaChevronLeft } from "react-icons/fa";
import categoryImages from "../../src/categoryimage";

interface Report {
  id: string;
  item: string;
  category: string;
  description: string;
  location: string;
  date: string;
  type: string;
  status: string;
  userId: string;
}

const AdminApproval: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [userNames, setUserNames] = useState<{ [key: string]: string }>({});
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  
  const approveReport = async (reportId: string) => {
    try {
      console.log("🔄 Fetching report data...");
      
      const reportRef = doc(db, "lost_items", reportId);
      const reportSnap = await getDoc(reportRef);
  
      if (!reportSnap.exists()) {
        alert("❗ Report not found.");
        return;
      }
  
      console.log("✅ Updating report status...");
      await updateDoc(reportRef, { status: "approved" });

      const reportData = reportSnap.data();
      const type = reportData.type;

      await createNotification(
        type === "lost" ? "A lost item report has been approved!" : "A found item report has been approved!",
        reportId
      );
      alert("✅ Report approved and notification created!");

      setReports((prevReports) => prevReports.filter((r) => r.id !== reportId));
      setShowModal(false);
    } catch (error) {
      console.error("❗ Error approving report:", error);
      alert("❗ Failed to approve the report.");
    }
  };
  const denyReport = async (reportId: string) => {
    try {
      const reportRefr = doc(db, "lost_items", reportId)
      await updateDoc(reportRefr, {status: "denied"});
      setReports((prevReports) => prevReports.filter((r) => r.id !== reportId));
    } catch (error) {
      console.error(error);
      alert("Deny error");
    }
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "lost_items"));
        const reportData = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Report))
          .filter((report) => report.status === "pendingreport");

        setReports(reportData);
        setLoading(false);
        fetchUserNames(reportData);
      } catch (error) {
        console.error("❗ Error fetching reports:", error);
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const fetchUserNames = async (reports: Report[]) => {
    const userIds = [...new Set(reports.map((report) => report.userId))]; // Unique user IDs
    const nameMap: { [key: string]: string } = {};

    await Promise.all(
      userIds.map(async (userId) => {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const fullName = `${userData.firstName} ${userData.middleInitial ? userData.middleInitial + ". " : ""}${userData.lastName}`;
          nameMap[userId] = fullName.trim();
        } else {
          nameMap[userId] = "Unknown User"; // Fallback for missing users
        }
      })
    );

    setUserNames(nameMap);
  };

  if (loading) return <p>Loading reports...</p>;

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Reports Approval</h1>
      <button 
          className="btn d-flex align-items-center mb-0 pb-0" 
          onClick={() => navigate("/dashboard")}
          style={{
            fontSize:'clamp(12px, 3vw, 18px)'
          }}
        >
          <FaChevronLeft /> Return
        </button>
      {reports.length === 0 ? (
        <p className="text-center">No pending reports.</p>
      ) : (
      <div className="d-flex justify-content-center">   
       <div className="list-group w-75">
        {reports.map((report) => (
          <div
            key={report.id}
            className="list-group-item list-group-item-action text-light align-items-start rounded-3 mt-4"
            style={{
              backgroundColor: '#1B75BC',
            }}
          >
            <div className="d-flex align-items-center">
              <div
                style={{
                  width: '150px',
                  borderRight: '1px solid white',
                  padding: '10px',
                }}
              >
                <img
                  className="img-cat"
                  src={categoryImages[report.category] || '../src/assets/othersIcon.png'} alt={report.category}
                />
              </div>

              <div className="d-flex flex-column w-100 ms-3 mt-2"
                style={{
                  fontSize:"clamp(8px, 2vw, 15px)"
                }}>
                <div className="d-flex justify-content-between">
                  <p className="mb-1 me-2">{report.item}</p>
                  <small>{report.date}</small>
                </div>
                <p className="mb-1">{report.description}</p>
                <small>
                  <strong>Location:</strong> {report.location}
                </small>

                <div className="mt-3 d-flex gap-2 ms-auto">
                  <button
                    className="btn"
                    onClick={() => {
                      setSelectedReport(report);
                      setShowModal(true);
                    }}
                    style={{
                      height:"50%",
                      backgroundColor: '#67d753',
                      color: 'white',
                      fontSize:"clamp(5px, 1vw, 15px)",
                      outline: 'none',
                      border: 'none',
                      fontFamily: "Poppins, sans-serif",
                    }}
                  >
                    Process
                  </button>

                  <button
                    className="btn btn-secondary"
                    style={{
                      height:"50%",
                      backgroundColor: '#2169ac',
                      color: 'white',
                      fontSize:"clamp(5px, 1vw, 15px)",
                      outline: 'none',
                      border: 'none',
                      fontFamily: "Poppins, sans-serif",
                    }}
                  >
                    Contact Us
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
     </div>   
      )}
      {showModal && selectedReport && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered"
            style={{
              color:'#2169ac',
              fontFamily: "Poppins, sans-serif",
              fontSize:'16.4px'
            }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Verify <u>{userNames[selectedReport.userId]}'s</u> claim</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to approve this report?</p>
                <p><b>{selectedReport.item}</b> ({selectedReport.category}) </p>
                <p><b>Description:</b> {selectedReport.description}</p>
                <p><b>Location:</b> {selectedReport.location} at <b>{selectedReport.date}</b></p>
              </div>
              <div className="modal-footer">
                <p className="text-start">If you are sure in approving this report click <b className="text-success">Approve</b></p>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-outline-danger"  onClick={() => {
                    if (selectedReport) {
                      denyReport(selectedReport.id);
                      setShowModal(false);
                    }
                  }}
                  style={{
                    backgroundColor:' #e86b70',
                    color:'white',
                    fontSize:'13px',
                    outline:'none',
                    border:'none',
                    fontFamily: "Poppins, sans-serif",
                  }}>
                    Deny
                  </button>
                  <button type="button" className="btn btn-success" onClick={() => approveReport(selectedReport.id)} disabled={loading}
                    style={{
                      backgroundColor:'#67d753',
                      color:'white',
                      fontSize:'13px',
                      outline:'none',
                      border:'none',
                      fontFamily: "Poppins, sans-serif",
                    }}  >
                    {loading ? "Processing..." : "Approve"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApproval;
