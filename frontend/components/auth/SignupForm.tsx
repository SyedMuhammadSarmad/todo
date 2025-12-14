"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { signup } from "@/lib/api/auth";
import { useAuth } from "@/hooks/useAuth";

export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setUser, setToken } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupInput>({
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
      return { strength: "Strong", color: "text-green-600" };
    } else if (isLongEnough && hasLetter && hasNumber) {
      return { strength: "Medium", color: "text-yellow-600" };
    } else if (pwd.length >= 6) {
      return { strength: "Weak", color: "text-red-600" };
    }
    return { strength: "Very Weak", color: "text-red-600" };
  };

  const passwordStrength = getPasswordStrength(password || "");

  const onSubmit = async (data: SignupInput) => {
    setIsLoading(true);

    try {
      // T041: Call signup API
      const response = await signup(data);

      // T042: Store JWT token
      setToken(response.token);

      // T043: Update AuthContext
      setUser(response.user);

      // Show success message
      toast.success("Account created successfully!");

      // T044: Redirect to dashboard
      router.push("/dashboard");
    } catch (error: any) {
      // T045: Display error for duplicate email (409)
      if (error.message.includes("already exists")) {
        toast.error("An account with this email already exists");
      }
      // T046: Display error for validation failures (400)
      else if (error.message.includes("validation")) {
        toast.error("Please check your input and try again");
      }
      // Generic error
      else {
        toast.error(error.message || "Failed to create account");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full max-w-md">
      {/* Email field - T037 */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register("email")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="you@example.com"
          disabled={isLoading}
        />
        {/* T039: Display inline validation errors */}
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Password field - T037 */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          {...register("password")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Min 8 characters, 1 letter, 1 number"
          disabled={isLoading}
        />
        {/* T039: Display inline validation errors */}
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}

        {/* T038: Password strength indicator */}
        {password && passwordStrength.strength && (
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  passwordStrength.strength === "Strong"
                    ? "bg-green-600 w-full"
                    : passwordStrength.strength === "Medium"
                    ? "bg-yellow-600 w-2/3"
                    : "bg-red-600 w-1/3"
                }`}
              />
            </div>
            <span className={`text-xs font-medium ${passwordStrength.color}`}>
              {passwordStrength.strength}
            </span>
          </div>
        )}
      </div>

      {/* Submit button - T047 */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Creating account..." : "Sign up"}
      </button>

      {/* Link to signin */}
      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <a href="/signin" className="text-blue-600 hover:text-blue-700 font-medium">
          Sign in
        </a>
      </p>
    </form>
  );
}
