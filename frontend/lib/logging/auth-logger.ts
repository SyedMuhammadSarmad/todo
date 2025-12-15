/**
 * Authentication error logging utility
 * T139: Add error logging for authentication failures
 *
 * IMPORTANT: Never log sensitive data (passwords, tokens, full email addresses)
 */

export type AuthEvent =
  | "signup_attempt"
  | "signup_success"
  | "signup_failure"
  | "signin_attempt"
  | "signin_success"
  | "signin_failure"
  | "signout_attempt"
  | "signout_success"
  | "signout_failure"
  | "session_expired"
  | "session_check"
  | "rate_limit_exceeded";

export interface AuthLogEntry {
  timestamp: string;
  event: AuthEvent;
  userId?: string;
  email?: string; // Masked email (e.g., "u***@example.com")
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Mask email address for privacy
 * Example: "user@example.com" -> "u***@example.com"
 */
function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "***";

  const [local, domain] = email.split("@");
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***@${domain}`;
}

/**
 * Log authentication event
 * In production, this would send to a logging service (e.g., Sentry, LogRocket)
 * For now, logs to console with structured format
 */
export function logAuthEvent(
  event: AuthEvent,
  details?: {
    email?: string;
    userId?: string;
    error?: Error | string;
    metadata?: Record<string, any>;
  }
): void {
  const logEntry: AuthLogEntry = {
    timestamp: new Date().toISOString(),
    event,
  };

  // Add masked email if provided
  if (details?.email) {
    logEntry.email = maskEmail(details.email);
  }

  // Add user ID if provided (safe to log)
  if (details?.userId) {
    logEntry.userId = details.userId;
  }

  // Add error message (never log stack traces with sensitive data)
  if (details?.error) {
    const errorMessage =
      typeof details.error === "string" ? details.error : details.error.message;

    // Sanitize error message to remove potential sensitive data
    logEntry.error = sanitizeErrorMessage(errorMessage);
  }

  // Add metadata (ensure no sensitive data)
  if (details?.metadata) {
    logEntry.metadata = sanitizeMetadata(details.metadata);
  }

  // In development, log to console
  if (process.env.NODE_ENV === "development") {
    console.log(`[AUTH] ${event}:`, logEntry);
  }

  // In production, send to logging service
  if (process.env.NODE_ENV === "production") {
    // TODO: Send to production logging service (Sentry, LogRocket, etc.)
    // Example: Sentry.captureMessage(`Auth event: ${event}`, { extra: logEntry });
  }

  // Store in client-side analytics if configured
  if (typeof window !== "undefined" && (window as any).analytics) {
    (window as any).analytics.track(`auth_${event}`, logEntry);
  }
}

/**
 * Sanitize error message to remove sensitive data
 */
function sanitizeErrorMessage(message: string): string {
  // Remove potential email addresses
  let sanitized = message.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL]");

  // Remove potential UUIDs (user IDs)
  sanitized = sanitized.replace(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
    "[UUID]"
  );

  // Remove potential tokens
  sanitized = sanitized.replace(/\b[A-Za-z0-9-_]{20,}\b/g, "[TOKEN]");

  return sanitized;
}

/**
 * Sanitize metadata to remove sensitive fields
 */
function sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  const sensitiveKeys = ["password", "token", "secret", "apiKey", "api_key", "accessToken", "refreshToken"];

  for (const [key, value] of Object.entries(metadata)) {
    // Skip sensitive keys
    if (sensitiveKeys.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
      sanitized[key] = "[REDACTED]";
      continue;
    }

    // Recursively sanitize nested objects
    if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeMetadata(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Helper function to log signup events
 */
export const authLogger = {
  signupAttempt: (email: string) => logAuthEvent("signup_attempt", { email }),
  signupSuccess: (email: string, userId?: string) =>
    logAuthEvent("signup_success", { email, userId }),
  signupFailure: (email: string, error: Error | string) =>
    logAuthEvent("signup_failure", { email, error }),

  signinAttempt: (email: string) => logAuthEvent("signin_attempt", { email }),
  signinSuccess: (email: string, userId?: string) =>
    logAuthEvent("signin_success", { email, userId }),
  signinFailure: (email: string, error: Error | string) =>
    logAuthEvent("signin_failure", { email, error }),

  signoutAttempt: (userId?: string) => logAuthEvent("signout_attempt", { userId }),
  signoutSuccess: (userId?: string) => logAuthEvent("signout_success", { userId }),
  signoutFailure: (error: Error | string) => logAuthEvent("signout_failure", { error }),

  sessionExpired: (userId?: string) => logAuthEvent("session_expired", { userId }),
  sessionCheck: (userId?: string) => logAuthEvent("session_check", { userId }),
  rateLimitExceeded: (email: string) => logAuthEvent("rate_limit_exceeded", { email }),
};
