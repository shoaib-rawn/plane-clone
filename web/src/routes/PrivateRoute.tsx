import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

import type { RootState } from "../store/store";

const PrivateRoute = () => {
  const { isAuthenticated, isInitializing } = useSelector(
    (state: RootState) => state.auth,
  );

  if (isInitializing) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
