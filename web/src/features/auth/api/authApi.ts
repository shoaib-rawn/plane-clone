import { apiClient } from "./authApiClient";
import type { LoginPayload, LoginResponse, RegisterPayload } from "./types/typesAuth";
import { AUTH_BASE_URL } from "./url/baseUrl";



export const loginUser = async (userData: LoginPayload) => {
  return apiClient<LoginResponse>(`${AUTH_BASE_URL}/login`, {
    method: "POST",
    body: JSON.stringify(userData),
  })

};

export const registerUser = async (userData: RegisterPayload) => {
 return apiClient(`${AUTH_BASE_URL}/register`, {
    method: "POST",
  body: JSON.stringify(userData),
  })
};

export const getMe = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("No authentication token found");
  }
  return apiClient(`${AUTH_BASE_URL}/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
