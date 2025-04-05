import '../css/Layout.css'
import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";
//import Notifbutton from "../pages/SendNotificationButton";
// diko alam kung pano mag comment below   <Notifbutton />


const Layout = () => {

  return (
    <main className="mt-5">
      <Topbar />
      <div className="container pt-5 justify-content-center align-items-center">
        <Outlet />
        

      </div>
    </main>
  );
};

export default Layout;
