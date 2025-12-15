/**
 * API Client with automatic JWT token handling
 * Provides fetch wrapper with interceptors for authentication
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ApiError {
  detail: string;
  status: number;
}

/**
 * Custom error class for API errors
 */
export class ApiException extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
    this.name = "ApiException";
  }
}

/**
 * Get authentication token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

/**
 * API Client configuration
 */
interface ApiClientConfig extends RequestInit {
  requiresAuth?: boolean;
}

/**
 * Make an authenticated API request
 * Automatically includes JWT token if available
 * Handles 401 responses by redirecting to signin
 */
export async function apiClient<T>(
  endpoint: string,
  config: ApiClientConfig = {}
): Promise<T> {
  const { requiresAuth = false, ...fetchConfig } = config;

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchConfig.headers as Record<string, string>),
  };

  // Add Authorization header if token exists
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else if (requiresAuth) {
    // If auth is required but no token exists, redirect to signin
    if (typeof window !== "undefined") {
      window.location.href = "/signin";
    }
    throw new ApiException(401, "Authentication required");
  }

  // Build full URL
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  try {
    // Make request
    const response = await fetch(url, {
      ...fetchConfig,
      headers,
    });

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      // Clear invalid token
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        // Redirect to signin if not already there
        if (!window.location.pathname.includes("/signin")) {
          window.location.href = "/signin?expired=true";
        }
      }
      throw new ApiException(401, "Session expired. Please sign in again.");
    }

    // Handle 429 Too Many Requests
    if (response.status === 429) {
      const error = await response.json().catch(() => ({ detail: "Too many requests" }));
      throw new ApiException(429, error.detail || "Too many requests. Please try again later.");
    }

    // Handle other error responses
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: `Request failed with status ${response.status}`
      }));
      throw new ApiException(response.status, error.detail || "Request failed");
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    // Parse JSON response
    return await response.json();
  } catch (error) {
    // Re-throw ApiException as-is
    if (error instanceof ApiException) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError) {
      throw new ApiException(0, "Network error. Please check your connection.");
    }

    // Handle other errors
    throw new ApiException(500, error instanceof Error ? error.message : "Unknown error");
  }
}

/**
 * GET request helper
 */
export async function get<T>(endpoint: string, requiresAuth = false): Promise<T> {
  return apiClient<T>(endpoint, {
    method: "GET",
    requiresAuth,
  });
}

/**
 * POST request helper
 */
export async function post<T>(
  endpoint: string,
  data?: any,
  requiresAuth = false
): Promise<T> {
  return apiClient<T>(endpoint, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
    requiresAuth,
  });
}

/**
 * PUT request helper
 */
export async function put<T>(
  endpoint: string,
  data: any,
  requiresAuth = false
): Promise<T> {
  return apiClient<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
    requiresAuth,
  });
}

/**
 * PATCH request helper
 */
export async function patch<T>(
  endpoint: string,
  data: any,
  requiresAuth = false
): Promise<T> {
  return apiClient<T>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(data),
    requiresAuth,
  });
}

/**
 * DELETE request helper
 */
export async function del<T>(endpoint: string, requiresAuth = false): Promise<T> {
  return apiClient<T>(endpoint, {
    method: "DELETE",
    requiresAuth,
  });
}
