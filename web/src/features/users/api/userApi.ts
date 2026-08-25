import { API_BASE_URL } from "../../api/baseUrl";
import { apiClient } from "../../api/client";

export type UpdateProfilePayload = {
  displayName?: string;
  avatarUrl?: string;
};

export const getCurrentProfile = async () => {
  return apiClient(`${API_BASE_URL}/auth/me`);
};

export const updateCurrentProfile = async (payload: UpdateProfilePayload) => {
  return apiClient(`${API_BASE_URL}/users/me`, {
    method: "PATCH",
    body: payload,
  });
};

export const getAllUsers = async () => {
  return apiClient(`${API_BASE_URL}/users`);
};
