/**
 * Authentication API client functions
 * Handles all auth-related API calls to the backend
 */

import { AuthResponse, SessionResponse, User } from "@/types/user";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Signup - Create a new user account (User Story 1)
 */
export async function signup(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Signup failed" }));
    throw new Error(error.detail || "Signup failed");
  }

  const data = await response.json();

  // Convert snake_case to camelCase for frontend
  return {
    user: {
      id: data.user.id,
      email: data.user.email,
      createdAt: data.user.created_at,
      updatedAt: data.user.updated_at,
      lastSigninAt: data.user.last_signin_at,
    },
    token: data.token,
    expiresAt: data.expires_at,
  };
}

/**
 * Signin - Authenticate with existing credentials (User Story 2)
 */
export async function signin(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Signin failed" }));

    // Handle rate limiting
    if (response.status === 429) {
      throw new Error("Too many signin attempts. Please try again later.");
    }

    throw new Error(error.detail || "Invalid email or password");
  }

  const data = await response.json();

  // Convert snake_case to camelCase
  return {
    user: {
      id: data.user.id,
      email: data.user.email,
      createdAt: data.user.created_at,
      updatedAt: data.user.updated_at,
      lastSigninAt: data.user.last_signin_at,
    },
    token: data.token,
    expiresAt: data.expires_at,
  };
}

/**
 * Signout - End the current session (User Story 3)
 */
export async function signout(token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/signout`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok && response.status !== 401) {
    // Ignore 401 errors (token already invalid)
    const error = await response.json().catch(() => ({ detail: "Signout failed" }));
    throw new Error(error.detail || "Signout failed");
  }
}

/**
 * Get Session - Check if current session is valid (User Story 4)
 */
export async function getSession(): Promise<SessionResponse> {
  const token = localStorage.getItem("auth_token");

  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Session expired or invalid");
  }

  const data = await response.json();

  // Convert snake_case to camelCase
  return {
    user: {
      id: data.user.id,
      email: data.user.email,
      createdAt: data.user.created_at,
      updatedAt: data.user.updated_at,
      lastSigninAt: data.user.last_signin_at,
    },
    expiresAt: data.expires_at,
    isActive: data.is_active,
  };
}

/**
 * Refresh Token - Extend session before expiration (User Story 4, optional)
 */
export async function refreshToken(token: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  const data = await response.json();

  // Convert snake_case to camelCase
  return {
    user: {
      id: data.user.id,
      email: data.user.email,
      createdAt: data.user.created_at,
      updatedAt: data.user.updated_at,
      lastSigninAt: data.user.last_signin_at,
    },
    token: data.token,
    expiresAt: data.expires_at,
  };
}
