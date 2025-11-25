/**
 * Path: src/features/auth/utils/validators.ts
 * Version: 1.0.0
 *
 * Runtime validators using Zod schemas as single source of truth.
 * These validators ensure consistency between type guards and schema validation.
 *
 * PATTERN: Always use Zod schemas, never duplicate validation logic
 */

import {
  LoginRequestSchema,
  RegisterRequestSchema,
  RequestOtpSchema,
  VerifyOtpSchema,
  UserProfileSchema,
  AuthSessionSchema,
} from "../schemas/validationSchemas";
import type { UserProfile, AuthSession, LoginRequestDTO, RegisterRequestDTO, RequestOtpDTO, VerifyOtpDTO } from "../types";

/**
 * Validates a UserProfile object using Zod schema as single source of truth
 * Validates both field types and content constraints (non-empty id, valid email)
 */
export function isValidUserProfile(obj: unknown): obj is UserProfile {
  const result = UserProfileSchema.safeParse(obj);
  return result.success;
}

/**
 * Validates an AuthSession object using Zod schema as single source of truth
 * Validates both field types and content constraints (access token min 5 chars)
 */
export function isValidAuthSession(obj: unknown): obj is AuthSession {
  const result = AuthSessionSchema.safeParse(obj);
  return result.success;
}

/**
 * Validates a LoginRequestDTO
 * Requires valid email and password (min 8 chars)
 */
export function isValidLoginRequest(obj: unknown): obj is LoginRequestDTO {
  const result = LoginRequestSchema.safeParse(obj);
  return result.success;
}

/**
 * Validates a RegisterRequestDTO
 * Requires valid email and password (min 8 chars)
 */
export function isValidRegisterRequest(obj: unknown): obj is RegisterRequestDTO {
  const result = RegisterRequestSchema.safeParse(obj);
  return result.success;
}

/**
 * Validates a RequestOtpDTO
 * Requires valid email
 */
export function isValidRequestOtp(obj: unknown): obj is RequestOtpDTO {
  const result = RequestOtpSchema.safeParse(obj);
  return result.success;
}

/**
 * Validates a VerifyOtpDTO
 * Requires valid email and OTP (4-6 digits)
 */
export function isValidVerifyOtp(obj: unknown): obj is VerifyOtpDTO {
  const result = VerifyOtpSchema.safeParse(obj);
  return result.success;
}
