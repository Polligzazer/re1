import '../css/Layout.css'
import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";


const Layout = () => {

  return (
    <main className="py-5 container">
      <Topbar />
      <div className="container pt-5 justify-content-center align-items-center">
        <Outlet />
      </div>
    </main>
  );
};

export default Layout;
