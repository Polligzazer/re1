import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { messaging, auth } from "./firebase";
import { getToken, onMessage } from 'firebase/messaging';
import { onAuthStateChanged, User } from "firebase/auth";
import { toast } from "react-toastify";
import { FCMProvider, saveFCMTokenToUser } from './types/FCMContext';
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

function App() {
  const { currentUser, loading } = useContext(AuthContext);
  const [hasInteracted, setHasInteracted] = useState(false);

  const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    if (loading) return <Loading />;
    if (!currentUser) return <Navigate to="/login" />;
    return <>{children}</>;
  };
  useEffect(() => {
    const enableSound = () => setHasInteracted(true);
    window.addEventListener('click', enableSound);
    window.addEventListener('keydown', enableSound);

    return () => {
      window.removeEventListener('click', enableSound);
      window.removeEventListener('keydown', enableSound);
    };
  }, []);
  useEffect(() => {
    const setupFCM = async (user: User) => {
      try {
        // 1. Register the Service Worker
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('✅ Service Worker registered:', registration);
  
        // 2. Ask notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.error('❌ Notification permission not granted');
          return;
        }
  
        // 3. Get FCM token
        const token = await getToken(messaging, {
          vapidKey: 'BFxv9dfRXQRt-McTvigYKqvpsMbuMdEJTgVqnb7gsql1kljrxNbZmTA_woI4ngYveFGsY5j33IImXJfiYLHBO3w',
          serviceWorkerRegistration: registration,
        });
  
        if (token) {
          console.log('✅ FCM Token:', token);
          await saveFCMTokenToUser(user.uid, token);
          // Save or send token to your backend
        } else {
          console.warn('⚠️ No registration token available.');
        }
  
        // 4. Foreground messages
        onMessage(messaging, (payload) => {
          console.log('📲 Foreground message received:', payload);
          const title = payload?.notification?.title || payload?.data?.title;
          const body = payload?.notification?.body || payload?.data?.body;
          toast.info(`${title}: ${body}`);
        });
  
      } catch (err) {
        console.error('⚠️ Error setting up FCM:', err);
      }
    };
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setupFCM(user);
    });

    return () => unsubscribe();
  }, []);
  return (
  <FCMProvider>
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
  </FCMProvider>
  );
}

export default App;

