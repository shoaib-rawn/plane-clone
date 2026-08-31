import { lazy, Suspense } from "react";
import { Navigate, useRoutes } from "react-router-dom";

import PublicRoute from "./PublicRoute";
import PrivateRoute from "./PrivateRoute";
import AppLayout from "../components/AppLayout";

// Route-based Code Splitting with React.lazy
const LoginPage = lazy(() => import("../pages/LoginPage"));
const RegisterPage = lazy(() => import("../pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("../pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("../pages/ResetPasswordPage"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const ProjectsPage = lazy(() => import("../pages/ProjectsPage"));
const MembersPage = lazy(() => import("../pages/MembersPage"));
const MyTicketsPage = lazy(() => import("../pages/MyTicketsPage"));
const SettingsPage = lazy(() => import("../pages/SettingsPage"));
const ProfilePage = lazy(() => import("../pages/ProfilePage"));
const ProjectTicketsPage = lazy(() => import("../pages/ProjectTicketsPage"));

const RouteFallback = () => (
  <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ width: 32, height: 32, border: "3px solid #E2E8F0", borderTopColor: "#8B5CF6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></div>
  </div>
);

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
          <Suspense fallback={<RouteFallback />}>
            <LoginPage />
          </Suspense>
        </PublicRoute>
      ),
    },

    {
      path: "/register",
      element: (
        <PublicRoute>
          <Suspense fallback={<RouteFallback />}>
            <RegisterPage />
          </Suspense>
        </PublicRoute>
      ),
    },

    {
      path: "/forgot-password",
      element: (
        <PublicRoute>
          <Suspense fallback={<RouteFallback />}>
            <ForgotPasswordPage />
          </Suspense>
        </PublicRoute>
      ),
    },

    {
      path: "/reset-password",
      element: (
        <PublicRoute>
          <Suspense fallback={<RouteFallback />}>
            <ResetPasswordPage />
          </Suspense>
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
              element: (
                <Suspense fallback={<RouteFallback />}>
                  <Dashboard />
                </Suspense>
              ),
            },
            {
              path: "/projects",
              element: (
                <Suspense fallback={<RouteFallback />}>
                  <ProjectsPage />
                </Suspense>
              ),
            },
            {
              path: "/projects/:projectId/tickets",
              element: (
                <Suspense fallback={<RouteFallback />}>
                  <ProjectTicketsPage />
                </Suspense>
              ),
            },
            {
              path: "/members",
              element: (
                <Suspense fallback={<RouteFallback />}>
                  <MembersPage />
                </Suspense>
              ),
            },
            {
              path: "/my-tickets",
              element: (
                <Suspense fallback={<RouteFallback />}>
                  <MyTicketsPage />
                </Suspense>
              ),
            },
            {
              path: "/settings",
              element: (
                <Suspense fallback={<RouteFallback />}>
                  <SettingsPage />
                </Suspense>
              ),
            },
            {
              path: "/profile",
              element: (
                <Suspense fallback={<RouteFallback />}>
                  <ProfilePage />
                </Suspense>
              ),
            },
          ],
        },
      ],
    },
  ];

  return useRoutes(routes);
};

export default AppRoutes;
