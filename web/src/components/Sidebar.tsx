import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  LayoutGrid,
  ListTodo,
  LogOut,
  SlidersHorizontal,
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
};

const primaryNavigation: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/projects", label: "Projects", icon: Layers },
  { to: "/my-tickets", label: "My Tickets", icon: ListTodo },
];

const workspaceNavigation: NavItem[] = [
  { to: "/members", label: "Members", icon: Users2 },
  { to: "/settings", label: "Settings", icon: SlidersHorizontal },
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
    items.map(({ to, label, icon: Icon }) => (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) =>
          `sidebar-nav-item ${isActive ? "active" : ""}`
        }
        title={isCollapsed ? label : undefined}
      >
        <Icon className="nav-icon" size={18} />
        {!isCollapsed && <span className="nav-label">{label}</span>}
      </NavLink>
    ));

  const displayName = userName ? userName.toUpperCase() : "USER";

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          {isCollapsed ? (
            <span className="logo-short">PL</span>
          ) : (
            <h2>Planora</h2>
          )}
        </div>

        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={toggleSidebar}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {renderNavItems(primaryNavigation)}

        {isCollapsed ? (
          <div className="sidebar-divider" />
        ) : (
          <div className="sidebar-section-title">WORKSPACE</div>
        )}

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
          <CircleUserRound className="nav-icon" size={18} />
          {!isCollapsed && <span className="nav-label">{displayName}</span>}
        </NavLink>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="nav-icon" size={18} />
          {!isCollapsed && <span className="nav-label">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
