import { apiClient } from "./client";

export const getCurrentProfile = () => {
  return apiClient("/auth/me");
};

export const updateCurrentProfile = (payload: { displayName?: string; avatarUrl?: string }) => {
  return apiClient("/users/me", {
    method: "PATCH",
    body: payload,
  });
};

export const getAllUsers = () => {
  return apiClient("/users");
};
