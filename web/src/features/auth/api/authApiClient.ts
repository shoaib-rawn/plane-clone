export const apiClient = async <T = unknown>(
  url: string,
  options: Omit<RequestInit, "body"> & {
    body?: BodyInit | object | null;
  } = {},
): Promise<T> => {
  const headers = new Headers(options.headers ?? {});

  const token = localStorage.getItem("token");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (
    options.body !== undefined &&
    options.body !== null &&
    !(options.body instanceof FormData) &&
    typeof options.body !== "string" &&
    !(options.body instanceof URLSearchParams)
  ) {
    headers.set("Content-Type", "application/json");
  }

  const requestOptions: RequestInit = {
    ...options,
    headers,
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
  const data = (await response.json().catch(() => ({}))) as any;

  if (!response.ok) {
    const errorDetails = data.error;
    const errMsg = (errorDetails && typeof errorDetails === 'object' && errorDetails.message)
      ? errorDetails.message
      : data.message ?? data.error ?? "Something went wrong";
    throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
  }

  return data;
};
