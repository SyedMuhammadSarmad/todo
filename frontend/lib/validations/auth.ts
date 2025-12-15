/**
 * Zod validation schemas for authentication forms
 * Enforces email format and password complexity requirements
 * T121-T122: Input sanitization and XSS protection
 */

import { z } from "zod";
import { sanitizeEmail, hasControlCharacters, hasSQLInjectionPattern } from "@/lib/security/sanitize";

/**
 * Email validation schema
 * - Must be valid email format
 * - Case-insensitive
 * - Sanitized to prevent injection attacks
 */
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address")
  .max(320, "Email is too long")
  .transform((val) => sanitizeEmail(val))
  .refine((val) => val.length > 0, "Email is required")
  .refine((val) => !hasControlCharacters(val), "Email contains invalid characters")
  .refine((val) => !hasSQLInjectionPattern(val), "Email contains invalid characters");

/**
 * Password validation schema for signup
 * Requirements (from spec):
 * - Minimum 8 characters
 * - At least 1 letter (a-z or A-Z)
 * - At least 1 number (0-9)
 * - No control characters (security)
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .refine((val) => !hasControlCharacters(val), "Password contains invalid characters")
  .refine((val) => !/\0/.test(val), "Password contains invalid characters")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

/**
 * Password validation schema for signin
 * Less strict - just check it's not empty
 */
export const signinPasswordSchema = z
  .string()
  .min(1, "Password is required");

/**
 * Signup form validation schema
 */
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

/**
 * Signin form validation schema
 */
export const signinSchema = z.object({
  email: emailSchema,
  password: signinPasswordSchema,
});

/**
 * Type inference for form data
 */
export type SignupFormData = z.infer<typeof signupSchema>;
export type SigninFormData = z.infer<typeof signinSchema>;

/**
 * Password strength checker
 * Returns a score from 0-4 and descriptive label
 */
export function checkPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;

  // Length checks
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Character variety checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++; // Mixed case
  if (/[0-9]/.test(password)) score++; // Numbers
  if (/[^a-zA-Z0-9]/.test(password)) score++; // Special chars

  // Cap score at 4
  score = Math.min(score, 4);

  // Determine label and color
  const labels = [
    { label: "Too weak", color: "red" },
    { label: "Weak", color: "orange" },
    { label: "Fair", color: "yellow" },
    { label: "Good", color: "lime" },
    { label: "Strong", color: "green" },
  ];

  return {
    score,
    ...labels[score],
  };
}
