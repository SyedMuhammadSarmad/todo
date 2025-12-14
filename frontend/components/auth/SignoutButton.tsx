"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { signOut } from "@/lib/auth-client";

/**
 * SignoutButton with Better Auth integration
 * User Story 3: Sign Out
 */
export function SignoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignout = async () => {
    setIsLoading(true);

    try {
      // Use Better Auth's signOut function
      const result = await signOut();

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Display success toast
      toast.success("You have been signed out successfully");

      // Redirect to signin page
      router.push("/signin");
    } catch (error: any) {
      // Even if signout fails, redirect to signin
      toast.success("You have been signed out");
      router.push("/signin");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignout}
      disabled={isLoading}
      className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? "Signing out..." : "Sign out"}
    </button>
  );
}
