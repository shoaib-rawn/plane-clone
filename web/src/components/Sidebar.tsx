import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Folder,
  BarChart2,
  Ticket,
  LogOut,
  Settings,
  CircleUserRound,
  Users2,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "../styling/layout/Sidebar.css";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  iconColor: string;
};

const primaryNavigation: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: BarChart2, iconColor: "#34D399" },
  { to: "/projects", label: "Projects", icon: Folder, iconColor: "#FBBF24" },
  { to: "/my-tickets", label: "My Tickets", icon: Ticket, iconColor: "#38BDF8" },
];

const workspaceNavigation: NavItem[] = [
  { to: "/members", label: "Members", icon: Users2, iconColor: "#EC4899" },
  { to: "/settings", label: "Settings", icon: Settings, iconColor: "#FB923C" },
];

const Sidebar = () => {
  const { userName, logout } = useAuth();
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("sidebar_collapsed") === "true";
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const nextState = !prev;
      localStorage.setItem("sidebar_collapsed", String(nextState));
      return nextState;
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const renderNavItems = (items: NavItem[]) =>
    items.map(({ to, label, icon: Icon, iconColor }) => (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) =>
          `sidebar-nav-item ${isActive ? "active" : ""}`
        }
        title={isCollapsed ? label : undefined}
      >
        <Icon className="nav-icon" size={18} style={{ color: iconColor }} />
        <span className="nav-label">{label}</span>
      </NavLink>
    ));

  const displayName = userName ? userName.toUpperCase() : "USER";

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <h2>Planora</h2>
        </div>

        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={toggleSidebar}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft size={18} className="toggle-chevron" />
        </button>
      </div>

      <nav className="sidebar-nav">
        {renderNavItems(primaryNavigation)}

        <div className="sidebar-section-title">WORKSPACE</div>
        <div className="sidebar-divider" />

        {renderNavItems(workspaceNavigation)}
      </nav>

      <div className="sidebar-bottom">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `sidebar-nav-item ${isActive ? "active" : ""}`
          }
          title={isCollapsed ? displayName : undefined}
        >
          <CircleUserRound className="nav-icon" size={18} style={{ color: "#C084FC" }} />
          <span className="nav-label">{displayName}</span>
        </NavLink>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="nav-icon logout-icon" size={18} style={{ color: "#F87171" }} />
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
