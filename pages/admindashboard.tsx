import { useState, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../src/firebase";
import Analytics from "../components/Analytics";
import ClaimPage from "./dashcomps/ClaimsPage";
import PendingClaimPage from "./dashcomps/PendingClaimPage";
import AdminApproval from "./dashcomps/AdminApproval";
import Topbar from "../components/Topbar";

const DashboardHome = () => {
  const [pendingReports, setPendingReports] = useState(0);
  const [pendingClaims, setPendingClaims] = useState(0);
  const [claimedItems, setClaimedItems] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Pending Reports
        const pendingQuery = query(
          collection(db, "lost_items"),
          where("status", "==", "pendingreport")
        );
        const pendingSnapshot = await getDocs(pendingQuery);
        setPendingReports(pendingSnapshot.size);

        const pendingQuery1 = query(
          collection(db, "claim_items"),
          where("status", "==", "claimed")
        );
        const pendingSnapshot1 = await getDocs(pendingQuery1);
        setPendingClaims(pendingSnapshot1.size);

        // Claimed Items
        const claimedQuery = query(
          collection(db, "claim_items "),
          where("status", "==", "pendingclaim")
        );
        const claimedSnapshot = await getDocs(claimedQuery);
        setClaimedItems(claimedSnapshot.size);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container mt-5 pt-5">
      <Topbar />
      <h1 className="text-center mt-5 mb-4">Admin Dashboard</h1>
      <div className="row justify-content-between my-4">
        <Link to="reportapproval" className="col-md-3 bg-primary text-white text-center p-3 mx-2">
          <h3>Pending Reports</h3>
          <h2>{pendingReports}</h2>
        </Link>

        <Link to="claimapproval" className="col-md-3 bg-warning text-dark text-center p-3 mx-2">
          <h3>Pending Claims</h3>
          <h2>{pendingClaims}</h2>
        </Link>

        <Link to="claimedItems" className="col-md-3 bg-success text-white text-center p-3 mx-2">
          <h3>Claimed Items</h3>
          <h2>{claimedItems}</h2>
        </Link>
      </div>


      <Analytics />

    </div>
  );
};

const Dashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardHome />} />
      <Route path="reportapproval" element={<AdminApproval />}/>
      <Route path="claimapproval" element={<PendingClaimPage />} />
      <Route path="claimedItems" element={<ClaimPage />} />
    </Routes>
  );
};
export default Dashboard;
