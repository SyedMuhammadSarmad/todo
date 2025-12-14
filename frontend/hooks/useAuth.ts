/**
 * Custom hook to access authentication context
 *
 * This is a convenience wrapper around useAuthContext
 */
import { useAuthContext } from "@/contexts/AuthContext";

export function useAuth() {
  return useAuthContext();
}
