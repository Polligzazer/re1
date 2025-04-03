import '../css/Layout.css'
import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";
import Chatbot from "./Chatbot.tsx";


const Layout = () => {

  return (
    <main className="mt-5">
      <Topbar />
      <div className="container pt-5 justify-content-center align-items-center">
        <Outlet />
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
        <Chatbot/>
      </div>
      </div>
    </main>
  );
};

export default Layout;
