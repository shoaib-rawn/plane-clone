import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
// import Navbar from "./Navbar";

import "../styling/layout/AppLayout.css";

const AppLayout = () => {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="app-main">
        {/* <Navbar /> */}

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
