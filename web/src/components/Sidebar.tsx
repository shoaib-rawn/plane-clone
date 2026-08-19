import { NavLink, useNavigate } from "react-router-dom";
import {
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Settings,
  Ticket,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import { logout } from "../store/slices/authSlice";
import type { RootState } from "../store/store";
import "../styling/layout/Sidebar.css";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

const primaryNavigation: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/my-tickets", label: "My Tickets", icon: Ticket },
];

const workspaceNavigation: NavItem[] = [
  { to: "/members", label: "Members", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
];

const Sidebar = () => {
  const userName = useSelector((state: RootState) => state.auth.userName);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  const renderNavItems = (items: NavItem[]) =>
    items.map(({ to, label, icon: Icon }) => (
      <NavLink key={to} to={to}>
        <Icon size={18} />
        {label}
      </NavLink>
    ));

  const displayName = userName ? userName.toUpperCase() : "USER";

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>MiniPlane</h2>
      </div>

      <nav className="sidebar-nav">
        {renderNavItems(primaryNavigation)}

        <div className="sidebar-section-title">WORKSPACE</div>

        {renderNavItems(workspaceNavigation)}
      </nav>

      <div className="sidebar-bottom">
        <NavLink to="/profile">
          <User size={18} />
          {displayName}
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
