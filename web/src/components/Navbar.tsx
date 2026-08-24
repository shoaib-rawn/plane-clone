import { Bell, Search } from "lucide-react";

import "../styling/layout/Navbar.css";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";

const Navbar = () => {
  const userName = useSelector((state: RootState) => state.auth.userName);

  return (
    <header className="navbar">
      <div className="navbar-left">
        <h3>Workspace</h3>
      </div>

      <div className="navbar-search">
        <Search size={18} />
        <input type="text" placeholder="Search..." />
      </div>

      <div className="navbar-right">
        <button className="navbar-icon">
          <Bell size={20} />
        </button>

        <div className="navbar-user">
          <div>
            {userName.toUpperCase()}
            <small>Admin</small>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
