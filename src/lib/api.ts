import { clearSession } from "./auth";

const API_BASE = import.meta.env.VITE_API_URL || "https://fah-ride-dzg3aqhsfsdqh4fy.centralindia-01.azurewebsites.net/api/v1";

// ETag cache: stores the last ETag for each endpoint
const eTagCache = new Map<string, string>();

// Response cache: stores the last response data for each endpoint (used when 304 is received)
const responseCache = new Map<string, unknown>();

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let refreshPromise: Promise<boolean> | null = null;

const refreshSession = async () => {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((response) => response.ok)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

export const apiRequest = async <T>(
  path: string,
  init: RequestInit = {},
  didRetry = false
): Promise<T> => {
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  // Add ETag for GET requests to enable caching
  if (!init.method || init.method === "GET") {
    const cachedETag = eTagCache.get(path);
    if (cachedETag) {
      headers.set("If-None-Match", cachedETag);
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  // Handle 304 Not Modified - return cached data
  if (response.status === 304) {
    const cachedData = responseCache.get(path);
    if (cachedData) {
      return { success: true, data: cachedData } as T;
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const shouldTryRefresh =
      response.status === 401 &&
      !didRetry &&
      path !== "/auth/refresh" &&
      !path.startsWith("/auth/login") &&
      !path.startsWith("/auth/signup");

    if (shouldTryRefresh) {
      const refreshed = await refreshSession();
      if (refreshed) {
        return apiRequest<T>(path, init, true);
      }
    }

    if (response.status === 401) {
      clearSession();
    }
    throw new ApiError(data.message || "Request failed", response.status);
  }

  // Store ETag and response data for future requests
  const eTag = response.headers.get("ETag");
  if (eTag && (!init.method || init.method === "GET")) {
    eTagCache.set(path, eTag);
    if (data.data) {
      responseCache.set(path, data.data);
    }
  }

  return data as T;
};
