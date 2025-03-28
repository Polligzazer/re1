import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../../src/firebase";
import { collection, getDocs, doc, getDoc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";

interface Report {
  id: string;
  item: string;
  description: string;
  location: string;
  date: string;
  status: string;
}

const AdminApproval: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  
  const approveReport = async (reportId: string) => {
    try {
      console.log("🔄 Fetching report data...");
      
      const reportRef = doc(db, "lost_items", reportId);
      const reportSnap = await getDoc(reportRef);
  
      if (!reportSnap.exists()) {
        alert("❗ Report not found.");
        return;
      }
  
      // ✅ Update report status to "approved"
      console.log("✅ Updating report status...");
      await updateDoc(reportRef, { status: "approved" });
  
      // ✅ Create ONLY ONE Notification for all users
      console.log("📢 Creating global notification...");
      const notificationRef = doc(db, "notifications", reportId); // Use reportId as notificationId to prevent duplicates
  
      await setDoc(notificationRef, {
        reportId: reportId,
        description: "A lost item report has been approved!",
        readBy: [],
        timestamp: serverTimestamp(),
      });
  
      console.log("✅ Notification created for all users!");
      alert("✅ Report approved and notification created!");
  
    } catch (error) {
      console.error("❗ Error approving report:", error);
      alert("❗ Failed to approve the report.");
    }
  };
  const denyReport = async (reportId: string) => {
    try {
      const reportRefr = doc(db, "lost_items", reportId)
      await updateDoc(reportRefr, {status: "denied"});
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
          .filter((report) => report.status === "pendingreport"); // Filter for pending reports

        setReports(reportData);
        setLoading(false);
      } catch (error) {
        console.error("❗ Error fetching reports:", error);
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) return <p>Loading reports...</p>;

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Reports Approval</h1>
      <Link to="/dashboard" className="btn btn-secondary mt-3">
          Back to Dashboard
        </Link>
      {reports.length === 0 ? (
        <p className="text-center">No pending reports.</p>
      ) : (
        <div className="list-group">
          {reports.map((report) => (
            <div
              key={report.id}
              className="list-group-item list-group-item-action flex-column align-items-start"
            >
              <div className="d-flex w-100 justify-content-between">
                <h5 className="mb-1">{report.item}</h5>
                <small className="text-muted">{report.date}</small>
              </div>
              <p className="mb-1">{report.description}</p>
              <small className="text-muted">
                <strong>Location:</strong> {report.location}
              </small>

              {/* Action Buttons */}
              <div className="mt-3 d-flex gap-2">
                <button
                  className="btn btn-success"
                  onClick={() => approveReport(report.id)}
                >
                  Approve
                </button>

                <button
                  className="btn btn-danger"
                  onClick={() => denyReport(report.id)}
                >
                  Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminApproval;
