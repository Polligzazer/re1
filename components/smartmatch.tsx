import { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useChatContext } from "../components/ChatContext";
import { collection, query, where, getDocs,  } from "firebase/firestore";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/swiper-bundle.css";
import { AuthContext } from './Authcontext';
import { db } from "../src/firebase";
import { Button, Modal } from "react-bootstrap";
import { compareLostAndFound, FIELD_WEIGHTS } from "../src/utils/huggingface";
import SmartMatchCard from "./SmartMatchCard";
import { handleSend } from "../chatcomponents/handleSend";
import { faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import categoryImages from "../src/categoryimage";
import "../css/smartmatch.css";
import Smartmatch from "/assets/smopen.png"

interface Report {
  id: string;
  item: string;
  type: string;
  category: string;
  location: string;
  date: string;
  status: string;
  timestamp: any;
  emailSent: boolean;
  imageUrl?: string;
  description: string;
}

const PLACEHOLDER_MATCH_COUNT = 3;

const initialMatchPlaceholders = Array.from({ length: PLACEHOLDER_MATCH_COUNT }, (_, i) => ({
  id: `placeholder-${i}`,
  itemName: '',
  category: '',
  location: '',
  date: '',
  description: '',
  score: 0,
  breakdown: {
    itemName: 0,
    category: 0,
    location: 0,
    date: 0,
    description: 0,
  },
  isPlaceholder: true
}));

const SmartMatch: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const { currentUser } = useContext(AuthContext);
  const [reports, setReports] = useState<Report[]>([]); // Holds all reports
  const [filterType, setFilterType] = useState<"all" | "lost" | "found">("all"); // Filter type
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [matches, setMatches] = useState<any[]>(initialMatchPlaceholders);
  const [lostItems, setLostItems] = useState<any[]>([]);
  const [foundItems, setFoundItems] = useState<any[]>([]);
  const { dispatch } = useChatContext();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showloading, setShowloading] = useState (false);
  const [dots, setDots] = useState('');
    useEffect(() => {
    const interval = setInterval(() => {
        setDots(prev => (prev.length < 3 ? prev + '.' : ''));
    }, 500);
    return () => clearInterval(interval);
    }, []);


  const handleInquire = (reportId: string) => {
      if (!currentUser) {
        alert("You must be logged in to inquire.");
        return;
      }
  
      const adminUID = "rWU1JksUQzUhGX42FueojcWo9a82";
      const adminUserInfo = { uid: adminUID, name: "Admin" };
  
      dispatch({ type: "CHANGE_USER", payload: adminUserInfo });
  
      const combinedId = currentUser.uid > adminUID ? currentUser.uid + adminUID : adminUID + currentUser.uid;
  
      handleSend(
        () => {},
        () => {},
        `Inquiring about report ID: ${reportId}`,
        { chatId: combinedId, user: adminUserInfo },
        currentUser,
        reportId
      );
  
      navigate("/inquiries");
    };

  // Fetch reports only once when the component mounts
  useEffect(() => {
    const fetchUserReports = async () => {
      if (!currentUser) {
        console.log("🚫 No current user, skipping fetch.");
        setLoading(false);  // Set loading to false if no user
        return;
      }

      try {
        console.log("🔍 Fetching reports for user:", currentUser.uid);
        setLoading(true);
        // Fetch reports with status "lost" or "found"
        const reportsQuery = query(
          collection(db, "lost_items"),
          where("userId", "==", currentUser.uid),
          where("type", "in", ["lost", "found"])
        );
        const reportsSnapshot = await getDocs(reportsQuery);

        console.log("📥 Retrieved reports snapshot:", reportsSnapshot.size, "documents found.");

        const fetchedReports = reportsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: (doc.data().timestamp?.toDate && doc.data().timestamp.toDate()) || new Date()
        })) as Report[];

        // Sort reports by timestamp (latest first)
        const sortedReports = fetchedReports.sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
        );

        setReports(sortedReports); // Set the reports state
        setLoading(false);  // Set loading to false
      } catch (error) {
        setLoading(false);
        console.error("❗ Error fetching user reports:", error);
      }
    };

    fetchUserReports();
  }, [currentUser]);  // Only fetch reports when currentUser changes


  // Memoize the filtered reports to avoid unnecessary recalculations on re-renders
  const filteredReports = useMemo(() => {
    switch (filterType) {
      case "lost":
        return reports.filter(report => report.type === "lost");
      case "found":
        return reports.filter(report => report.type === "found");
      default:
        return reports;  // Return all reports
    }
  }, [reports, filterType]); // Recompute only when reports or filterType changes

  // Filter reports based on type
  const handleFilterAll = () => {
    setFilterType("all");
  };

  const handleFilterLost = () => {
    setFilterType("lost");
  };

  const handleFilterFound = () => {
    setFilterType("found");
  };

useEffect(() => {
  const fetchReports = async () => {
    try {
      const q = query(collection(db, "lost_items"));
      const querySnapshot = await getDocs(q);
      const lost: any[] = [];
      const found: any[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const itemWithId = { id: doc.id, ...data }; // Include document ID

        if (data.type === "lost") {
          lost.push(itemWithId);
        } else if (data.type === "found") {
          found.push(itemWithId);
        }
      });

      setLostItems(lost);
      setFoundItems(found);

      console.log("📥 Lost items fetched:", lost.length);
      console.log("📥 Found items fetched:", found.length);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  fetchReports();
}, []);

  const handleSmartMatch = async (
    clickedItem: any,
    lostItems: any[],
    foundItems: any[]
    ) => {

        setIsLoading(true);
        setShowloading(true);

     try {
            const isLost = clickedItem.type === 'lost';
            const candidates = isLost ? foundItems : lostItems;

            const formattedClickedItem = {
            category: clickedItem.category,
            itemName: clickedItem.item || clickedItem.itemName,
            description: clickedItem.description,
            location: clickedItem.location,
            date: clickedItem.date,
            };

            console.log('🔍 Smart Match Triggered');
            console.log('Clicked Report ID:', clickedItem.id || clickedItem.id);
            console.log('Report Type:', isLost ? 'Lost' : 'Found');
            console.log('Matching against:', isLost ? 'Found Items' : 'Lost Items');
            console.log('Candidate count:', candidates.length);

            const topMatches = await compareLostAndFound(formattedClickedItem, candidates);
            setMatches(topMatches);

            console.log('🎯 Top Matches:', topMatches);
            setIsLoading(false);
            setShowModal(false);
        } catch (error) {
            console.error("Smart Match failed:", error);
        } finally{
             setTimeout(() => setShowloading(false), 2200);
        }
    };

  const handleCloseModal = () => {
    setShowModal(false); // Close the modal
    setSelectedReport(null);
     // Clear the selected report
  };

  
    const handleNavigateToSmartmatch = () => {
    navigate("/home");
  };

  return (
    <div className="mt-4 mt-md-3">
      <div className="pt-5 p-5 mb-4" style={{borderRadius:'10px', backgroundColor:'#fafcff'}}>
        <p className="" style={{ 
            fontFamily: "DM Sans, sans-serif", 
            color:"#212020",
            fontSize:"clamp(13px, 5vw, 25px)"}}>
        Welcome to our <span style={{color:'#0e5cc5'}}>Smart Matching!</span></p>
        <div className="reports">
          <div className="buttons d-flex flex-row mb-3">
            <button 
              className={`btn ${filterType === "all" ? "btn-primary" : "btn-outline-primary"} me-2`}
              onClick={handleFilterAll}
            >
              All
            </button>
            <button 
              className={`btn ${filterType === "lost" ? "btn-primary" : "btn-outline-primary"} me-2`}
              onClick={handleFilterLost}
            >
              Lost
            </button>
            <button 
              className={`btn ${filterType === "found" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={handleFilterFound}
            >
              Found
            </button>
          </div>
          <Swiper
            spaceBetween={20}
            slidesPerView={1}
            breakpoints={{
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
          >
            {filteredReports.map(report => (
              <SwiperSlide key={report.id}>
                <div className="card p-2 py-3" style={{fontSize:'13px', borderRadius:'13px', backgroundColor:'#2169ac', color:'white', fontFamily:'Poppins, sans-serif'}}>
                    <div className="d-flex flex-row">
                        <div className="imgreport-div d-flex align-items-center p-2 me-4"
                        style={{
                            borderRight:"1px solid white",
                        }}
                        >
                        <img
                            src={categoryImages[report.category] || "../src/assets/othersIcon.png"}
                            alt={report.category}
                            className="smreport-image"
                        />
                        </div>
                        <div className="report-infos"
                        style={{
                            fontSize:'11px',
                            fontFamily: "Poppins, sans-serif",
                            textOverflow:'ellipsis'
                        }}
                        >
                            <p className="m-0 mb-2 text-truncate" style={{textOverflow: 'ellipsis'}}><span className="fw-bold">Item:</span> {report.item}</p>
                             <p className="m-0 mb-2 text-truncate" style={{textOverflow: 'ellipsis'}}><span className="fw-bold">Report type:</span> {report.type}</p>
                            <p className="mb-2 m-0 text-truncate" style={{textOverflow: 'ellipsis'}}><span className="fw-bold">Category:</span> {report.category}</p>
                            <p className="m-0 " style={{textOverflow: 'ellipsis',   whiteSpace: 'nowrap', overflow: 'hidden',}}><span className="fw-bold">Id:</span> {report.id}</p>
                        </div>    
                    </div>
                    <div className="d-flex flex-row pt-1 gap-2" style={{borderRadius:'5px', backgroundColor:''}}>
                        <button 
                        style={{ fontSize:'11px', backgroundColor:'#67d753', color:'white', width:'50%'}}
                        className="btn btn-sm mt-2 px-3"
                        onClick={() => {
                            setSelectedReport(report);
                            setShowModal(true);
                        }}
                        >
                        Details
                        </button>

                        <button
                        style={{color:'white', backgroundColor:'#59b9ff', fontSize:'11px', width:'50%'}} 
                        className="btn btn-sm mt-2"
                        onClick={() => handleSmartMatch(report, lostItems, foundItems)}
                        >
                        <FontAwesomeIcon style={{color:'white'}} icon={faWandMagicSparkles}/> Match
                        </button>
                    </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
       {showModal && selectedReport && (
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
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
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
       </Modal>
      )}
      <Modal show={showloading} onHide={() => setShowloading(false)} centered>
        <Modal.Header>
            <Modal.Title
            style={{
                color: '#2169ac',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '16.4px',
            }}
            >
            {isLoading ? 'Analyzing with Smart Match...' : 'Top Matches Ready!'}
            </Modal.Title>
        </Modal.Header>
        <Modal.Body>
            {isLoading ? (
            <div className="d-flex justify-content-center align-items-center flex-column">
                <img
                src={Smartmatch}
                alt="Thinking..."
                className="pulse-image"
                style={{ width: '100px' }}
                />
                <span className="mt-3 loading-text" style={{ fontFamily: 'Poppins, sans-serif', color: '#2169ac' }}>
                Finding the best matches{dots}
                </span>
            </div>
            ) : (
            <div className="d-flex justify-content-center align-items-center flex-column">
                <div className="check-container pb-1">
                <div className="check-background">
                    <svg viewBox="0 0 65 51" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M7 25L27.3077 44L58.5 7"
                        stroke="white"
                        strokeWidth="13"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    </svg>
                </div>
                </div>
                <span className="mt-2" style={{ fontFamily: 'Poppins, sans-serif', color: '#2169ac' }}>
                Smart Match complete!
                </span>
            </div>
            )}
        </Modal.Body>
        <Modal.Footer></Modal.Footer>
        </Modal>
    <div className="container">
    {/* Top 1 Match - Full Width */}
    {matches.length > 0 && (
        <div className="mb-4">
        <h5 className="w-bold mb-3">Top Match</h5>
        <SmartMatchCard
            key={matches[0].id || 'top-1'}
            match={matches[0]}
            rank={1}
            onInquire={handleInquire}
        />
        </div>
    )}

    {/* Top 2 & 3 Matches - Side by Side and Smaller */}
    {matches.length > 1 && (
        <div>
        <h6 className="text-secondary fw-semibold mb-3">Other Top Matches</h6>
        <div className="row">
            {matches.slice(1, 3).map((match, index) => (
            <div className="col-md-6 mb-4" key={match.id || `top-${index + 2}`}>
                <div style={{ transform: 'scale(1)', transformOrigin: 'top left' }}>
                <SmartMatchCard
                    match={match}
                    rank={index + 2}
                    onInquire={handleInquire}
                />
                </div>
            </div>
            ))}
        </div>
        </div>
    )}
    </div>
       <div className="" style={{ width:'auto', position: 'fixed', bottom: '30px', right: '36px', zIndex: 1000, height:'55px' }}>
              <button className="p-1 d-flex " style={{
                height:'55px', 
                width:'55px', 
                backgroundColor:'#0f2c53', 
                outline:'none', 
                border:'none',
                borderRadius:'5px'
                }} 
                onClick={handleNavigateToSmartmatch}>
                <img style={{width:'46px', height:'46px'}} src={Smartmatch}/>
              </button>
          </div>
    </div>
  );
};

export default SmartMatch;
