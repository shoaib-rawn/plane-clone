import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Ticket,
  Users,
  Settings,
  User,
  LogOut,
} from "lucide-react";

import "../styling/layout/Sidebar.css";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { logout } from "../store/slices/authSlice";

const Sidebar = () => {
  const userName = useSelector((state: RootState) => state.auth.userName);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());

    localStorage.removeItem("token");

    navigate("/login", { replace: true });
  };
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>MiniPlane</h2>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard">
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <NavLink to="/projects">
          <FolderKanban size={18} />
          Projects
        </NavLink>

        <NavLink to="/my-tickets">
          <Ticket size={18} />
          My Tickets
        </NavLink>

        <div className="sidebar-section-title">WORKSPACE</div>

        <NavLink to="/members">
          <Users size={18} />
          Members
        </NavLink>

        <NavLink to="/settings">
          <Settings size={18} />
          Settings
        </NavLink>
      </nav>

      <div className="sidebar-bottom">
        <NavLink to="/profile">
          <User size={18} />
          {userName.toUpperCase()}
        </NavLink>

        <button className="logout-button" onClick={handleLogout}>
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
