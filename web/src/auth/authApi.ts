import { apiClient } from "../api/client";
import type { WorkspaceRole } from "../types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
}

export const loginUser = (data: LoginPayload) => {
  return apiClient<{ data: { user: { displayName: string }; workspaceRole: WorkspaceRole } }>(
    "/auth/login",
    { method: "POST", body: data }
  );
};

export const registerUser = (data: RegisterPayload) => {
  return apiClient("/auth/register", { method: "POST", body: data });
};

export const logoutUser = () => {
  return apiClient("/auth/logout", { method: "POST" });
};

export const getMe = () => {
  return apiClient<{ data: { user: { displayName: string }; workspaceRole: WorkspaceRole } }>(
    "/auth/me"
  );
};

export const forgotPassword = (email: string) => {
  return apiClient("/auth/forgot-password", { method: "POST", body: { email } });
};

export const resetPassword = (
  data: { token: string; password: string } | string,
  maybePassword?: string
) => {
  const payload =
    typeof data === "string" ? { token: data, password: maybePassword || "" } : data;
  return apiClient("/auth/reset-password", { method: "POST", body: payload });
};
