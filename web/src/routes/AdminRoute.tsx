import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth";

/**
 * AdminRoute: Restricts access to workspace ADMINs only.
 * Redirects non-admin members or unauthenticated visitors to /dashboard or /login.
 */
interface AdminRouteProps {
  children?: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, workspaceRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: "3px solid #E2E8F0",
            borderTopColor: "#8B5CF6",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (workspaceRole !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default AdminRoute;
