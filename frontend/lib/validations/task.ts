/**
 * Task validation schemas using Zod
 * Matches backend validation rules
 */
import { z } from "zod";
import { sanitizeText, hasSQLInjectionPattern, hasXSSPattern } from "@/lib/security/sanitize";

/**
 * Task title validation schema
 * Rules:
 * - Required, min 1 character
 * - Max 200 characters
 * - No SQL injection patterns
 * - No XSS patterns
 */
export const taskTitleSchema = z
  .string()
  .min(1, "Title is required")
  .max(200, "Title must be 200 characters or less")
  .transform((val) => sanitizeText(val))
  .refine((val) => val.length > 0, "Title cannot be empty after sanitization")
  .refine((val) => !hasSQLInjectionPattern(val), "Title contains invalid characters")
  .refine((val) => !hasXSSPattern(val), "Title contains invalid characters");

/**
 * Task description validation schema
 * Rules:
 * - Optional
 * - Max 1000 characters
 * - No SQL injection patterns
 * - No XSS patterns
 */
export const taskDescriptionSchema = z
  .string()
  .max(1000, "Description must be 1000 characters or less")
  .optional()
  .transform((val) => val ? sanitizeText(val) : undefined)
  .refine((val) => !val || !hasSQLInjectionPattern(val), "Description contains invalid characters")
  .refine((val) => !val || !hasXSSPattern(val), "Description contains invalid characters");

/**
 * Schema for creating a new task
 */
export const taskCreateSchema = z.object({
  title: taskTitleSchema,
  description: taskDescriptionSchema,
});

/**
 * Schema for updating an existing task
 * All fields optional
 */
export const taskUpdateSchema = z.object({
  title: taskTitleSchema.optional(),
  description: taskDescriptionSchema,
  completed: z.boolean().optional(),
});

/**
 * Type definitions derived from schemas
 */
export type TaskCreateFormData = z.infer<typeof taskCreateSchema>;
export type TaskUpdateFormData = z.infer<typeof taskUpdateSchema>;
