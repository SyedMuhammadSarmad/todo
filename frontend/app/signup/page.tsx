import { SignupForm } from "@/components/auth/SignupForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up - Todo App",
  description: "Create a new account to start managing your tasks",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors duration-200 py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Create your account</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Start organizing your tasks today
          </p>
        </div>

        <div className="mt-8">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
