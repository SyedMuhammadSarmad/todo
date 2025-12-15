/**
 * Input sanitization utilities
 * T121: Prevent XSS and injection attacks
 */

/**
 * Sanitize text input to prevent XSS attacks
 * - Removes potential HTML/script tags
 * - Trims whitespace
 * - Limits length to prevent DoS
 */
export function sanitizeTextInput(input: string, maxLength: number = 1000): string {
  if (!input) return "";

  // Trim whitespace
  let sanitized = input.trim();

  // Limit length to prevent DoS
  sanitized = sanitized.substring(0, maxLength);

  // Remove potential HTML tags (basic XSS prevention)
  // Note: React already escapes output, but this provides defense in depth
  sanitized = sanitized.replace(/<[^>]*>/g, "");

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, "");

  return sanitized;
}

/**
 * Sanitize email input
 * - Removes whitespace
 * - Converts to lowercase
 * - Validates basic email structure
 * - Prevents SQL injection characters in email
 */
export function sanitizeEmail(email: string): string {
  if (!email) return "";

  // Trim and lowercase
  let sanitized = email.trim().toLowerCase();

  // Remove any characters that aren't valid in emails
  // Allow: a-z, 0-9, @, ., -, _, +
  sanitized = sanitized.replace(/[^a-z0-9@.\-_+]/g, "");

  // Limit length (email max is 320 chars per RFC 5321)
  sanitized = sanitized.substring(0, 320);

  return sanitized;
}

/**
 * Detect potential SQL injection patterns
 * Returns true if suspicious patterns are found
 */
export function hasSQLInjectionPattern(input: string): boolean {
  if (!input) return false;

  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/i,
    /(--|\;|\/\*|\*\/)/,
    /(\bOR\b.*=.*\bOR\b)/i,
    /('OR'1'='1)/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Validate that string doesn't contain control characters
 * that could be used for injection attacks
 */
export function hasControlCharacters(input: string): boolean {
  // Check for control characters except newline, carriage return, and tab
  return /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(input);
}

/**
 * Sanitize and validate user input
 * Returns sanitized input or throws error if malicious
 */
export function sanitizeAndValidate(
  input: string,
  options: {
    type?: "text" | "email";
    maxLength?: number;
    allowEmpty?: boolean;
  } = {}
): string {
  const { type = "text", maxLength = 1000, allowEmpty = false } = options;

  // Check for empty input
  if (!input || input.trim().length === 0) {
    if (allowEmpty) return "";
    throw new Error("Input cannot be empty");
  }

  // Check for control characters
  if (hasControlCharacters(input)) {
    throw new Error("Input contains invalid characters");
  }

  // Check for SQL injection patterns
  if (hasSQLInjectionPattern(input)) {
    throw new Error("Input contains suspicious patterns");
  }

  // Sanitize based on type
  if (type === "email") {
    return sanitizeEmail(input);
  } else {
    return sanitizeTextInput(input, maxLength);
  }
}
