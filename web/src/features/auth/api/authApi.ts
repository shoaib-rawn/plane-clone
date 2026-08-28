import { apiClient } from "./authApiClient";
import type { LoginPayload, LoginResponse, RegisterPayload } from "../types/typesAuth";
import { AUTH_BASE_URL } from "../url/baseUrl";

export const loginUser = async (userData: LoginPayload) => {
  return apiClient<LoginResponse>(`${AUTH_BASE_URL}/login`, {
    method: "POST",
    body: userData,
  });
};

export const registerUser = async (userData: RegisterPayload) => {
  return apiClient(`${AUTH_BASE_URL}/register`, {
    method: "POST",
    body: userData,
  });
};

export const logoutUser = async () => {
  return apiClient<{ data: { message: string } }>(`${AUTH_BASE_URL}/logout`, {
    method: "POST",
  });
};

export const forgotPassword = async (email: string) => {
  return apiClient<{ data: { message: string } }>(`${AUTH_BASE_URL}/forgot-password`, {
    method: "POST",
    body: { email },
  });
};

export const resetPassword = async (token: string, password: string) => {
  return apiClient<{ data: { message: string } }>(`${AUTH_BASE_URL}/reset-password`, {
    method: "POST",
    body: { token, password },
  });
};

export const getMe = async () => {
  return apiClient<{ data: { user: { displayName: string; role?: string }; workspaceRole: "ADMIN" | "MEMBER" } }>(`${AUTH_BASE_URL}/me`, {
    method: "GET",
  });
};
