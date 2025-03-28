  import { useEffect, useState } from "react";
  import { Link } from "react-router-dom";
  import { db } from "../../src/firebase";
  import { collection, getDocs, doc, addDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
  import categoryImages from "../../src/categoryimage";
  import "bootstrap/dist/css/bootstrap.min.css";
  import Topbar from "../../components/Topbar";

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
  }

  const AdminApproval: React.FC = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    
    const approveReport = async (id: string) => {
      try {
        console.log("✅ Approving report with ID:", id);
    
        const reportRef = doc(db, "claim_items", id);
        const reportSnapshot = await getDoc(reportRef);
    
        if (!reportSnapshot.exists()) {
          console.error("❗ Report does not exist in Firestore.");
          alert("❗ Report does not exist.");
          return;
        }
    
        console.log("✅ Report exists. Proceeding with update...");
    
        await updateDoc(reportRef, { status: "claimed" });
    
        console.log("✅ Report status updated successfully.");
    
        await addDoc(collection(db, "notifications"), {
          title: "New Approved Report",
          reportId: id,
          description: "A new lost item report has been approved.",
          timestamp: serverTimestamp(),
        });
    
        console.log("✅ Notification added successfully.");
        alert("✅ Report approved successfully and notification sent!");
      } catch (error) {
        console.error("❗ Error approving report:", error);
        alert("❗ Error approving report.");
      }
    };
    const denyReport = async (reportId: string) => {
      try {
        const reportRefr = doc(db, "claim_items", reportId)
        await updateDoc(reportRefr, {status: "deniedclaim"});
      } catch (error) {
        console.error(error);
        alert("Deny error");
      }
    };

    useEffect(() => {
      const fetchReports = async () => {
        try {
          const querySnapshot = await getDocs(collection(db, "claim_items"));
          const reportData: Report[] = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              category: data.category || "",
              date: data.date || "",
              claimantName: data.claimantName || "",
              description: data.description || "",
              itemName: data.itemName || "",
              location: data.location || "",
              status: data.status || "",
              referencePostId: data.referencePostId || "",
              timestamp: data.timestamp?.toDate().toLocaleString() || ""
            };
          });
    
          const pendingReports = reportData.filter(
            (report) => report.status === "pendingclaim"
          );
    
          setReports(pendingReports);
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
        <Topbar />
        <h1 className="text-center mb-4">Claim Approval</h1>
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
              className="list-group-item list-group-item-action d-flex text-start rounded-4 mb-3 text-light"
              style={{
                backgroundColor: "#2169ac",
              }}
              >
                <div className="d-flex justify-content-center align-items-center" style={{ width: "20%" }}>
                  <img
                  src={
                    categoryImages[report.category] ||
                    "../src/assets/othersIcon.png"
                  }
                  alt={report.category}
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "contain",
                  }}
                  />
                </div>
                <div className="d-flex p-2 flex-column justify-content-between"
                    style={{
                      width: "80%",
                    }}
                  >
                <div className="d-flex w-100 justify-content-between">
                <p><b>{report.claimantName}</b> wants to claim an item:</p>
                  <small className="text-light">{report.timestamp}</small>
                </div>
                <h5 className="mb-1">{report.itemName} ({report.category})</h5>
                <p className="mb-1 text-light"><b>{report.description}</b></p>
                <p className="mb-1 text-light">with the referenced post: <b>{report.referencePostId}</b></p>
                <p className="mb-1"></p>
                <p className="text-light">
                  Last location: <strong>{report.location}</strong> at <strong>{report.date}</strong>
                </p>

                {/* Action Buttons */}
                <div className="d-flex gap-2 translate-end float-end">
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
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  export default AdminApproval;
