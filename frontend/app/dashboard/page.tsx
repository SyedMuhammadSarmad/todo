"use client";

import { useSession } from "@/lib/auth-client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SignoutButton } from "@/components/auth/SignoutButton";

/**
 * Dashboard Page with Better Auth integration
 * Protected page that requires authentication
 * Shows user information and signout button
 */
export default function DashboardPage() {
  const { data: session, isPending } = useSession();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header with signout button */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-xl font-semibold text-gray-900">Todo App</h1>
              <SignoutButton />
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to your Dashboard
            </h2>
            {isPending ? (
              <p className="text-gray-600">Loading...</p>
            ) : (
              <>
                <p className="text-gray-600 mb-2">
                  You&apos;re signed in as: <span className="font-medium">{session?.user?.email}</span>
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  User ID: <code className="bg-gray-100 px-2 py-1 rounded">{session?.user?.id}</code>
                </p>
              </>
            )}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What&apos;s next?
              </h3>
              <p className="text-sm text-gray-500">
                Task management features coming soon in the next phase!
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
