import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../../src/firebase";
import { collection, getDocs } from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";
import Topbar from "../../components/Topbar";

interface Report {
    id: string;
    category: string;
    claimantName: string;
    description: string;
    itemName: string;
    location: string;
    status: string;
    referencePostId: string;
    timestamp: string;
}

const ClaimedReports: React.FC = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "claim_items"));
                const reportData: Report[] = querySnapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        category: data.category || "",
                        claimantName: data.claimantName || "",
                        description: data.description || "",
                        itemName: data.itemName || "",
                        location: data.location || "",
                        status: data.status || "",
                        referencePostId: data.referencePostId || "",
                        timestamp: data.timestamp || "",
                    };
                });

                const claimedReports = reportData.filter((report) => report.status === "claimed");
                setReports(claimedReports);
                setLoading(false);
            } catch (error) {
                console.error("❗ Error fetching claimed reports:", error);
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    if (loading) return <p>Loading claimed reports...</p>;

    return (
        <div className="container mt-4">
            <Topbar />
            <h1 className="text-center mb-4">Claimed Reports</h1>
            <Link to="/dashboard" className="btn btn-secondary mb-3">
                Back to Dashboard
            </Link>
            {reports.length === 0 ? (
                <p className="text-center">No claimed reports found.</p>
            ) : (
                <div className="list-group">
                    {reports.map((report) => (
                        <div
                            key={report.id}
                            className="list-group-item list-group-item-action flex-column align-items-start"
                        >
                            <div className="d-flex w-100 justify-content-between">
                                <h5 className="mb-1">{report.itemName} ({report.category})</h5>
                                <small className="text-muted">{report.timestamp}</small>
                            </div>
                            <p className="mb-1">{report.description}</p>
                            <p className="mb-1">Location: {report.location}</p>
                            <p className="mb-1">Reference Post: {report.referencePostId}</p>
                            <small className="text-muted">
                                <strong>Claimant:</strong> {report.claimantName}
                            </small>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClaimedReports;
