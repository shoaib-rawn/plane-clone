export const API_BASE = "http://localhost:4000/api/v1";

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: any;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
  const isJson =
    options.body &&
    typeof options.body === "object" &&
    !(options.body instanceof FormData);

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(isJson ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    body: isJson ? JSON.stringify(options.body) : options.body,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error?.message || "Request failed");
  }

  return data;
}
