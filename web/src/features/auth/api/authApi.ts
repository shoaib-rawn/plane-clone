export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
}

export interface ApiError extends Error {
  status?: number;
  data?: {
    message?: string;
    errors?: {
      email?: string | string[];
      password?: string | string[];
    };
  };
}

const AUTH_BASE_URL = "http://localhost:4000/api/v1/auth";

export const loginUser = async (userData: LoginPayload) => {
  const response = await fetch(`${AUTH_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    const apiError = new Error(
      data.message || "Invalid email or password.",
    ) as ApiError;

    apiError.status = response.status;
    apiError.data = data;

    throw apiError;
  }

  return data;
};

export const registerUser = async (userData: RegisterPayload) => {
  const response = await fetch(`${AUTH_BASE_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    const apiError = new Error(
      data.message || "Registration failed",
    ) as ApiError;

    apiError.status = response.status;
    apiError.data = data;

    throw apiError;
  }

  return data;
};
