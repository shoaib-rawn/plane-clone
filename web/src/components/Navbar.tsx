import { Bell, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "../styling/layout/Navbar.css";

const Navbar = () => {
  const { userName, workspaceRole } = useAuth();

  const initial = (userName && userName.trim().length > 0 ? userName.trim().charAt(0) : "U").toUpperCase();
  const dbRole = workspaceRole ? workspaceRole.toUpperCase() : "MEMBER";

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
        <button className="navbar-icon" title="Notifications">
          <Bell size={20} />
        </button>

        <div className="navbar-user">
          <div className="navbar-avatar">{initial}</div>
          <div className="navbar-user-info">
            <span className="navbar-user-name">{userName ? userName.toUpperCase() : "USER"}</span>
            <small className={`navbar-user-role role-${dbRole.toLowerCase()}`}>{dbRole}</small>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
