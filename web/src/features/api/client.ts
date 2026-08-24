const buildHeaders = (customHeaders: HeadersInit = {}): Headers => {
  const headers = new Headers(customHeaders);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
};

export const apiClient = async <T = Record<string, unknown>>(
  url: string,
  options: Omit<RequestInit, "body"> & {
    body?: BodyInit | object | null;
  } = {},
): Promise<T> => {
  const requestOptions: RequestInit = {
    ...options,
    headers: buildHeaders(options.headers ?? {}),
  } as RequestInit;

  if (
    options.body !== undefined &&
    options.body !== null &&
    typeof options.body === "object" &&
    !(options.body instanceof FormData) &&
    !(options.body instanceof URLSearchParams)
  ) {
    requestOptions.body = JSON.stringify(options.body);
  } else {
    requestOptions.body = options.body as BodyInit | null | undefined;
  }

  const response = await fetch(url, requestOptions);
  const data = (await response.json().catch(() => ({}))) as T & {
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.message ?? data.error ?? "Something went wrong");
  }

  return data;
};
