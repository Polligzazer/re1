import { useState, useEffect, useContext, useRef } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/swiper-bundle.css";
import { Autoplay, FreeMode, Virtual } from "swiper/modules";
import "swiper/swiper-bundle.css";
import { db } from "../src/firebase";
import { handleSend } from "../chatcomponents/handleSend";
import { useChatContext } from "../components/ChatContext";
import { AuthContext } from "../components/Authcontext";
import { useNavigate } from "react-router-dom";
import categoryImages from "../src/categoryimage";
import "./home.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleChevronLeft, faHeadset, faAddressCard, faCircleChevronRight, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import ChatBot from "../components/Chatbot";
import ss1 from "/assets/ss1.png";
import ss2 from "/assets/ss2.png";
import ss3 from "/assets/ss3.png";
import ss6 from "/assets/ss6.png";
import ss7 from "/assets/ss7.png";
import FLO3 from "/assets/3FLO.png"
import FLO7 from "/assets/7.png"
import FLO9 from "/assets/9.png"
import FLO11 from "/assets/11.png"
import FLO12 from "/assets/12.png"
import FLO14 from "/assets/14.png"
import FLOpss1 from "/assets/pss1.png"
import StatusProgressBar from '../components/statusprogressbar';





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

const Home = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const { currentUser } = useContext(AuthContext);
  const { dispatch } = useChatContext();
  const navigate = useNavigate();
  const swiperRefs = useRef<{ [key: string]: any }>({});

  const [pendingReports, setPendingReports] = useState<Report[]>([]);
  const [pendingClaims, setPendingClaims] = useState<Claim[]>([]);
  const [filteredPending, setFilteredPending] = useState<(Report | Claim)[]>([]);
  // const [loading, setLoading] = useState(true);


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
            where("status", "in", ["pendingclaim"])
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
    
          let surrender = 0;
          let underReview = 0;
          let readyToClaim = 0;
          let verifying = 0;
    
          combined.forEach(item => {
            if (item.status === 'pendingreport') {
              if (isReport(item) && item.type === 'found') {
                surrender++;
              } else {
                underReview++;
              }
            } else if (item.status === 'pendingclaim') {
              if (item.emailSent) {
                readyToClaim++;
              } else {
                verifying++;
              }
            }
          });
    
         

          setPendingReports(fetchedReports);
          setPendingClaims(fetchedClaims);
          setFilteredPending(combined); 
        } catch (error) {
          console.error("❗ Error fetching pending data:", error);
        }
      };
    
      fetchPendingData();
    }, [currentUser]);
  
  
    const isReport = (item: Report | Claim): item is Report => {
      return (item as Report).type !== undefined;
    };

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
  const handleNavigateToInquiries = () => {
    navigate("/inquiries");
  };
  const handleNavigateToReports = () => {
    navigate("/report");
  };
 


  
  const sortByTimestamp = (array: Report[]) =>
    [...array].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
     });

  const lostReports = sortByTimestamp(reports.filter(report => report.type?.trim().toLowerCase() === "lost"));
  const foundReports = sortByTimestamp(reports.filter(report => report.type?.trim().toLowerCase() === "found"));
  const allReports = sortByTimestamp(reports);

  return (
    <div className="mt-4 mt-md-3">
      <div className="topcontent" style={{
        width:'100%'
      }}>
        <div className=" swipercolumn d-flex flex-column">
          <Swiper
          
            className="mt-4 pt-1"
            modules={[Autoplay]}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            loop={true}
            slidesPerView={1}
            spaceBetween={10}
            style={{height:'auto'}}
          >
            <SwiperSlide style={{height:'auto'}}>
              <div 
                className="slide1 p-3 d-flex justify-content-center align-items-center text-white fw-bold" 
                style={{
                    position:'relative',
                    backgroundImage: `url(${ss6})`,                 
                  }}>
                <p className='headline1 text-start ms-4 w-75' style={{
                  fontFamily:'DM sans, sans-serif'
                }}> Welcome to the <br/> Lost & Found System!</p>
                 <div className="navismain">
                   <div
                      className=" naviscircle d-flex">
                    <img src={FLO3}
                      alt="Chatbot" className="navisimg"/>
                   </div>    
                </div>
              </div>
            </SwiperSlide>
            <SwiperSlide style={{height:'auto'}}>
            <div 
                className="slide2 p-3 d-flex justify-content-center align-items-center text-white fw-bold" 
                style={{
                    backgroundImage: `url(${ss1})`,
                  }}>
                <p className=' text-end w-75 ms-5' style={{
                  fontFamily:'DM sans, sans-serif'
                }}> Lost an item?  <br/> File a report immediately!</p>
                 <div className="" style={{ width:'auto', position: 'fixed', bottom: '10px', left: '40px', zIndex: 1000 }}>
                    <img src={FLO14}
                      alt="Chatbot" className="navisother"/>
                    
                </div>
              </div>
            </SwiperSlide>
            <SwiperSlide style={{height:'auto'}}>
            <div 
                className="slide3 p-3 d-flex justify-content-start align-items-center text-white fw-bold" 
                style={{    
                    backgroundImage: `url(${ss3})`,
                  }}>
                <p className='headline2 text-start ms-5 ps-2 m-0 w-75' style={{
                  fontFamily:'DM sans, sans-serif'
                }}> Found something?  <br/>Help others by reporting it here.</p>
                 <div className="" style={{ width:'auto', position: 'fixed', bottom: '10px', right: '40px', zIndex: 1000 }}>
                   
                    <img src={FLO11}
                      alt="Chatbot" className="navisother3"/>
                    
                </div>
              </div>
            </SwiperSlide>
            <SwiperSlide style={{height:'auto'}}>
            <div 
                className="slide4 p-3 d-flex justify-content-end align-items-center text-white fw-bold" 
                style={{
                  
                    backgroundImage: `url(${ss2})`,
                  }}>
                <p className='headline3 text-end w-100 m-0 me-5' style={{
                  fontFamily:'DM sans, sans-serif'
                }}> Found your lost item?  <br/> Inquire and Claim it now!</p>
                 <div className="" style={{ width:'auto', position: 'fixed', bottom: '10px', left: '40px', zIndex: 1000 }}>              
                    <img src={FLO9}
                      alt="Chatbot" className="navisother"/> 
                </div>
              </div>
            </SwiperSlide>
            <SwiperSlide style={{height:'auto'}}>
            <div 
                className="slide5 p-3 d-flex justify-content-end align-items-center text-white fw-bold" 
                style={{
                  
                    backgroundImage: `url(${ss3})`,
                  }}>
                <div className=" align-items-center image-fluid d-flex flex-row">    
                  <img 
                    className="pendingex" 
                    src={FLOpss1}
                  />
                  <p className='headlinep text-end w-75 ms-5 ps-3' style={{
                    fontFamily:'DM sans, sans-serif'
                  }}> Pending awaits,  <br/> Come and Check them!</p>
                </div>
                 <div className="" style={{ width:'auto', position: 'fixed', bottom: '10px', left: '40px', zIndex: 1000 }}>
                 
                    <img src={FLO12}
                      alt="Chatbot" className="navisotherp"/>
                    
                </div>
              </div>
            </SwiperSlide>
            <SwiperSlide style={{height:'auto'}}>
            <div 
                className="slide6 p-3 d-flex justify-content-end align-items-center text-white fw-bold" 
                style={{
                  
                    backgroundImage: `url(${ss7})`,                    
                  }}>
                <p className='headline4 text-end w-100 me-3' style={{
                  fontFamily:'DM sans, sans-serif'
                }}> Your privacy matters.<br/>  Reports are handled confidentially</p>
                 <div className="" style={{ width:'auto', position: 'fixed', bottom: '10px', left: '40px', zIndex: 1000 }}>              
                    <img src={FLO7}
                      alt="Chatbot" className="navisother"/> 
                </div>
              </div>
            </SwiperSlide>
          </Swiper>
            <div className=" topbuttons mt-4 px-3">
              <div className="directbutton p-0 m-0">
                  <button 
                     className="buttondirect"
                    onClick={handleNavigateToReports}
                    >
                    <div className="d-flex justify-content-center align-items-center "> 
                      <FontAwesomeIcon style={{color:"#f0474e", fontSize:"18px"}}icon={faCircleExclamation}/> 
                      <span className="ms-1" style={{fontSize:"clamp(11px, 1.3vw, 15px)"}}>Quick Report</span>
                    </div>
                  </button>
                  <button 
                    className="buttondirect"
                    onClick={handleNavigateToInquiries}
                  >
                      <div className="d-flex justify-content-center align-items-center "> 
                      <FontAwesomeIcon style={{color:"#67d753", fontSize:"18px"}}icon={faHeadset}/> 
                      <span className="ms-2" style={{fontSize:"clamp(11px, 1.3vw, 15px)"}}>Inquire Admin</span>
                    </div>
                  </button>
                </div>
                <div className="totalreports d-flex">
                  <div 
                  className="totalreportsdiv d-flex justify-content-center">
                  <div className="d-flex justify-content-center align-items-center "> 
                    <FontAwesomeIcon style={{color:"004aad", fontSize:"18px"}}icon={faAddressCard}/> 
                    <span className="ms-2" style={{fontSize:"clamp(11px, 1.3vw, 15px)"}}>Total Reports: <span style={{color:'red'}}>{allReports.length}</span> </span>
                  </div>
                  </div>
                </div>  
            </div>
          </div>  
          <div className="pendingcontainer mt-4 p-1 pt-1">
            <p className="p-2 pb-0 text-center">Here's your latest pendings</p>
            {pendingReports.length > 0 || pendingClaims.length > 0 ? (
              <div className=" px-4 gap-2 pendings">
                {filteredPending.length > 0 && 
                  filteredPending.slice(0, 2).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigate("/report?tab=pending")}
                      className="d-flex flex-lg-row flex-column align-items-center mb-1 p-0 m-0"
                      style={{ width: '100%', borderRadius: '6px', border: 'none', outline: 'none' }}
                    >
                      <div className="Hpending-card align-content-center">
                        <div
                          className="card-main d-flex align-items-center p-3"
                          style={{
                            backgroundColor: '#1B75BC',
                            color: '#fff',
                            width: '100%',
                            height:'100%',
                            borderRadius: '6px',
                          }}
                        >
                          <div className="d-flex flex-column hfcolumn" style={{
                            width:'100%'
                          }}>
                            <div className="Hdetails d-flex justify-content-center ms-1 mb-1 align-items-start flex-column gap-2">
                              {isReport(item) && (
                                <p className="m-0 text-start">
                                  <strong>
                                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)} Item:
                                  </strong>{' '}
                                  {item.item.length > 12 ? item.item.slice(0, 12) + '...' : item.item}
                                </p>
                              )}
                            </div>
                            <span
                              className="text-white status p-2 d-flex align-items-center px-4"
                              style={{
                                backgroundColor:
                                  item.status === 'pendingreport'
                                    ? item.type == 'found'
                                      ? '#67d753'
                                      : '#59b9ff'
                                    : item.status === 'pendingclaim'
                                    ? item.emailSent
                                      ? '#67d753'
                                      : '#ffc107'
                                    : '#ffc107',
                              }}
                            >
                              {item.status === 'pendingreport'
                                ? item.type == 'found'
                                  ? 'Surrender the item'
                                  : 'Under Review'
                                : item.status === 'pendingclaim'
                                ? item.emailSent
                                  ? 'Item is ready to claim'
                                  : 'Verifying your request'
                                : 'Unknown Status'}
                            </span>
                            <StatusProgressBar  status={item.status} type={item.type} emailSent={item.emailSent} />
                          </div>
                        </div>
                       
                      </div>
                    </button>
                  ))}
              </div>
            ) : (
              <p className="text-center p-3 m-2" 
                style={{
                  fontFamily: "Poppins, sans-serif",
                  backgroundColor:'#ffe7b9'
                }}>No pending reports found.</p>
            )}          
          </div>
        </div>  
      <div className=" d-flex flex-row justify-content-start ms-4 mb-4">
        

      <div className="  post-transition my-4 mt-5 d-flex align-items-center">
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
      <div className="post-transition">
      {renderSection("All Reports", allReports, "all")}
      </div><div className="post-transition">
      {renderSection("Lost Items", lostReports, "lost")}
      </div><div className="post-transition">    
      {renderSection("Found Items", foundReports, "found")}
      </div>
      <div className="chat-animate" style={{ width:'auto', position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
          <ChatBot/>
      </div>
    </div>
  );

  function renderSection(title: string, reportList: Report[], key: string) {
    return (
      <div style={{ width: "100%", maxWidth: "100vw", marginBottom: "60px", position: "relative", textAlign: "start" }}>
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
            modules={[FreeMode, Virtual]}
            virtual={{
              addSlidesBefore: 10,
              addSlidesAfter: 10
            }}
            spaceBetween={0} 
            slidesPerView={1}
            freeMode={{ enabled: true, sticky: true }}

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

              {reportList.map((report, index) => (
                <SwiperSlide key={report.id} virtualIndex={index}>
                  <div className="report-card p-3 d-flex align-items-center">
                    <div className="imgreport-div d-flex align-items-center p-2 me-4"
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
          <p className="empty-message p-3 rounded text-center" style={{
            fontFamily: "Poppins, sans-serif",
            backgroundColor:'#ffe7b9'
          
          }}>No {title.toLowerCase()} found.</p>
        )}
        
      </div>
      
    );
  }
};

export default Home;
