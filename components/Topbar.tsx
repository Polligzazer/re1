import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { AuthContext } from "../components/Authcontext";
import {
  AppNotification,
  markNotificationAsRead,
  fetchNotifications,
  fetchItemDetails,
  watchNewMessagesForUser, 
  createNotification,
  ValidMessage
} from "../components/notificationService";
import React from "react";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Item } from "./types";
import ItemPreviewModal from "./ItemPreviewModal";
import "../css/topbar.css";

import OptionIcon from "/assets/OptionIcon.png";
import FLOLOGObg from "/assets/FLOLOGObg.png";
import NotifIcon from "/assets/NotifIcon.png";
import NotifPfpIcon from "/assets/notifpfpicon.png";
import HomeIcon from "/assets/HomeIcon.png";
import DashboardIcon from "/assets/dashboard.png";
import ReportIcon from "/assets/reportIcon.png";
import HistoryIcon from "/assets/historyIcon.png";
import IIcon from "/assets/IIcon.png";
import logOuticon from "/assets/logOutIcon.png";
import cspfpicon from "/assets/cspfpicon.png";



const Topbar = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showModal, setShowModal] = useState(false);
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  const { isAdmin } = useContext(AuthContext);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sidebarRef.current &&
        (event.target instanceof Node && !sidebarRef.current.contains(event.target))
      ) {
        setSidebarOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      alert("Error logging out");
      console.error(error);
    }
  };

  // Updates search input value
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  // Triggers search only when Enter is pressed
  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchInput.trim()) {
      e.preventDefault();
      navigate(`/search?query=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  useEffect(() => {
    if (!userId) return;
  
    // Fetch and listen for notifications
    const unsubscribeNotif = fetchNotifications(userId, (fetchedNotifications) => {
      setNotifications(fetchedNotifications);
      setHasUnread(fetchedNotifications.some(notif => !notif.isRead));
    });
  
    // Message listener
    const handleNewMessage = (chatId: string, message: ValidMessage) => {
      if (message.senderId === userId) return;
      
      createNotification(
        userId, `${message.senderName} sent a message`, 
        undefined, "message", chatId)
        .then(() => console.log("Notification created"))
        .catch(console.error);
    };
  
    const unsubscribeMessages = watchNewMessagesForUser(userId, handleNewMessage);
  
    return () => {
      unsubscribeNotif();
      unsubscribeMessages();
    };
  }, [userId]);
  
  const handleNotificationClick = async (notif: AppNotification) => {
    if (!userId) return;
    console.log("🔔 Notification clicked:", notif);
  
    try {
      // Always mark as read first for every type
      await markNotificationAsRead(userId, notif.id);
      setNotifications(prev => 
        prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
      );
  
      if (notif.type === "message" && notif.chatId) {
        console.log(`➡️ Navigating to chatroom with ID: ${notif.chatId}`);
        navigate(`/inquiries/${notif.chatId}`);
        return; // return early so no more code runs
      }
  
      if (notif.contextId) {
        const itemDetails = await fetchItemDetails(notif.contextId);
        if (itemDetails) {
          console.log("✅ Item details fetched:", itemDetails);
          setSelectedItem(itemDetails);
          setShowModal(true);
          console.log("🪟 Modal opened with selected item.");
        } else {
          alert("Item details not found.");
        }
      }
  
      if (notif.reportId) {
        console.log(`Fetching details for report ID: ${notif.reportId}`);
        const itemDetails = await fetchItemDetails(notif.reportId);
        if (!itemDetails) {
          console.error("Item details not found for ID:", notif.reportId);
          alert("The reported item could not be found. It may have been removed.");
          return;
        }
        console.log("Retrieved item details:", itemDetails);
        setSelectedItem(itemDetails);
        setShowModal(true);
      }
  
    } catch (error) {
      console.error("Error handling notification click:", error);
      alert("Failed to process this notification. Please try again.");
    }
  };

  return (
    <div>
      <nav className="navbar ps-lg-4 fixed-top" 
      style={{
        height:"7vw",
        minHeight:'80px',
        backgroundColor:"#fafcff",
        borderBottom:"1.5px solid #dfe8f5"
      
      }}>
        <div className="d-flex justify-content-evenly w-100">
          <div className=" ps-4 align-items-center d-flex">
            <button
              className="btn btn-light me-2"
              id="sidebah"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
             <img src={OptionIcon} 
            style={{
              width: " 2.4vw",
              minWidth:"20px",
              height:  "auto",
              
          }}/>
            </button>
            <img
            className=" bg-transparent d-none d-md-flex"
            src={FLOLOGObg}
            style={{
              width: "6.5vw",
              maxWidth: "282px",
              height: "auto",
              padding:"0px",
              marginBottom: "1rem",
              marginTop: "0.8rem",
            }}
            alt="FLO Logo"
          />
          </div>
          {/* Search Box */}
          <form className="flex-grow-1 ps-md-5 align-items-center justify-content-center d-flex mx-3">
            <input
              type="text"
              placeholder="Search..."
              className="form-control ms-md-5"
              value={searchInput}
              onChange={handleSearchChange}
              onKeyDown={handleSearchSubmit} // Listens for Enter k
              style={{
                borderRadius:" 38px",
                height:"32px",
                width:"25.45vw",
                border: "0.5px solid #89ccff",
                backgroundColor:"#fafcff",
                
              }}
            />
          </form>
          <div className="d-flex me-4 gap-5 position-relative align-items-center pe-3">
            <div className="dropdown position-relative">
              <a className="position-relative" data-bs-toggle="dropdown" style={{ cursor: "pointer" }}>
                <img src={NotifIcon} alt="Notifications" style={{ width: "30px", height: "30px" }} />
                {hasUnread && (
                  <span className="position-absolute top-0 start-100 translate-middle p-2 bg-danger border border-light rounded-circle"></span>
                )}
              </a>

              <ul
                className="notif-box dropdown-menu dropdown-menu-end px-2 py-3 shadow-lg rounded-3"
                style={{
                  width: "270px",
                  maxHeight: "300px",
                  overflowY: "auto",
                  backgroundColor: "#fafcff",
                  border: "1px solid #ddd",
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontFamily: "Poppins, sans-serif",
                  
                }}
              >

                <li className="dropdown-header fw-bold border-bottom fs-5" style={{ color: "#0e5cc5"}}>Notifications</li>
                {notifications.length === 0 ? (
                  <li className="dropdown-item text-center">No new notifications</li>
                ) : (
                  notifications.map((notif) => (
                    <li 
                      key={notif.id} 
                      className={`dropdown-item fs-6 mb-1 ${notif.isRead ? "" : "fw-bold"}`} 
                      onClick={() => handleNotificationClick(notif)} 
                      style={{
                        cursor: "pointer",
                        padding: "12px",
                        transition: "background 0.2s ease-in-out",
                        wordBreak: "break-word",
                        whiteSpace: "normal",
                        overflowWrap: "break-word",
                        display: "block",
                        backgroundColor: notif.isRead ? "#fafcff" : "#f1f7ff",
                        marginBottom:'5px',
                        
                        
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#2169ac";
                        e.currentTarget.style.color = "#fff";

                        
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = notif.isRead ? "#fafcff" : "#f1f7ff";
                        e.currentTarget.style.color = notif.isRead ? "#6c757d" : "#000";
                      }}
                    > 
                      <span className="custom-color" style={{
                        fontSize:'13px'
                      }}>{notif.description}</span>
                      {!notif.isRead && (
                        <span className="badge bg-danger text-white ms-2" style={{ fontSize: "10px" }}>New</span>
                      )}

                    </li>
                  ))
                )}
              </ul>
          </div>

            {/* Profile Icon */}
            <NavLink
            to="/profile"
            >
              <img src={NotifPfpIcon}  className=""
                style={{
                  width: "clamp(24px, 2.6vw, 50px)", 
                  height: "auto",
                  minWidth: "24px",
                }} 
                />
            </NavLink>
          </div>
        </div>
        
      </nav>

      <ItemPreviewModal
          show={showModal}
          onClose={() => setShowModal(false)}
          item={selectedItem}
      />

      {/* SIDEBAR */}
      <div
        ref={sidebarRef}
        className={`custom-sidebar offcanvas offcanvas-start ${sidebarOpen ? "show" : ""}`}
        style={{
          width: "14.4vw",
          visibility: sidebarOpen ? "visible" : "hidden",
          backgroundColor:"#f1f7ff",
        }}
      >
        <div className="offcanvas-header text-white justify-content-start d-flex flex-row py-5">
        <button         
            type="button"
            className="btn align-self-center ps-lg-4 ps-0"
            onClick={() => setSidebarOpen(false)}
          > <img src={OptionIcon} 
          style={{
             width: " 2.4vw",
             minWidth:"20px",
             height:  "auto",
             

          }}/></button>
       
         
        </div>

        <div className="offcanvas-body p-0  d-flex flex-column h-100" 
          style={{
            overflow:"hidden"
          }}>
  <ul className="nav flex-column py-4 mb-lg-3 justify-content-center align-items-center w-100">
    {isAdmin ? (
      <>
        <li className="nav-item text-center w-100">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active py-4" : "py-4"}`
            }
            onClick={() => setSidebarOpen(false)}
            style={({ isActive }) => ({
              fontFamily: "Poppins, sans-serif",
              fontSize: "14.6px",
              color: "#0E5CC5",
              backgroundColor: isActive ? "#abdbff" : "transparent",
              marginLeft: isActive ? "0px" : "0px",
            })}
          >
            <img
              className=""
              src={HomeIcon}
              style={{
                width: "21.8px",
                height: "20.3px",
                marginRight: "10px",
                marginBottom: "5px",
              }}
            />
            <span className="d-none d-md-inline pe-2">Home</span>
          </NavLink>
        </li>
        <li className="nav-item text-center w-100">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active py-4" : "py-4"}`
            }
            onClick={() => setSidebarOpen(false)}
            style={({ isActive }) => ({
              fontFamily: "Poppins, sans-serif",
              fontSize: "14.6px",
              color: "#0E5CC5",
              backgroundColor: isActive ? "#abdbff" : "transparent",
              marginLeft: isActive ? "0px" : "0px",
            })}
          >
            <img
              className=""
              src={DashboardIcon}
              style={{
                width: "21.8px",
                height: "20.3px",
                marginRight: "10px",
                marginBottom: "5px",
              }}
            />
            <span className="d-none d-md-inline pe-2">Dashboard</span>
          </NavLink>
        </li>
        <li className="nav-item text-center w-100">
          <NavLink
            to="/report"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active py-4" : "py-4"}`
            }
            onClick={() => setSidebarOpen(false)}
            style={({ isActive }) => ({
              fontFamily: "Poppins, sans-serif",
              fontSize: "14.6px",
              color: "#0E5CC5",
              backgroundColor: isActive ? "#abdbff" : "transparent",
              marginLeft: isActive ? "0px" : "0px",
            })}
          >
            <img
              className=""
              src={ReportIcon}
              style={{
                width: "21.8px",
                height: "20.3px",
                marginRight: "10px",
                marginBottom: "5px",
              }}
            />
            <span className="d-none d-md-inline pe-2">Report</span>
          </NavLink>
        </li>
        <li className="nav-item text-center w-100">
          <NavLink
            to="/item-history"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active py-4" : "py-4"}`
            }
            onClick={() => setSidebarOpen(false)}
            style={({ isActive }) => ({
              fontFamily: "Poppins, sans-serif",
              fontSize: "14.6px",
              color: "#0E5CC5",
              backgroundColor: isActive ? "#abdbff" : "transparent",
              marginLeft: isActive ? "0px" : "0px",
            })}
          >
            <img
              className=""
              src={HistoryIcon}
              style={{
                width: "21.8px",
                height: "20.3px",
                marginRight: "10px",
                marginBottom: "5px",
              }}
            />
            <span className="d-none d-md-inline pe-2">History</span>
          </NavLink>
        </li>
        <li className="nav-item text-center w-100">
          <NavLink
            to="/inquiries"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active py-4" : "py-4"}`
            }
            onClick={() => setSidebarOpen(false)}
            style={({ isActive }) => ({
              fontFamily: "Poppins, sans-serif",
              fontSize: "14.6px",
              color: "#0E5CC5",
              backgroundColor: isActive ? "#abdbff" : "transparent",
              marginLeft: isActive ? "0px" : "0px",
            })}
          >
            <img
              className=""
              src={IIcon}
              style={{
                width: "21.8px",
                height: "21.8px",
                marginRight: "10px",
                marginBottom: "5px",
              }}
            />
            <span className="d-none d-md-inline pe-2">Inquiries</span>
          </NavLink>
        </li>
        <li className="nav-item text-center w-100">
          <NavLink
            to="/userlist"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active py-4" : "py-4"}`
            }
            onClick={() => setSidebarOpen(false)}
            style={({ isActive }) => ({
              fontFamily: "Poppins, sans-serif",
              fontSize: "14.6px",
              color: "#0E5CC5",
              backgroundColor: isActive ? "#abdbff" : "transparent",
              marginLeft: isActive ? "0px" : "0px",
            })}
          >
            <img
              className=""
              src={cspfpicon}
              style={{
                width: "21.8px",
                height: "20.3px",
                marginRight: "10px",
                marginBottom: "5px",
              }}
            />
            <span className="d-none d-md-inline pe-2">User List</span>
          </NavLink>
        </li>
      </>
    ) : (
      <>
        <li className="nav-item text-center w-100">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active py-4" : " py-4"}`
            }
            onClick={() => setSidebarOpen(false)}
            style={({ isActive }) => ({
              fontFamily: "Poppins, sans-serif",
              fontSize: "14.6px",
              color: "#0E5CC5",
              backgroundColor: isActive ? "#abdbff" : "transparent",
            })}
          >
            <img
              className=""
              src={HomeIcon}
              style={{
                width: "21.8px",
                height: "20.3px",
                marginRight: "10px",
                marginBottom: "5px",
              }}
            />
            <span className="d-none d-md-inline pe-2">Home</span>
          </NavLink>
        </li>
        <li className="nav-item text-center w-100">
          <NavLink
            to="/report"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active py-4" : "py-4"}`
            }
            onClick={() => setSidebarOpen(false)}
            style={({ isActive }) => ({
              fontFamily: "Poppins, sans-serif",
              fontSize: "14.6px",
              color: "#0E5CC5",
              backgroundColor: isActive ? "#abdbff" : "transparent",
              marginLeft: isActive ? "0px" : "0px",
            })}
          >
            <img
              className=""
              src={ReportIcon}
              style={{
                width: "21.8px",
                height: "20.3px",
                marginRight: "10px",
                marginBottom: "5px",
              }}
            />
            <span className="d-none d-md-inline pe-2">Report</span>
          </NavLink>
        </li>
        <li className="nav-item text-center w-100">
          <NavLink
            to="/item-history"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active py-4" : "py-4"}`
            }
            onClick={() => setSidebarOpen(false)}
            style={({ isActive }) => ({
              fontFamily: "Poppins, sans-serif",
              fontSize: "14.6px",
              color: "#0E5CC5",
              backgroundColor: isActive ? "#abdbff" : "transparent",
              marginLeft: isActive ? "0px" : "0px",
            })}
          >
            <img
              className=""
              src={HistoryIcon}
              style={{
                width: "21.8px",
                height: "20.3px",
                marginRight: "10px",
                marginBottom: "5px",
              }}
            />
            <span className="d-none d-md-inline pe-2">History</span>
          </NavLink>
        </li>
        <li className="nav-item text-center w-100">
          <NavLink
            to="/inquiries"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active py-4" : "py-4"}`
            }
            onClick={() => setSidebarOpen(false)}
            style={({ isActive }) => ({
              fontFamily: "Poppins, sans-serif",
              fontSize: "14.6px",
              color: "#0E5CC5",
              backgroundColor: isActive ? "#abdbff" : "transparent",
              marginLeft: isActive ? "0px" : "0px",
            })}
          >
            <img
              className=""
              src={IIcon}
              style={{
                width: "21.8px",
                height: "21.8px",
                marginRight: "10px",
                marginBottom: "5px",
              }}
            />
            <span className="d-none d-md-inline pe-2">Inquiries</span>
          </NavLink>
        </li>
      </>
    )}
  </ul>

  

  {/* LOGOUT DIV WITH BORDER-TOP */}
    <div
    className="mt-auto m-lg-2 pt-3"
    style={{
      borderTop: isAdmin ? "0.5px solid #004097" : "none",
    }}
  >
    <button
      onClick={handleLogout}
      className="btn text-start w-100"
      style={{
        color: "#3998ff",
        fontFamily: "Work Sans, sans-serif",
        fontSize: "14.2px",
        opacity: "68%",
      }}
    >
      <img
        src={logOuticon}
        style={{
          width: "21.8px",
          height: "21.8px",
          marginRight: "10px",
          marginBottom: "5px",
        }}
      />
      <span className="d-none d-md-inline">Logout</span>
    </button>
  </div>
  </div>

      </div>
    </div>
  );
};


export default Topbar;
