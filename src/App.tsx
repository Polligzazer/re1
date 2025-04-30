import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { setupAndSaveFCMToken, migrateLegacyTokens, requestNotificationPermission, onMessageListener  } from "./firebase";
import { toast } from "react-toastify";
import { watchNewMessagesForUser } from "../components/notificationService";
import { initForegroundNotifications } from "./types/notifications";
// import { SpeedInsights } from '@vercel/speed-insights/react';
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
import ClaimApproval from "../pages/dashcomps/PendingClaimPage";
import ReportApproval from "../pages/dashcomps/AdminApproval";
import Claimed from "../pages/dashcomps/ClaimsPage";
import Hero from "../pages/heropage.tsx";

import { registerServiceWorker } from "./types/serviceWorker";


function App() {
  const { currentUser, loading } = useContext(AuthContext);

  const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    if (loading) return <Loading />;
    if (!currentUser) return <Navigate to="/login" />;
    return <>{children}</>;
  };

  useEffect(() => {
    onMessageListener()
      .then((payload) => {
        const title = payload?.notification?.title || payload?.data?.title;
        const body = payload?.notification?.body || payload?.data?.body;
  
        toast.info(`${title}: ${body}`);
      })
      .catch(err => console.log('Failed to receive message: ', err));
  }, []);

  useEffect(() => {
    registerServiceWorker()
      .then((reg) => {
        console.log("✅ Service Worker registered:", reg);

        // Handle foreground FCM messages via the SDK
        initForegroundNotifications();

        // Ask permission & save token
        return requestNotificationPermission();
      })
      .then((token) => {
        console.log("🔔 Notification permission granted, token:", token);
      })
      .catch((err) => {
        console.error("⚠️ FCM setup error:", err);
      });
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    setupAndSaveFCMToken(currentUser.uid)
      .then(() => migrateLegacyTokens(currentUser.uid))
      .catch((err) => {
        console.error("⚠️ Token migration error:", err);
      });

    const unsubscribe = watchNewMessagesForUser(
      currentUser.uid,
      (chatId, message) => {
        // your in-app toast logic here
        console.log(`New message in ${chatId}:`, message.text);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser]);
  
  return (
    <Router>
      <Routes>
        <Route path ="/" element={<Hero/>}/>
        {/* Public Routes */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/email-verified" element={<EmailVerified />} />
        <Route path="/complete-registration" element={<CompleteRegistration />} />
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
          <Route path="/inquiries/:chatId" element={<Inquiries/>} />
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

