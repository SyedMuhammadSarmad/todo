/**
 * Better Auth API Route Handler
 * Handles all authentication requests: /api/auth/*
 *
 * Endpoints provided by Better Auth:
 * - POST /api/auth/sign-up - Create new account
 * - POST /api/auth/sign-in/email - Sign in with email/password
 * - POST /api/auth/sign-out - Sign out
 * - GET /api/auth/session - Get current session
 * - And more...
 */
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
