"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

/**
 * ProtectedRoute component with Better Auth integration
 * User Story 3: Protects pages that require authentication
 * Redirects to signin page if user is not authenticated
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    // Redirect to signin if not authenticated
    if (!isPending && !session) {
      router.push("/signin");
    }
  }, [session, isPending, router]);

  // Show loading state while checking authentication
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!session) {
    return null;
  }

  // Render children if authenticated
  return <>{children}</>;
}
