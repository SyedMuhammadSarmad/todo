"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { signupSchema, type SignupFormData } from "@/lib/validations/auth";
import { signUp } from "@/lib/auth-client";
import { authLogger } from "@/lib/logging/auth-logger";

/**
 * SignupForm with Better Auth integration
 * User Story 1: Create Account (Signup)
 */
export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const password = watch("password");

  // T038: Password strength indicator
  const getPasswordStrength = (pwd: string): { strength: string; color: string } => {
    if (!pwd) return { strength: "", color: "" };

    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    const isLongEnough = pwd.length >= 8;

    if (isLongEnough && hasLetter && hasNumber && hasSpecial) {
      return { strength: "Strong", color: "text-green-600 dark:text-green-400" };
    } else if (isLongEnough && hasLetter && hasNumber) {
      return { strength: "Medium", color: "text-yellow-600 dark:text-yellow-400" };
    } else if (pwd.length >= 6) {
      return { strength: "Weak", color: "text-red-600 dark:text-red-400" };
    }
    return { strength: "Very Weak", color: "text-red-600 dark:text-red-400" };
  };

  const passwordStrength = getPasswordStrength(password || "");

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);

    try {
      // Log signup attempt
      authLogger.signupAttempt(data.email);

      // Use Better Auth's signUp function
      const result = await signUp.email({
        email: data.email,
        password: data.password,
        name: data.email.split("@")[0], // Use email prefix as name
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Log signup success
      authLogger.signupSuccess(data.email, result.data?.user?.id);

      // Show success message
      toast.success("Account created successfully!");

      // Redirect to tasks - Better Auth handles session automatically
      router.push("/tasks");
    } catch (error: any) {
      // Log signup failure
      authLogger.signupFailure(data.email, error);

      // Handle errors
      const errorMessage = error.message || "Failed to create account";

      if (errorMessage.includes("already exists") || errorMessage.includes("duplicate")) {
        toast.error("An account with this email already exists");
      } else if (errorMessage.includes("password")) {
        toast.error("Password must be at least 8 characters with a letter and number");
      } else if (errorMessage.includes("email")) {
        toast.error("Please enter a valid email address");
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
      aria-label="Sign up form"
      noValidate
    >
      {/* Email field - T037 */}
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
          aria-required="true"
          aria-invalid={errors.email ? "true" : "false"}
          aria-describedby={errors.email ? "email-error" : undefined}
          autoComplete="email"
        />
        {/* T039: Display inline validation errors */}
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password field - T037 */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          {...register("password")}
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
          placeholder="Min 8 characters, 1 letter, 1 number"
          disabled={isLoading}
          aria-required="true"
          aria-invalid={errors.password ? "true" : "false"}
          aria-describedby={errors.password ? "password-error" : "password-strength"}
          autoComplete="new-password"
        />
        {/* T039: Display inline validation errors */}
        {errors.password && (
          <p id="password-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
            {errors.password.message}
          </p>
        )}

        {/* T038: Password strength indicator */}
        {password && passwordStrength.strength && (
          <div
            id="password-strength"
            className="mt-1 flex items-center gap-2"
            role="status"
            aria-live="polite"
          >
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  passwordStrength.strength === "Strong"
                    ? "bg-green-600 dark:bg-green-500 w-full"
                    : passwordStrength.strength === "Medium"
                    ? "bg-yellow-600 dark:bg-yellow-500 w-2/3"
                    : "bg-red-600 dark:bg-red-500 w-1/3"
                }`}
                role="progressbar"
                aria-valuenow={
                  passwordStrength.strength === "Strong"
                    ? 100
                    : passwordStrength.strength === "Medium"
                    ? 66
                    : 33
                }
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <span className={`text-xs font-medium ${passwordStrength.color}`}>
              {passwordStrength.strength}
            </span>
          </div>
        )}
      </div>

      {/* Confirm Password field - T037 */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          {...register("confirmPassword")}
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
          placeholder="Re-enter your password"
          disabled={isLoading}
          aria-required="true"
          aria-invalid={errors.confirmPassword ? "true" : "false"}
          aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
          autoComplete="new-password"
        />
        {/* T039: Display inline validation errors */}
        {errors.confirmPassword && (
          <p id="confirmPassword-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Submit button - T047 */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 dark:bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label={isLoading ? "Creating your account" : "Sign up for a new account"}
      >
        {isLoading ? "Creating account..." : "Sign up"}
      </button>

      {/* Link to signin */}
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{" "}
        <a href="/signin" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
          Sign in
        </a>
      </p>
    </form>
  );
}
