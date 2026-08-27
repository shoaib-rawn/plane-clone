/**
 * Standardized HTTP API Client
 * Configured with credentials: "include" for secure httpOnly Cookie authentication
 */

export const apiClient = async <T = unknown>(
  url: string,
  options: Omit<RequestInit, "body"> & {
    body?: BodyInit | object | null;
  } = {},
): Promise<T> => {
  const headers = new Headers(options.headers ?? {});

  // Set Content-Type header if sending JSON object
  if (
    options.body !== undefined &&
    options.body !== null &&
    !(options.body instanceof FormData) &&
    typeof options.body !== "string" &&
    !(options.body instanceof URLSearchParams)
  ) {
    headers.set("Content-Type", "application/json");
  }

  const { body, headers: _customHeaders, credentials, ...restOptions } = options;

  let serializedBody: BodyInit | null | undefined = undefined;
  if (
    body !== undefined &&
    body !== null &&
    typeof body === "object" &&
    !(body instanceof FormData) &&
    !(body instanceof URLSearchParams)
  ) {
    serializedBody = JSON.stringify(body);
  } else {
    serializedBody = body as BodyInit | null | undefined;
  }

  const requestOptions: RequestInit = {
    ...restOptions,
    headers,
    body: serializedBody,
    // Automatically send and receive secure httpOnly session cookies with each request
    credentials: credentials ?? "include",
  };

  const response = await fetch(url, requestOptions);
  const data = (await response.json().catch(() => ({}))) as any;

  if (!response.ok) {
    const errorDetails = data.error;
    const errMsg = (errorDetails && typeof errorDetails === "object" && errorDetails.message)
      ? errorDetails.message
      : data.message ?? data.error ?? "Something went wrong";
    throw new Error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));
  }

  return data;
};
