"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { signinSchema, type SigninFormData } from "@/lib/validations/auth";
import { signIn } from "@/lib/auth-client";
import { authLogger } from "@/lib/logging/auth-logger";

/**
 * SigninForm with Better Auth integration
 * User Story 2: Sign In to Existing Account
 */
export function SigninForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SigninFormData>({
    resolver: zodResolver(signinSchema),
  });

  const onSubmit = async (data: SigninFormData) => {
    setIsLoading(true);

    try {
      // Log signin attempt
      authLogger.signinAttempt(data.email);

      // Use Better Auth's signIn function
      const result = await signIn.email({
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Log signin success
      authLogger.signinSuccess(data.email, result.data?.user?.id);

      // Show success message
      toast.success("Signed in successfully!");

      // Redirect to tasks - Better Auth handles session automatically
      router.push("/tasks");
    } catch (error: any) {
      // Log signin failure
      authLogger.signinFailure(data.email, error);

      // Handle errors
      const errorMessage = error.message || "Failed to sign in";

      if (errorMessage.includes("Invalid") || errorMessage.includes("credentials")) {
        toast.error("Invalid email or password");
      } else if (errorMessage.includes("rate") || errorMessage.includes("Too many")) {
        // Log rate limit event
        authLogger.rateLimitExceeded(data.email);
        toast.error("Too many signin attempts. Please try again later.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 w-full max-w-md"
      aria-label="Sign in form"
      noValidate
    >
      {/* Email field - T063 */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register("email")}
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
          placeholder="you@example.com"
          disabled={isLoading}
          autoComplete="email"
          aria-required="true"
          aria-invalid={errors.email ? "true" : "false"}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password field - T063 */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          {...register("password")}
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
          placeholder="Enter your password"
          disabled={isLoading}
          autoComplete="current-password"
          aria-required="true"
          aria-invalid={errors.password ? "true" : "false"}
          aria-describedby={errors.password ? "password-error" : undefined}
        />
        {errors.password && (
          <p id="password-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Submit button - T072 */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 dark:bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label={isLoading ? "Signing in to your account" : "Sign in to your account"}
      >
        {isLoading ? "Signing in..." : "Sign in"}
      </button>

      {/* T073: Link to signup page */}
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Don&apos;t have an account?{" "}
        <a href="/signup" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
          Sign up
        </a>
      </p>
    </form>
  );
}
