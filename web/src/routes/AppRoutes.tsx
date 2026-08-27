import { Navigate, useRoutes } from "react-router-dom";

import PublicRoute from "./PublicRoute";
import PrivateRoute from "./PrivateRoute";

import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import Dashboard from "../pages/Dashboard";
import ProjectsPage from "../pages/ProjectsPage";
import MembersPage from "../pages/MembersPage";
import MyTicketsPage from "../pages/MyTicketsPage";
import ProfilePage from "../pages/ProfilePage";

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

    {
      path: "/forgot-password",
      element: (
        <PublicRoute>
          <ForgotPasswordPage />
        </PublicRoute>
      ),
    },

    {
      path: "/reset-password",
      element: (
        <PublicRoute>
          <ResetPasswordPage />
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
            {
              path: "/projects",
              element: <ProjectsPage />,
            },
            {
              path: "/members",
              element: <MembersPage />,
            },
            {
              path: "/my-tickets",
              element: <MyTicketsPage />,
            },
            {
              path: "/settings",
              element: <ProfilePage />,
            },
            {
              path: "/profile",
              element: <ProfilePage />,
            },
          ],
        },
      ],
    },
  ];

  return useRoutes(routes);
};

export default AppRoutes;
