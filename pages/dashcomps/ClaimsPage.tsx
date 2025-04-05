import {useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../src/firebase";
import { collection, getDocs } from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaChevronLeft } from "react-icons/fa";
import categoryImages from "../../src/categoryimage";

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
    const navigate = useNavigate();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

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
                        timestamp: data.timestamp?.seconds
                            ? new Date(data.timestamp.seconds * 1000).toLocaleString()
                            : "",
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

    const searchLower = searchTerm.toLowerCase();
    const filteredReports = reports.filter((report) =>
        report.claimantName.toLowerCase().includes(searchLower) ||
        report.itemName.toLowerCase().includes(searchLower) ||
        report.description.toLowerCase().includes(searchLower) ||
        report.category.toLowerCase().includes(searchLower) ||
        report.location.toLowerCase().includes(searchLower) ||
        report.referencePostId.toLowerCase().includes(searchLower)
    );

    if (loading) return <p>Loading claimed reports...</p>;

    return (
        <div className="container mt-4">
            <h1 className="text-center mb-4">Claimed Reports</h1>
            <button 
          className="btn d-flex align-items-center mb-0 pb-0" 
          onClick={() => navigate("/dashboard")}
          style={{
            fontSize:'clamp(12px, 3vw, 18px)'
          }}
        >
          <FaChevronLeft /> Return
        </button>
            <input
                type="text"
                placeholder="Search by Name, Item, Location, etc..."
                className="form-control mt-3 mb-3"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            {filteredReports.length === 0 ? (
                <p className="text-center">No claimed reports found.</p>
            ) : (
                <div className="list-group">
                {filteredReports.map((report) => (
                    <div className="w-75">
                    <div
                    key={report.id}
                    className="list-group-item list-group-item-action flex-column align-items-start text-light mb-3"
                    style={{
                        backgroundColor: '#1B75BC',
                    }}
                    >
                    <div className="d-flex mt-2 mb-2 align-items-center">
                        <div
                        style={{
                            width: '150px',
                            height: 'auto',
                            minHeight: '150px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRight: '1px solid white',
                            padding: '10px',
                        }}
                        >
                        <img
                            className="img-cat"
                            src={categoryImages[report.category] || '../src/assets/othersIcon.png'}
                            alt={report.category}/>
                        </div>

                        <div className="d-flex flex-column w-100 ms-4" 
                            style={{fontSize:"clamp(10px, 2vw, 15px)"}}>
                        <div className="d-flex justify-content-between">
                            <p className="mb-1"  style={{fontSize:"clamp(16px, 2vw, 20px)"}}>{report.itemName} ({report.category})</p>
                            <small>{report.timestamp}</small>
                        </div>
                        <p className="mb-1">{report.description}</p>
                        <p className="mb-1">Location: {report.location}</p>
                        <p className="mb-1">Reference Post: {report.referencePostId}</p>
                        <small>
                            <strong>Claimant:</strong> {report.claimantName || "N/A"}
                        </small>
                        </div>
                    </div>
                 </div>
                </div>
                ))}
            </div>
            )}
        </div>
    );
};

export default ClaimedReports;
