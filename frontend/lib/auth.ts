/**
 * Better Auth Server Configuration
 * Handles authentication with email/password and JWT tokens
 */
import { betterAuth } from "better-auth";
import { Pool } from "pg";

// Create PostgreSQL connection pool for Better Auth
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const auth = betterAuth({
  // Database configuration - Better Auth will auto-create tables
  database: pool,

  // Email and password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disable for MVP
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  // Session configuration
  session: {
    modelName: "sessions",
    fields: {
      userId: "user_id",
      token: "token_hash",
      expiresAt: "expires_at",
      createdAt: "created_at",
      lastActivityAt: "last_activity_at",
      userAgent: "user_agent",
      ipAddress: "ip_address",
      updatedAt: "updated_at",
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache for 5 minutes
    },
  },

  // Secret for signing JWTs (shared with backend)
  secret: process.env.BETTER_AUTH_SECRET!,

  // Base URL for the app
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // Allowed origins for CORS
  trustedOrigins: [
    "http://localhost:3000",
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean) as string[],

  // Advanced security options
  advanced: {
    cookiePrefix: "better_auth",
    useSecureCookies: process.env.NODE_ENV === "production",
    crossSubDomainCookies: {
      enabled: false,
    },
    generateId: () => {
      // Use crypto.randomUUID() for user IDs
      return crypto.randomUUID();
    },
  },

  // User schema customization
  user: {
    modelName: "users",
    fields: {
      email: "email",
      emailVerified: "email_verified",
      name: "name",
      image: "image",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    additionalFields: {
      last_signin_at: {
        type: "date",
        required: false,
        defaultValue: () => null,
      },
    },
  },

  // Account schema customization
  account: {
    modelName: "accounts",
    fields: {
      userId: "user_id",
      accountId: "account_id",
      providerId: "provider_id",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      expiresAt: "expires_at",
      password: "password_hash", // Map 'password' field to 'password_hash' column
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    accountLinking: {
      enabled: false, // Only email/password for MVP
    },
  },

  // Verification schema customization
  verification: {
    modelName: "verifications",
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },

  // Rate limiting
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute
    max: 100, // Increased from 5 to 100 to prevent session polling issues
  },
});

// Export the auth type for client usage
export type Auth = typeof auth;
