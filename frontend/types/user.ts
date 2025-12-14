/**
 * User entity matching backend SQLModel
 */
export interface User {
  id: string;
  email: string;
  createdAt: string; // ISO 8601 datetime string
  updatedAt: string; // ISO 8601 datetime string
  lastSigninAt?: string; // ISO 8601 datetime string
}

/**
 * Authentication response from signup/signin
 */
export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string; // ISO 8601 datetime string
}

/**
 * Session response from session check
 */
export interface SessionResponse {
  user: User;
  expiresAt: string;
  isActive: boolean;
}
