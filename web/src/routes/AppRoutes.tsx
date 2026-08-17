import { Navigate, useRoutes } from "react-router-dom";

import PublicRoute from "./PublicRoute";
import PrivateRoute from "./PrivateRoute";

import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import Dashboard from "../pages/Dashboard";

import AppLayout from "../components/AppLayout";

const AppRoutes = () => {
  const routes = [
    {
      path: "/",
      element: <Navigate to="/login" replace />,
    },

    // Public Routes
    {
      path: "/login",
      element: (
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      ),
    },

    {
      path: "/register",
      element: (
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      ),
    },

    // Private Routes
    {
      element: <PrivateRoute />,
      children: [
        {
          element: <AppLayout />,
          children: [
            {
              path: "/dashboard",
              element: <Dashboard />,
            },
          ],
        },
      ],
    },
  ];

  return useRoutes(routes);
};

export default AppRoutes;
