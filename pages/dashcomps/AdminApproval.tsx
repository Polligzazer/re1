import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../src/firebase";
import { collection, getDocs, doc, getDoc, updateDoc, orderBy, query, setDoc, serverTimestamp, onSnapshot, DocumentData } from "firebase/firestore";
import { sendPushNotification } from "../../components/notificationService";
import { createNotification } from "../../components/notificationService";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaChevronLeft } from "react-icons/fa";
import categoryImages from "../../src/categoryimage";
import { Button, Modal, Spinner } from "react-bootstrap";
import "../../css/ModalProgress.css";
import { faExclamationTriangle, faFileCirclePlus, faHeadset, faXmarkCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "../../css/loading.css"
import { APPWRITE_STORAGE_BUCKET_ID, apwstorage } from "../../src/appwrite";
import { ID } from "appwrite";

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
  imageUrl?: string;
}

const AdminApproval: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setUserNames] = useState<{ [key: string]: string }>({});
  const [showModal, setShowModal] = useState(false);
  const [isApproved, setIsApproved] = useState(false); 
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reporterName, setReporterName] = useState('');
  const [modalStatus, setModalStatus] = useState<'idle' | 'loading' | 'approved'>('idle');
  const [,] = useState<{
  [reportId: string]: { fileUrl: string | null; fileName: string };
  }>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);


   const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true); 
    
    try {
      const uploadedFile = await apwstorage.createFile(
        APPWRITE_STORAGE_BUCKET_ID,
        ID.unique(),
        file
      );
  
      const filePreviewUrl = apwstorage.getFilePreview(APPWRITE_STORAGE_BUCKET_ID, uploadedFile.$id);
  
      setFileName(file.name);
      setFileUrl(filePreviewUrl);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("❗ Failed to upload file. Please try again.");
    }finally {
      setLoading(false); 
    }
  };

  const approveReport = async (reportId: string) => {
    try {
      setModalStatus('loading'); 
      console.log("🔄 Fetching report data...");
      
      const reportRef = doc(db, "lost_items", reportId);
      const reportSnap = await getDoc(reportRef);
  
      if (!reportSnap.exists()) {
        setModalStatus('idle'); 
        alert("❗ Report not found.");
        return;
      }

    const data: DocumentData = reportSnap.data();
    const reportType = data.type;

      if (reportType === "found" && (!fileUrl || !fileName)) {
        alert("Please upload a proof file first.");
        return;
      }
  
      console.log("✅ Updating report status...");
      await updateDoc(reportRef, { 
        status: "approved",
        proofOfReturn: fileUrl ?? null,
        proofFileName: fileName ?? "",
        proofUploadedAt: serverTimestamp(),
      });

      let reportData = reportSnap.data();
      const type = reportData.type;
      const notificationText = type === "lost" 
        ? "A lost item report has been approved!" 
        : "A found item report has been approved!";
      const usersSnapshot = await getDocs(collection(db, "users"));
      const isLost = reportData.type === "lost";

      const notificationPromises = usersSnapshot.docs.map(async (userDoc) => {
        const userData = userDoc.data();
        const fcmToken = userData.fcmToken;
        try {
          await createNotification(
            userDoc.id,
            notificationText,
            reportId
          )
          if (fcmToken) {
            await sendPushNotification(fcmToken, {
              title: isLost ? "Someone lost an item" : "Someone found an item",
              body: isLost
                ? "A new lost item report has been approved. Check it out and see if it's yours!"
                : "A new found item report has been approved. Someone might be looking for it!",
              url: "/home",
            });
        console.log("✅ Push notification sent.");

          }
        } catch (error) {
          console.error('Notification error for', userDoc.id, error);
        }
      });
    
      setReports((prevReports) => prevReports.filter((r) => r.id !== reportId));
      setModalStatus('approved'); 
      setIsApproved(true);  
      setLoading(false);  
      Promise.all(notificationPromises);
    } catch (error) {
      console.error("❗ Error approving report:", error);
      alert("❗ Failed to approve the report.");
    }
  };

  const denyReport = async (reportId: string) => {
    try {
      setLoading(true);
      const reportRef = doc(db, "lost_items", reportId);
      await updateDoc(reportRef, { status: "denied" });
      const reportSnap = await getDoc(reportRef);
      if (!reportSnap.exists()) {
        alert("Report not found");
        return;
      }
      const reportData = reportSnap.data();
      const userId = reportData.userId;
      if (!userId) {
        console.error("❗ Report has no associated userId.");
        return;
      }

      const userSnap = await getDoc(doc(db, "users", userId));
      const fcmToken = userSnap.exists() ? userSnap.data().fcmToken : null;
      await setDoc(doc(collection(db, "users", userId, "notifications")), {
        description: "Your report has been denied",
        isRead: false,
        timestamp: serverTimestamp(),
        reportId,
      });
  
      if (fcmToken) {
        await sendPushNotification(fcmToken,{
          title: "Report Denied",
          body: "Your report has been denied by the admin, inquire for more details.",
          url: "/home",
        });
        console.log("✅ Push notification sent.");
      }
  
      setReports((prevReports) => prevReports.filter((r) => r.id !== reportId));
    } catch (error) {
      console.error("❌ Error denying report:", error);
      alert("Error denying report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const reportsQuery = query(
      collection(db, "lost_items"),
      orderBy("timestamp", "desc")
    );
  
    const unsubscribe = onSnapshot(reportsQuery, (querySnapshot) => {
      const reportData = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Report))
        .filter((report) => report.status === "pendingreport");
  
      setReports(reportData);
      setLoading(false);
      fetchUserNames(reportData);
    }, (error) => {
      console.error("❗ Error fetching reports in real-time:", error);
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, []);

  const fetchUserNames = async (reports: Report[]) => {
    const userIds = [...new Set(reports.map((report) => report.userId))];
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
          nameMap[userId] = "Unknown User"; 
        }
      })
    );

    setUserNames(nameMap);
  };

  const handleSelectedReport = async (report: Report) => {
    try {
      setSelectedReport(report);
      setShowReportModal(true);
      const userRef = doc(db, "users", report.userId);
      const userSnap = await getDoc(userRef);
  
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const fullName = `${userData.firstName} ${userData.middleInitial ? userData.middleInitial + ". " : ""}${userData.lastName}`;
        setUserNames((prev) => ({ ...prev, [report.userId]: fullName.trim() }));
      }
  
      
    } catch (error) {
      console.error("❗ Error fetching reporter details:", error);
    } 
  };

  useEffect(() => {
    const fetchReporterName = async () => {
      if (selectedReport?.userId) {
              try {
          
          const userRef = doc(db, "users", selectedReport.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const { firstName = "", middleInitial = "", lastName = "" } = userData;

            const fullName = `${firstName} ${middleInitial ? middleInitial + '.' : ''} ${lastName}`.trim();
            setReporterName(fullName || 'Unknown');
          } else {
            setReporterName('Unknown');
          }
        } catch (error) {
          console.error("Failed to fetch reporter name:", error);
          setReporterName('Error');
      }
    }
  };
  
    fetchReporterName();
  }, [selectedReport]);


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
        <div className="claim-top-text d-flex mb-5 flex-row align-items-center">   
            <div className="claim-top-text-text d-flex flex-column">
              <p className="text-start fw-bold m-0 pb-2 mt-5"
              style={{
                fontSize:"24px",
                color:'#212020',
                fontFamily: "DM Sans, sans-serif", 
                 
              }}
            >Report Approval</p>
            <p className="" 
              style={{
                color:'#454545',  
                fontFamily:"Poppins, sans-serif"
              }}>
                Hello <span style={{color:'#0e5cc5'}}>Admin, </span> you have 
                <span style={{color:'red'}}> {reports.length}</span> pending report approval</p>
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
                      
                    }}>{reports.length}</p>
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
                  }}>Pending Reports</p>
                </div>
              </div>
             </div> 
             <div className="container d-flex flex-column justify-content-center align-items-center px-0 mt-5"> 
              <div className=" ms-5 d-flex justify-content-end" style={{ width: '85%' }}>
                <div className="d-lg-flex d-none justify-content-center" style={{
                  width:'30%'
                }}>
                  <p className='text-center mb-3 pb-2' style={{
                    borderBottom:'2px solid #0e5cc5',
                    width:'50%',
                    fontSize: '13.8px',
                    fontFamily: 'Poppins, sans-serif',
                    color:'#0e5cc5'
                  }}>Status</p>
                </div>
              </div>

      {reports.length === 0 ? (
        <p className="text-center">No pending reports.</p>
      ) : (
      <div className="custom-scrollbar d-flex ms-0 ms-lg-5 pb-4 flex-column">
        {reports.map((report) => (
          <button
            key={report.id}
            className="d-flex flex-lg-row flex-column align-items-center mb-1 p-0 m-0"  
          style={{ backgroundColor: 'transparent', border:"none", color: '#fff', width: "100%", borderRadius:'6px' }}
          onClick={() => {
            handleSelectedReport(report);
            setShowReportModal(true);
              
          }}
        >

            <div  className="pending-card align-content-center">
               
              <div
                className="card-main d-flex align-items-center p-4"
                  style={{ backgroundColor: '#1B75BC', color: '#fff', width: "100%", borderRadius:'6px' }}
                  >
                   <div className="d-flex flex-row fcolumn" >
                      <div className="conimg justify-content-center ">
                        <div style={{
                          borderRight:'1px solid white'
                        }}>
                          <img className="img-cat"
                            src={categoryImages[report.category] || '/assets/othersIcon.png'}
                            alt={report.category}
                            
                          />
                        </div>
                      </div>

                      <div className=" details d-flex justify-content-center align-items-start ms-4 flex-column gap-2">
                        <p className="m-0">
                          <strong>Requested:</strong> {report.date}
                        </p>
                        <p className="m-0">
                          <strong>Last location:</strong> {report.location}
                        </p>
                        <p className="m-0">
                          <strong>{report.type.charAt(0).toUpperCase() + report.type.slice(1)} Item:</strong> {report.item}
                        </p>
                      </div>
                    </div>  


                  <div className="card-button d-flex gap-2 align-self-end justify-content-end" style={{
                      width:'22%',
                      fontFamily: "Poppins, sans-serif"
                    }}>
                  <button
                    className="btn"
                    onClick={(e) => {
                      e.stopPropagation(); 
                      setSelectedReport(report);
                      setShowModal(true);
                      setIsApproved(false); 
                    }}
                    style={{ 
                      backgroundColor: "#e8a627", 
                      borderRadius:'15px',
                       width: "90px", 
                       height: "30px", 
                       color: "white", 
                       fontSize: "clamp(9px, 1vw, 12px)" }} 
                  >
                    Process
                  </button>

                 <button className="btn"
                    style={{
                        backgroundColor: "#67d753",
                         width: "50px",
                        height: "30px",
                        color: "white",
                        fontSize: "15.2px",
                        borderRadius:'15px'
                        }}
                   onClick={() =>{ 
                    navigate(`/inquiries`)}}
                         >
                   <FontAwesomeIcon icon={faHeadset}/>
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
                        report.type === 'lost'
                          ? '#59b9ff'
                          : report.type === 'found'
                          ? '#67d753' 
                          : '#ffc107', 
                    }}
                  >
                    {report.type === 'lost'
                      ? 'To be posted'
                      : report.type === 'found'
                      ? 'Item to be surrendered'
                      : 'Unknown Status'}
                  </span>
                </div>
              </div>
          </button>
          
        ))}
      </div>
      
      
     
      )}
      {showModal && selectedReport?.type ==="lost" && (
        <Modal show={showModal && !!selectedReport} onHide={() => setShowModal(false)} centered contentClassName="custom-modal-content1">
          <Modal.Header closeButton>
            <Modal.Title 
            className="p-2"
              style={{
                color:'#2169ac',
                fontFamily: "Poppins, sans-serif",
                fontSize:'16.4px'
              }}
            >
              Approving lost item report...
            </Modal.Title>
          </Modal.Header>
          <Modal.Body
             className= {`${isApproved ? "p-2" : "p-4"}`}
            style={{
              color:'#2169ac',
              fontFamily: "Poppins, sans-serif",
              fontSize:'16.4px'
            }}
          >

          {modalStatus === 'loading' && (
              <div className="d-flex justify-content-center align-items-center mt-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Sending email...</span>
                </Spinner>
                <span className="ms-1"> Processing...</span>
              </div>
            )}

            {modalStatus === 'approved' && (
              <div className="d-flex justify-content-center align-items-center m-2 me-3">
                <div className="check-container pb-1">
                  <div className="check-background">
                    <svg viewBox="0 0 65 51" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 25L27.3077 44L58.5 7" stroke="white" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <span className="ms-1"> Report Approved</span>
              </div>
            )}

            {modalStatus === 'idle' && (
              <>
                <p><strong>Item: </strong>{selectedReport.item} ({selectedReport.category})</p>
                <p><strong>Location:</strong> {selectedReport.location}</p>
                <p><strong>Date of Lost:</strong> {selectedReport.date}</p>
              </>
            )}
          </Modal.Body>
          <Modal.Footer className="d-flex justify-content-between pb-1 flex-column align-items-start">
            {modalStatus === 'approved' ? (
              <div className="d-flex ms-auto pt-1">
                <Button
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                  style={{
                    backgroundColor: "#2c6dc2",
                    color: "white",
                    fontSize: "13px",
                    outline: "none",
                    border: "none",
                    fontFamily: "Poppins, sans-serif",
                  }}
                >
                  Close
                </Button>
              </div>
            ) : (
              <div className="d-flex gap-2 ms-auto">
                <Button 
                  variant="danger" 
                  onClick={() => {
                    if (selectedReport) {
                      denyReport(selectedReport.id);
                      setShowModal(false);
                    }
                  }}
                  style={{
                    backgroundColor: '#e86b70',
                    color: 'white',
                    fontSize: '13px',
                    outline: 'none',
                    border: 'none',
                    fontFamily: "Poppins, sans-serif",
                  }}
                >
                  Deny
                </Button>
                <Button 
                  onClick={() => approveReport(selectedReport.id)}
                  disabled={modalStatus === 'loading'}
                  style={{
                    backgroundColor: '#67d753',
                    color: 'white',
                    fontSize: '13px',
                    outline: 'none',
                    border: 'none',
                    fontFamily: "Poppins, sans-serif",
                  }}
                >
                  {modalStatus === 'loading' ? "Processing..." : "Approve"}
                </Button>
              </div>
            )}
          </Modal.Footer>
        </Modal>
      )}
      {showModal && selectedReport?.type === "found" && (
        <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        contentClassName="custom-modal-content1"
      >
        <Modal.Header closeButton>
          <Modal.Title
            className="p-2"
            style={{
              color: "#2169ac",
              fontFamily: "Poppins, sans-serif",
              fontSize: "16.4px",
            }}
          >
            Approving found item report...
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
         className= {`${isApproved ? "p-2" : "p-4"}`}
          style={{
            color: "#2169ac",
            fontFamily: "Poppins, sans-serif",
            fontSize: "16.4px",
          }}
        >  
         {modalStatus === 'loading' && (
              <div className="d-flex justify-content-center align-items-center mt-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Sending email...</span>
                </Spinner>
                <span className="ms-1"> Processing...</span>
              </div>
        )}

        {modalStatus === 'approved' && (
              <div className="d-flex justify-content-center align-items-center m-2 me-3">
                <div className="check-container pb-1">
                  <div className="check-background">
                    <svg viewBox="0 0 65 51" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 25L27.3077 44L58.5 7" stroke="white" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <span className="ms-1"> Report Approved</span>
              </div>
        )}

        {modalStatus === 'idle' && (
          <>
          <p><strong>Item:</strong> {selectedReport.item} ({selectedReport.category})</p>
          <p><strong>Location found:</strong> {selectedReport.location}</p>
          <p><strong>Date found:</strong> {selectedReport.date}</p>
          <hr />
          <p><strong>Has the item been physically surrendered to the Lost and Found office?</strong></p>
          <p className="text-muted" style={{ fontSize: '14px' }}>
            Please confirm the item is in possession by adding a picture of the item.
          </p>

           {/* Upload Section Starts */}
            <div className="d-flex flex-column align-self-end" style={{ width: "100%" }}>
              <div className="d-flex flex-rows">
                <input
                  type="file"
                  id="fileInput"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{
                    width: 0,
                    height: 0,
                    opacity: 0,
                    overflow: "hidden",
                    position: "absolute",
                  }}
                />

                <label
                  htmlFor="fileInput"
                  className="d-flex flex-column justify-end items-center w-full h-[125.4px] cursor-pointer"
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "transparent",
                    color: "#2169ac",
                    borderRadius: "5px",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faFileCirclePlus}
                    style={{
                      color: "#2169ac",
                      fontSize: "40px",
                    }}
                  />
                  <p className="text-center p-2 pb-0 mb-0">Add proof</p>
                </label>
                <button
                  onClick={() => {
                    setFileName("");
                    setFileUrl(null);
                    if (fileInputRef.current) {
                       fileInputRef.current.value = ""; // 👈 This resets the input
                    }
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "16px",
                    color: "gray",
                    fontWeight: "bold",
                  }}
                >
                  <FontAwesomeIcon icon={faXmarkCircle}/>
                </button>
              </div>
              {loading ? (
                <div className="d-flex justify-content-center align-items-center flex-column">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Uploading...</span>
                  </div>
                  <span className="mt-2" style={{ fontFamily: 'Poppins, sans-serif', color: '#2169ac' }}>
                    Uploading your file...
                  </span>
                </div>
              ) : fileUrl ? (
                <>

                  {/* ✅ Image Preview */}
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={fileUrl}
                      alt={fileName || "Uploaded proof"}
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
                </>
              ) : null}
            </div>
          </>
        )}
        
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between pb-1 flex-column align-items-start">
          {modalStatus === 'approved' ? (
          
            <div className="d-flex ms-auto pt-1">
              <Button
                variant="secondary"
                onClick={() => setShowModal(false)}
                style={{
                  backgroundColor: "#2c6dc2",
                  color: "white",
                  fontSize: "13px",
                  outline: "none",
                  border: "none",
                  fontFamily: "Poppins, sans-serif",
                }}
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="d-flex gap-2 ms-auto">
              <Button
                variant="danger"
                onClick={() => {
                  if (selectedReport) {
                    denyReport(selectedReport.id);
                    setShowModal(false);
                  }
                }}
                style={{
                  backgroundColor: "#e86b70",
                  color: "white",
                  fontSize: "13px",
                  outline: "none",
                  border: "none",
                  fontFamily: "Poppins, sans-serif",
                }}
              >
                Deny
              </Button>

              <Button
                onClick={() => approveReport(selectedReport.id)}
                disabled={loading || isApproved|| !fileUrl}
                style={{
                  backgroundColor: "#67d753",
                  color: "white",
                  fontSize: "13px",
                  outline: "none",
                  border: "none",
                  fontFamily: "Poppins, sans-serif",
                }}
              >
                 {modalStatus === 'loading' ? "Processing..." : "Confirm Surrender & Approve"}
              </Button>
            </div>
          )}
        </Modal.Footer>
       </Modal>
      )}
      {showReportModal && selectedReport && (
      <Modal
        show={showReportModal}
        onHide={() => setShowReportModal(false)}
        centered
        contentClassName="custom-modal-content1"
      >
        <Modal.Header closeButton>
          <Modal.Title
            style={{
              color: "#2169ac",
              fontFamily: "Poppins, sans-serif",
              fontSize: "13px",
            }}
          >
            Report Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
             style={{
              color:'#2169ac',
              fontFamily: "Poppins, sans-serif",
              fontSize:'15px'
            }}>
        <p><strong>Reporter:</strong> {reporterName}</p>
        <p>
          <strong>{selectedReport.type === "lost" ? "Item Lost:" : "Item Found:"}</strong>{" "}
          {selectedReport.item} ({selectedReport.category})
        </p>
        <p><strong>Description:</strong> {selectedReport.description || "No description provided"}</p>
        <p>
          <strong>{selectedReport.type === "lost" ? "Lost at:" : "Found at:"}</strong>{" "}
          {selectedReport.location}
        </p>
        <p>
          <strong>{selectedReport.type === "lost" ? "Date of Lost:" : "Date of Sighting:"}</strong>{" "}
          {selectedReport.date}
        </p>
        {selectedReport.imageUrl && (
          <div className="mt-3">
            <strong>Attached file:</strong>
            <div className="mt-2">
            <a href={selectedReport.imageUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={selectedReport.imageUrl}
                alt="Reported item"
                style={{
                  width: "100%",
                  maxHeight: "200px",
                  objectFit: "contain",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              />
            </a>
            </div>
          </div>
        )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReportModal(false)}>
            Close
          </Button>
        </Modal.Footer>
       </Modal>
      )}
      </div>
    </div>
  );
};

export default AdminApproval;
