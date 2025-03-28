import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/Layout";
import Signup from "../components/signup";
import Login from "../components/login";
import ResetPassword from "../components/resetpassword";
import VerifyEmail from "../components/veifyemail";
import EmailVerified from "../components/emailverified";
import CompleteRegistration from "../components/CompleteRegistration";
import Home from "../pages/home";
import AdminHome from "../pages/adminhome";
import Report from "../pages/report";
import UserList from "../pages/userlist";
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

function App() {
  const { currentUser, loading } = useContext(AuthContext);

  const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    if (loading) return <div>Loading...</div>; // spinner here if you want
    if (!currentUser) return <Navigate to="/login" />;
    return <>{children}</>;
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Signup />} />
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
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Admin-only Routes */}
        <Route path="/admin-home" element={<AdminHome />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/userlist" element={<UserList />} />
      </Routes>
    </Router>
  );
}

export default App;
