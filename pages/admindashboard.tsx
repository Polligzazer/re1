import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../src/firebase";
import Analytics from "../components/Analytics";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ItemHotspots from "../components/ItemHotspots";
import { faCircleCheck, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import "../css/dashboard.css";

const Dashboard = () => {
  const [pendingReports, setPendingReports] = useState(0);
  const [pendingClaims, setPendingClaims] = useState(0);
  const [claimedItems, setClaimedItems] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pendingQuery = query(
          collection(db, "lost_items"),
          where("status", "==", "pendingreport")
        );
        const pendingSnapshot = await getDocs(pendingQuery);
        setPendingReports(pendingSnapshot.size);

        const pendingClaim = query(
          collection(db, "claim_items"),
          where("status", "==", "pendingclaim")
        );
        const pendingSnapshot1 = await getDocs(pendingClaim);
        setPendingClaims(pendingSnapshot1.size);

        const claimedQuery = query(
          collection(db, "claim_items"),
          where("status", "==", "claimed")
        );
        const claimedSnapshot = await getDocs(claimedQuery);
        setClaimedItems(claimedSnapshot.size);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, [setPendingReports, setPendingClaims, setClaimedItems]);

  return (
    <div className="container mt-5 pb-5 pt-2">
      <div className=" title-trans d-flex flex-column mb-3 ">
        <h2 className="text-start fw-bold mt-5"
          style={{
            color:'#212020',
            fontFamily: "DM Sans, sans-serif", 
             
          }}
        >Dashboard</h2>
        <p className="" style={{color:'#454545',  fontFamily:"Poppins, sans-serif"}}><small>Welcome <span style={{color:'#0e5cc5'}}>Admin,</span> here’s an overview about the items</small></p>
      </div>
      <div className="row justify-content-evenly gap-5 mt-4 mb-5">
        <Link to="report-approval" className="box-trans col-md-3 text-center p-0 m-0"
          style={{
            textDecoration:'none',
            border:'1px solid #bfbdbc',
            borderRadius:'10px 10px 0 0',
            backgroundColor:'#f1f7ff'
          }}
        >
          <div className="d-flex p-3 flex-column" style={{
            backgroundColor:'#f1f7ff',
            borderRadius:'10px 10px 0 0',
          }}>
            <div className="d-flex flex-row justify-content-between align-items-center px-4">
              <p className="mt-3 m-0 mb-1" style={{
                fontFamily: "DM Sans, sans-serif", 
                fontSize:'30px',
                color:'#0e5cc5',
                padding:'0'
                
              }}>{pendingReports}</p>
              <FontAwesomeIcon 
                icon={faExclamationTriangle}
                style={{
                  position:'relative',
                  color:'#e86b70',
                  fontSize:'34px',
                  top:'-5px'
                }}/>
            </div>
            <h3 className="px-4 text-start" style={{
              color:'#636363',
              fontFamily:"Poppins, sans-serif",
              fontSize:'17.6px'
            }}>Pending Reports</h3>
          </div>
          <p className="p-3 px-4 m-0 text-start" style={{
            backgroundColor:'#e9eef7',
            border:'1px solid #bfbdbc',
            fontFamily: "Work, sans-serif",
            color:'#2169ac',
            fontWeight:'bold',
            fontSize:'12.6px'

          }}>View all request</p>
        </Link>

        <Link to="claim-approval" className=" box-trans2 col-md-3 text-center p-0 m-0"
          style={{
            textDecoration:'none',
            border:'1px solid #bfbdbc',
            borderRadius:'10px 10px 0 0',
            backgroundColor:'#f1f7ff'
          }}
        >
          <div className="d-flex p-3 flex-column" style={{
            backgroundColor:'#f1f7ff',
            borderRadius:'10px 10px 0 0',
          }}>
            <div className="d-flex flex-row justify-content-between align-items-center px-4">
              <p className="mt-3 m-0 mb-1" style={{
                fontFamily: "DM Sans, sans-serif", 
                fontSize:'30px',
                color:'#0e5cc5',
                padding:'0'
                
              }}>{pendingClaims}</p>
              <FontAwesomeIcon 
                icon={faExclamationTriangle}
                style={{
                  position:'relative',
                  color:'#e86b70',
                  fontSize:'34px',
                  top:'-5px'
                }}/>
            </div>
            <h3 className="px-4 text-start" style={{
              color:'#636363',
              fontFamily:"Poppins, sans-serif",
              fontSize:'17.6px'
            }}>Pending Claim</h3>
          </div>
          <p className="p-3 px-4 m-0 text-start" style={{
            backgroundColor:'#e9eef7',
            border:'1px solid #bfbdbc',
            fontFamily: "Work, sans-serif",
            color:'#2169ac',
            fontWeight:'bold',
            fontSize:'12.6px'

          }}>View all request</p>
        </Link>

        <Link to="/item-history" className=" box-trans3 col-md-3 text-center p-0 m-0"
          style={{
            textDecoration:'none',
            border:'1px solid #bfbdbc',
            borderRadius:'10px 10px 0 0',
            backgroundColor:'#f1f7ff'
          }}
        >
          <div className="d-flex p-3 flex-column" style={{
            backgroundColor:'#f1f7ff',
            borderRadius:'10px 10px 0 0',
          }}>
            <div className="d-flex flex-row justify-content-between align-items-center px-4">
              <p className="mt-3 m-0 mb-1" style={{
                fontFamily: "DM Sans, sans-serif", 
                fontSize:'30px',
                color:'#0e5cc5',
                padding:'0'
                
              }}>{claimedItems}</p>
              <FontAwesomeIcon 
                icon={faCircleCheck}
                style={{
                  position:'relative',
                  color:'#67d753',
                  fontSize:'34px',
                  top:'-5px'
                }}/>
            </div>
            <h3 className="px-4 text-start" style={{
              color:'#636363',
              fontFamily:"Poppins, sans-serif",
              fontSize:'17.6px'
            }}>Success claims</h3>
          </div>
          <p className="p-3 px-4 m-0 text-start" style={{
            backgroundColor:'#e9eef7',
            border:'1px solid #bfbdbc',
            fontFamily: "Work, sans-serif",
            color:'#2169ac',
            fontWeight:'bold',
            fontSize:'12.6px'

          }}>View all items</p>
        </Link>
      </div>


      <Analytics />
      <ItemHotspots />
    </div>
  );
};

export default Dashboard;
