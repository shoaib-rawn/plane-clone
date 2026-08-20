import type { LoginResponse } from "../types/typesAuth";

export const apiClient = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<LoginResponse> => {
  const response = await fetch(url, {
    ...options,

    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};