import { useState, useEffect, useContext, useRef } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/swiper-bundle.css";
import { db } from "../src/firebase";
import { handleSend } from "../chatcomponents/handleSend";
import { useChatContext } from "../components/ChatContext";
import { AuthContext } from "../components/Authcontext";
import { useNavigate } from "react-router-dom";
import categoryImages from "../src/categoryimage";
import "./home.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleChevronLeft, faCircleChevronRight } from '@fortawesome/free-solid-svg-icons';

interface Report {
  id: string;
  item: string;
  type: string;
  category: string;
  location: string;
  date: string;
  status: string;
  timestamp: any;
}

const Home = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const { currentUser } = useContext(AuthContext);
  const { dispatch } = useChatContext();
  const navigate = useNavigate();
  const swiperRefs = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    const fetchReports = async () => {
      const q = query(collection(db, "lost_items"), where("status", "==", "approved"));

      const querySnapshot = await getDocs(q);
      const fetchedReports = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        };
      }) as Report[];

      setReports(fetchedReports);
    };

    fetchReports();
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

  const sortByTimestamp = (array: Report[]) =>
    [...array].sort((a, b) => {
      const timeA = a.timestamp?.seconds || 0;
      const timeB = b.timestamp?.seconds || 0;
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });

  const lostReports = sortByTimestamp(reports.filter(report => report.type?.trim().toLowerCase() === "lost"));
  const foundReports = sortByTimestamp(reports.filter(report => report.type?.trim().toLowerCase() === "found"));
  const allReports = sortByTimestamp(reports);

  return (
    <div className="mt-4 mt-md-3">
      <div className="d-flex flex-row justify-content-start ms-4 mb-4">
      

      <div className="my-4 mt-5 d-flex align-items-center">
        <label htmlFor="sortOrder" style={{ fontFamily: "Poppins, sans-serif", fontSize: "14px", marginRight: "8px" }}>
          Sort by Date:
        </label>
        <select
          id="sortOrder"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
          style={{
            fontFamily: "Poppins, sans-serif",
            padding: "4px 7px",
            border:"none",
            borderBottom:'1px solid #e8a627',
            color:"#2c6dc2",
            fontSize: "14px",
            background:"transparent",
            outline:'none'
          }}
        >
          <option value="newest">Most Recent First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>
      </div>

      {renderSection("All Reports", allReports, "all")}
      {renderSection("Lost Items", lostReports, "lost")}
      {renderSection("Found Items", foundReports, "found")}
    </div>
  );

  function renderSection(title: string, reportList: Report[], key: string) {
    return (
      <div style={{ width: "100%", maxWidth: "100vw", marginBottom: "50px", position: "relative", textAlign: "start" }}>
        <p style={{ 
          fontFamily: "DM Sans, sans-serif", 
          fontSize: "clamp(13px, 5vw, 18px)", 
          marginBottom: "20px",
          marginLeft:"clamp(15px, 7vw, 25px)" 
          }}>{title}</p>

        {reportList.length > 0 ? (
          <div className=" w-100 swiper-wrapper  text-start m-0">
         <Swiper
            className="w-100"
            style={{
              width: "100%",
              margin: "0px",
          
              display: "flex",
            }}
            modules={[FreeMode]}
            spaceBetween={0} 
            slidesPerView={1}
            freeMode={true}

            onSwiper={(swiper) => (swiperRefs.current[key] = swiper)}
            breakpoints={{
              // wait lang
              320: { slidesPerView: 1, spaceBetween: 0 },
              364: { slidesPerView: 1.1, spaceBetween: 0 },
              408: { slidesPerView: 1.2, spaceBetween: 0},
              452: { slidesPerView: 1.3, spaceBetween: 0},
              496: { slidesPerView: 1.4, spaceBetween: 0},
              540: { slidesPerView: 1.5, spaceBetween: 0},
              584: { slidesPerView: 1.6, spaceBetween: 0},
              628: { slidesPerView: 1.6, spaceBetween: 0},
              672: { slidesPerView: 1.7, spaceBetween: 0},
              716: { slidesPerView: 1.7, spaceBetween: 30},
              768: { slidesPerView: 2, spaceBetween: 0},
              992: { slidesPerView: 2.7, spaceBetween: 0},
              1036: { slidesPerView: 2.7, spaceBetween: 0},
              1080: { slidesPerView: 2.7, spaceBetween: 30}, 
              1160: { slidesPerView: 2.7, spaceBetween: 60}, 
              1210: { slidesPerView: 2.8, spaceBetween: 30}, 
              1240: { slidesPerView: 2.8, spaceBetween: 30}, 
              1300: { slidesPerView: 2.8, spaceBetween: 30},
              1400: { slidesPerView: 3, spaceBetween: 10},  
              1990: { slidesPerView: 3, spaceBetween: 10},
            }}
            centeredSlides={false}
            grabCursor={true}
          >

              {reportList.map((report) => (
                <SwiperSlide key={report.id}>
                  <div className="report-card p-3 d-flex align-items-center">
                    <div className="imgreport-div d-flex align-items-center p-3 me-4"
                      style={{
                        borderRight:"1px solid white",
                      }}
                    >
                      <img
                        src={categoryImages[report.category] || "../src/assets/othersIcon.png"}
                        alt={report.category}
                        className="report-image"
                      />
                    </div>
                    <div className="report-infos"
                      style={{
                        fontFamily: "Poppins, sans-serif",
                      }}
                    >
                      <p className="report-info">
                        <strong>
                          {report.type === "found" ? "Found item" : "Lost item"}:
                        </strong>{" "}
                        {report.item}
                      </p>
                      <p className="report-info">
                        <strong>
                          {report.type === "found"
                            ? "Seen at"
                            : "Last Location"}
                          :
                        </strong>{" "}
                        {report.location}
                      </p >
                      <p className="report-info">
                        <strong>
                          {report.type === "found" ? "Date of sight" : "Date of Lost"}:
                        </strong>{" "}
                        {report.date}
                      </p>
                      <button className="inquire-button" onClick={() => handleInquire(report.id)}>
                        Inquire
                      </button>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {reportList.length > 3 && (
              <div
                className="swiper-controls"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "10px",
                  marginTop: "10px",
                  position:"absolute",
                  bottom: '-40px', 
                  right: '50px', 
                  width:'auto'
                }}
              >
                <button
                  className="swiper-button prev"
                  style={{
                    color: "white",
                    border: "none",
                    fontSize: "16px",
                    cursor: "pointer",
                  }}
                  onClick={() => swiperRefs.current[key]?.slidePrev()}
                >
                    <FontAwesomeIcon 
                     style={{
                      fontWeight:'bold'
                    }}
                    icon={faCircleChevronLeft}/>
                </button>
                <button
                  className="swiper-button next"
                  style={{
                    color: "white",
                    border: "none",
                    fontSize: "16px",
                    cursor: "pointer",
                  }}
                  onClick={() => swiperRefs.current[key]?.slideNext()}
                >
                  <FontAwesomeIcon
                  style={{
                    fontWeight:'bold'
                  }}
                  icon={faCircleChevronRight}/>
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="empty-message">No {title.toLowerCase()} found.</p>
        )}
      </div>
    );
  }
};

export default Home;
