"use client";

import { SigninForm } from "@/components/auth/SigninForm";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "react-hot-toast";

/**
 * Signin Page (User Story 2)
 * Allows existing users to sign in with their credentials
 * Shows notification if redirected due to session expiration (T105)
 */
export default function SigninPage() {
  const searchParams = useSearchParams();

  // T105: Display notification when session expires
  useEffect(() => {
    if (searchParams.get("expired") === "true") {
      toast.error("Your session has expired. Please sign in again.");
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Sign in to your account</h1>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back! Continue managing your tasks
          </p>
        </div>

        <div className="mt-8">
          <SigninForm />
        </div>
      </div>
    </div>
  );
}
