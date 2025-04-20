import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { requestNotificationPermission, setupForegroundNotifications, auth, saveFCMToken  } from "./firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { SpeedInsights } from '@vercel/speed-insights/react';
import Layout from "../components/Layout";
import Signup from "../components/signup";
import Login from "../components/login";
import ResetPassword from "../components/resetpassword";
import VerifyEmail from "../components/veifyemail";
import EmailVerified from "../components/emailverified";
import CompleteRegistration from "../components/completeregistration";
import Home from "../pages/home";
import Report from "../pages/report";
import UserList from "../pages/UserList";
import Dashboard from "../pages/admindashboard";
import ItemHistory from "../pages/ItemHistory";
import Inquiries from "../pages/inquires";
import SearchBar from "../components/Searchbar";
import Lost from "../pages/reportcomp/reports/Lost";
import Found from "../pages/reportcomp/reports/Found";
import { AuthContext } from "../components/Authcontext";
import { ReactNode, useContext } from "react";
import Loading from "../components/Loading";
import Profile from "../pages/profile";
import Aboutus from "../pages/aboutUs";
import ClaimApproval from "../pages/dashcomps/PendingClaimPage"
import ReportApproval from "../pages/dashcomps/AdminApproval";
import Claimed from "../pages/dashcomps/ClaimsPage"


function App() {
  const { currentUser, loading } = useContext(AuthContext);

  const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    if (loading) return <Loading />;
    if (!currentUser) return <Navigate to="/login" />;
    return <>{children}</>;
  };

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("User logged in:", user.uid);
  
      const token = await requestNotificationPermission();
      if (token) {
        await saveFCMToken(user.uid, token);
      }
    }
  });

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration) => {
          console.log("✅ Service Worker registered:", registration);
        })
        .catch((error) => {
          console.error("❌ Service Worker registration failed:", error);
        });
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      requestNotificationPermission();
      setupForegroundNotifications();
    }
  }, [currentUser]);

  
  return (
    
    <Router>
      <SpeedInsights />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/email-verified" element={<EmailVerified />} />
        <Route path="/complete-registration" element={<CompleteRegistration />} />
        <Route path="/aboutus" element= {<Aboutus />}/>
        <Route path="/testload" element={<Loading />} />

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/home" element={<Home />} />
          <Route path="/search" element={<SearchBar />} />
          <Route path="/report" element={<Report />} />
          <Route path="/report/lost" element={<Lost />} />
          <Route path="/report/found" element={<Found />} />
          <Route path="/item-history" element={<ItemHistory />} />
          <Route path="/inquiries" element={<Inquiries />} />
          <Route path="/profile" element={<Profile />} />

          {/* Admin */}

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/userlist" element={<UserList />} />
          <Route path="/dashboard/claim-approval" element={<ClaimApproval />} />
          <Route path="/dashboard/report-approval" element={<ReportApproval />} />
          <Route path="/dashboard/claimed" element={<Claimed />} />
        </Route>

        {/* Admin-only Routes */}
      </Routes>
    </Router>
  );
}

export default App;
