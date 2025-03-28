import categoryImages from '../../src/categoryimage'; // adjust
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from 'react';
import { db } from '../../src/firebase'; // Ensure correct import for Firebase
import { collection, query, where, getDocs } from 'firebase/firestore';
import { AuthContext } from '../../components/Authcontext';
import { Modal, ProgressBar } from 'react-bootstrap';
import "../../css/ModalProgress.css";

interface Report {
  id: string;
  item: string;
  category: string;
  location: string;
  date: string;
  status: string;
  type: string;
}

const PendingReports = () => {
  const [pendingReports, setPendingReports] = useState<Report[]>([]);
  const { currentUser } = useContext(AuthContext);
  const [showModal, setShowModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPendingReports = async () => {
      if (!currentUser) return;

      const q = query(
        collection(db, 'lost_items'),
        where('userId', '==', currentUser.uid),
        where('status', 'in', ['pendingreport', 'pendingclaim'])
      );

      const querySnapshot = await getDocs(q);
      const fetchedReports = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Report[];

      setPendingReports(fetchedReports);
    };

    fetchPendingReports();
  }, [currentUser]);

  const handleProcess = (status: string) => {
    setShowModal(true);
    setProgress(status === 'pendingreport' ? 50 : 0);
  };

  return (
    <div className="container d-flex flex-column justify-content-center align-items-center mt-5">
      
      {/* Header Section with Title + Buttons in a row */}
      <div className="d-flex justify-content-between align-items-center" style={{ width: '85%' }}>
        
        
      </div>

      {pendingReports.length > 0 ? (
        <div className="ps-lg-3 row"
          style={{
            width: '85%',
            height: '60vh', // This makes the list scrollable
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
        >
          {pendingReports.map(report => (
            <div key={report.id} className="d-flex align-items-center w-100 mb-3">
              
              {/* Report Details */}
              <div>
                <div style={{
                  backgroundColor: "transparent",
                  border: "none",
                }}>
                  <div
                    className="d-flex align-items-center p-4"
                    style={{ backgroundColor: '#1B75BC', color: '#fff', width: "45rem" }}
                  >
                    <div className="justify-content-center w-25">
                      <div>
                        <img
                          src={categoryImages[report.category] || '../src/assets/othersIcon.png'} // Dynamic image
                          alt={report.category}
                          style={{ width: '100px', height: '100px' }}
                        />
                      </div>
                    </div>

                    <div className="w-75 d-flex align-items-start ms-3 flex-column gap-2">
                      <p className="m-0">
                        <strong>Requested:</strong> {report.date}
                      </p>
                      <p className="m-0">
                        <strong>Last location of the item:</strong> {report.location}
                      </p>
                      <p className="m-0">
                        <strong>{report.type.charAt(0).toUpperCase() + report.type.slice(1)} Item:</strong> {report.item}
                      </p>
                    </div>

                    <div className="d-flex gap-2 align-self-end">
                    {report.type.toLowerCase() === "found" && (
                      <button className="btn" style={{ backgroundColor: "#e8a627", width: "90px", height: "30px", color: "white", fontSize: "10.8px" }} onClick={() => handleProcess(report.status)}>
                        Process
                      </button>
                    )}
                    {report.type.toLowerCase() === "claim" && (
                      <button className="btn" style={{ backgroundColor: "#e8a627", width: "90px", height: "30px", color: "white", fontSize: "10.8px" }} onClick={() => handleProcess(report.status)}>
                        Process
                      </button>
                    )}
                      <button className="btn"
                        style={{
                          backgroundColor: "#67d753",
                          width: "90px",
                          height: "30px",
                          color: "white",
                          fontSize: "10.8px"
                        }}
                        onClick={() => navigate(`/inquiries`)}
                      >
                        Contact us
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Report Status */}
              <div className="d-flex align-items-center mx-5 px-5 justify-content-center">
                <span
                  className={`badge text-white py-2 px-4 ${
                    report.status === 'pendingreport'
                      ? 'bg-info'
                      : report.status === 'pendingclaim'
                      ? 'bg-success'
                      : 'bg-warning'
                  }`}
                  style={{
                    width: '150px',
                    height: "30px",
                    textAlign: 'center',
                    borderRadius: '17px',
                    fontSize: "11.8px",
                    fontFamily: "Poppins, sans-serif"
                  }}
                >
                  {report.status === 'pendingreport'
                    ? 'Under Review'
                    : report.status === 'pendingclaim'
                    ? 'To be claimed'
                    : 'Unknown Status'}
                </span>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <p className="text-center">No pending reports found.</p>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>You're one process away before posting the item you found!</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ProgressBar className="progress-container mb-4" animated now={progress}>
            <div className="progress-bar-custom" />
          </ProgressBar>
          <p className="fs-5">Please surrender your item at the lost and found / admission office.</p>
          <span className="fs-5">Wait for the admin's approval</span>
        </Modal.Body>
        <Modal.Footer>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PendingReports;
