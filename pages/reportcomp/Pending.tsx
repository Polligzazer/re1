import categoryImages from '../../src/categoryimage'; 
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from 'react';
import { db } from '../../src/firebase'; 
import { collection, query, where, getDocs } from 'firebase/firestore';
import { AuthContext } from '../../components/Authcontext';
import { Modal, ProgressBar } from 'react-bootstrap';
import "../../css/ModalProgress.css";
import "../../css/pending.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeadset } from '@fortawesome/free-solid-svg-icons';

interface Report {
  id: string;
  item: string;
  category: string;
  location: string;
  date: string;
  status: string;
  type: string;
  emailSent: boolean;
  timestamp: Date;
}

interface Claim {
  id: string;
  item: string;
  category: string;
  location: string;
  date: string;
  status: string;
  emailSent: boolean;
  timestamp: Date;
  type: string;
}

const PendingReports = () => {
  const [pendingReports, setPendingReports] = useState<Report[]>([]);
  const [pendingClaims, setPendingClaims] = useState<Claim[]>([]);
  const { currentUser } = useContext(AuthContext);
  const [showModal, setShowModal] = useState(false);
  const [showClaimModal, setClaimModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const [filteredPending, setFilteredPending] = useState<(Report | Claim)[]>([]);

  useEffect(() => {
    const fetchPendingData = async () => {
      if (!currentUser) return;
  
      try {
        const reportsQuery = query(
          collection(db, "lost_items"),
          where("userId", "==", currentUser.uid),
          where("status", "in", ["pendingreport"])
        );
        const reportsSnapshot = await getDocs(reportsQuery);
        const fetchedReports = reportsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: (doc.data().timestamp?.toDate && doc.data().timestamp.toDate()) || new Date() 
        })) as Report[];
  
        const claimsQuery = query(
          collection(db, "claim_items"),
          where("userId", "==", currentUser.uid),
          where("status", "in", ["pendingclaim", "onHold"])
        );
        const claimsSnapshot = await getDocs(claimsQuery);
        const fetchedClaims = claimsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: (doc.data().timestamp?.toDate && doc.data().timestamp.toDate()) || new Date()
        })) as Claim[];

        const combined = [...fetchedReports, ...fetchedClaims].sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
        );
  
      
        setPendingReports(fetchedReports);
        setPendingClaims(fetchedClaims);
        setFilteredPending(combined); 
      } catch (error) {
        console.error("❗ Error fetching pending data:", error);
      }
    };
  
    fetchPendingData();
  }, [currentUser]);

  const handleProcess = (status: string) => {
    setShowModal(true);
    setProgress(status === 'pendingreport' ? 50 : 0);
  };
  const handlePendingClaim = (_item: Report | Claim) => {
    setClaimModal(true);
  };

  const isReport = (item: Report | Claim): item is Report => {
    return (item as Report).type !== undefined;
  };

  return (
    <div className="container d-flex flex-column justify-content-center align-items-center px-0 mt-5">
      
      {/* Header Section with Title + Buttons in a row */}
      <div className=" ms-5 d-flex justify-content-end" style={{ width: '85%' }}>
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

      {pendingReports.length > 0 || pendingClaims.length > 0 ? (
  <div className="custom-scrollbar d-flex ms-0 ms-lg-5 pb-4 flex-column">
    {filteredPending.map(item => (
      <div key={item.id} className="d-flex flex-lg-row flex-column align-items-center mb-1 p-0 m-0" style={{ width: '100%' }}>
        
        {/* Report/Claim Details */}
        <div className="pending-card align-content-center">
          <div className="card-main d-flex align-items-center p-4" style={{ backgroundColor: '#1B75BC', color: '#fff', width: "100%", borderRadius: '6px' }}>
            <div className="d-flex flex-row fcolumn">
              <div className="conimg justify-content-center">
                <div style={{ borderRight: '1px solid white' }}>
                  <img className="img-cat"
                    src={categoryImages[item.category] || '/assets/othersIcon.png'}
                    alt={item.category}
                  />
                </div>
              </div>

              <div className="details d-flex justify-content-center align-items-start ms-4 flex-column gap-2">
                <p className="m-0">
                  <strong>{item.status === 'pendingclaim' ? 'Claim Requested:' : 'Requested:'}</strong> {item.date}
                </p>
                <p className="m-0">
                  <strong>Last location:</strong> {item.location}
                </p>
                {isReport(item) && (
                  <p className="m-0">
                    <strong>{item.type.charAt(0).toUpperCase() + item.type.slice(1)} Item:</strong> {item.item}
                  </p>
                )}
              </div>
            </div>

            <div className="card-button d-flex gap-2 align-self-end justify-content-end" style={{ width: '22%', fontFamily: "Poppins, sans-serif" }}>
              {item.status === 'pendingclaim' ? (
                <button className="btn" style={{ 
                  backgroundColor: "#e8a627", 
                  borderRadius: '15px',
                  width: "90px", 
                  height: "30px", 
                  color: "white", 
                  fontSize: "clamp(9px, 1vw, 12px)" }} 
                  onClick={() => handlePendingClaim(item)}>
                  Process
                </button>
              ) : (
                <>
                  {isReport(item) && item.type.toLowerCase() === "found" && (
                    <button className="btn" style={{ 
                      backgroundColor: "#e8a627", 
                      borderRadius: '15px',
                      width: "90px", 
                      height: "30px", 
                      color: "white", 
                      fontSize: "clamp(9px, 1vw, 12px)" }} 
                      onClick={() => handleProcess(item.status)}>
                      Process
                    </button>
                  )}
                  {isReport(item) && item.type.toLowerCase() === "claim" && (
                    <button className="btn" style={{ 
                      backgroundColor: "#e8a627", 
                      width: "90px", 
                      borderRadius: '15px', 
                      height: "30px", 
                      color: "white", 
                      fontSize: "10.8px" }} 
                      onClick={() => handleProcess(item.status)}>
                      Process
                    </button>
                  )}
                </>
              )}
              <button className="btn"
                style={{
                  backgroundColor: "#67d753",
                  width: "50px",
                  height: "30px",
                  color: "white",
                  fontSize: "15.2px",
                  borderRadius: '15px'
                }}
                onClick={() => navigate('/inquiries')}
              >
                <FontAwesomeIcon icon={faHeadset}/>
              </button>
            </div>
          </div>
        </div>

        {/* Status Section */}
        <div className="stsdiv mt-lg-0 mt-3 align-content-center">
          <div className="d-flex text-center align-items-center ps-lg-0 ps-2 justify-content-lg-center justify-content-start">
            <span className='labelstatus fw-bold pe-2 me-1 d-lg-none d-flex' style={{
              fontFamily: "Poppins, sans-serif",
              fontSize: '16px',
              color: '#0e5cc5'
            }}>Status:</span>
            <span
              className="text-white py-2 px-4"
              style={{
                width: '150px',
                minHeight: '35px',
                height: 'auto',
                textAlign: 'center',
                borderRadius: '11px',
                fontSize: "11.8px",
                fontFamily: "Poppins, sans-serif",
                backgroundColor: 
                  item.status === 'pendingreport' ? (item.type == 'found' ? '#67d753' : '#59b9ff') :
                  item.status === 'pendingclaim' ? (item.emailSent ? '#67d753' : '#ffc107') :
                  '#ffc107',
              }}
            >
              {item.status === 'pendingreport' ?  (item.type == 'found' ? 'Surrender the item' : 'Under Review') :
               item.status === 'pendingclaim' ? (item.emailSent ? 'Item is ready to claim' : 'Verifying your request') :
               'Unknown Status'}
            </span>
          </div>
        </div>
      </div>
    ))}
  </div>
)  : (
        <p className="text-center">No pending reports found.</p>
      )}

      <Modal contentClassName='custom-modal-content' show={showModal} onHide={() => setShowModal(false)} centered size="lg" style={{
        fontFamily: 'Poppins, sans-serif',
        color:'#2169ac',
        
      }}>
        <Modal.Header closeButton>
          <Modal.Title style={{
            fontSize:'16.4px',
            fontWeight:'light'
          }}>You're one process away before posting the item you found!</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ProgressBar className="progress-container mb-5" animated now={progress}>
            <div className="progress-bar-custom" />
          </ProgressBar>
          <p className="" style={{
            fontSize:'16.4px',
          }}>Please surrender your item at the lost and found / admission office, and wait for the admin's approval</p>
          
        </Modal.Body>
        <Modal.Footer>
        </Modal.Footer>
      </Modal>
      
      <Modal contentClassName='custom-modal-content' show={showClaimModal} onHide={() => setClaimModal(false)} centered size="lg" style={{
        fontFamily: 'Poppins, sans-serif',
        color:'#2169ac',
        
      }}>
        <Modal.Header closeButton>
          <Modal.Title style={{
            fontSize:'16.4px',
            fontWeight:'light'
          }}>The admin is reviewing your request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
           <ProgressBar className="progress-container mb-5" animated now={progress}>
            <div className="progress-bar-custom" />
          </ProgressBar>
          <p className="" style={{
            fontSize:'16.4px',
          }}>Kindly wait for a moment or contact the admin if the process takes too long. You'll receive a receipt if the admin approve your request.</p>
          
        </Modal.Body>
        <Modal.Footer>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PendingReports;
