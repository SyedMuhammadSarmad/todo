/**
 * Better Auth Client Configuration
 * Used by frontend components to interact with Better Auth
 */
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

// Export hooks and functions for use in components
export const {
  useSession,
  signIn,
  signUp,
  signOut,
} = authClient;
