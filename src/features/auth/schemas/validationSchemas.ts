/**
 * Path: src/features/auth/schemas/validationSchemas.ts
 * Version: 1.0.0
 *
 * Centralized validation schemas using Zod for all DTOs and entities.
 * Zod provides:
 * - Type-safe validation with automatic TypeScript inference
 * - Detailed error messages
 * - Composable schemas
 * - Runtime validation without duplicating type definitions
 */

import { z } from "zod";
import type {
  AuthSession,
  UserProfile,
  LoginRequestDTO,
  RegisterRequestDTO,
  RequestOtpDTO,
  VerifyOtpDTO,
  CompleteRegistrationDTO,
  CompletePasswordResetDTO,
  ChangePasswordRequestDTO,
  DeleteAccountRequestDTO,
  RefreshRequestDTO,
  LoginResponseDTO,
  RefreshResponseData,
  ApiSuccessResponse,
  ApiErrorResponse,
} from "../types";

// ============================================================================
// Primitive Schemas
// ============================================================================

export const EmailSchema = z
  .string()
  .email("Invalid email format")
  .min(1, "Email is required");

export const PasswordSchema = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters");

export const OtpSchema = z
  .string()
  .regex(/^\d{4,6}$/, "OTP must be a 4-6 digit code");

export const ActionTokenSchema = z
  .string()
  .min(1, "Action token is required")
  .min(20, "Invalid action token format");

// ============================================================================
// DTO Schemas
// ============================================================================

export const LoginRequestSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
}) satisfies z.ZodType<LoginRequestDTO>;

export const RegisterRequestSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
}) satisfies z.ZodType<RegisterRequestDTO>;

export const RequestOtpSchema = z.object({
  email: EmailSchema,
}) satisfies z.ZodType<RequestOtpDTO>;

export const VerifyOtpSchema = z.object({
  email: EmailSchema,
  otp: OtpSchema,
}) satisfies z.ZodType<VerifyOtpDTO>;

export const CompleteRegistrationSchema = z.object({
  actionToken: ActionTokenSchema,
  newPassword: PasswordSchema,
}) satisfies z.ZodType<CompleteRegistrationDTO>;

export const CompletePasswordResetSchema = z.object({
  actionToken: ActionTokenSchema,
  newPassword: PasswordSchema,
}) satisfies z.ZodType<CompletePasswordResetDTO>;

export const ChangePasswordRequestSchema = z.object({
  email: EmailSchema,
  newPassword: PasswordSchema,
}) satisfies z.ZodType<ChangePasswordRequestDTO>;

export const DeleteAccountRequestSchema = z.object({
  email: EmailSchema,
}) satisfies z.ZodType<DeleteAccountRequestDTO>;

export const RefreshRequestSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
}) satisfies z.ZodType<RefreshRequestDTO>;

// ============================================================================
// Response Schemas
// ============================================================================

export const LoginResponseSchema = z.object({
  accessToken: z.string().min(1, "Access token is required"),
  refreshToken: z.string().min(1, "Refresh token is required"),
}) satisfies z.ZodType<LoginResponseDTO>;

export const RefreshResponseDataSchema = z.object({
  accessToken: z.string().min(1, "Access token is required"),
}) satisfies z.ZodType<RefreshResponseData>;

// ============================================================================
// Entity Schemas
// ============================================================================

export const UserProfileSchema = z.object({
  id: z.string().min(1, "User ID is required"),
  email: EmailSchema,
  name: z.string().optional(),
}) satisfies z.ZodType<UserProfile>;

export const AuthSessionSchema = z.object({
  accessToken: z
    .string()
    .min(1, "Access token is required")
    .min(20, "Invalid access token format"),
  refreshToken: z.string().min(1, "Refresh token is required").optional(),
  profile: UserProfileSchema.optional(),
}) satisfies z.ZodType<AuthSession>;

// ============================================================================
// API Response Schemas
// ============================================================================

export const ApiSuccessResponseSchema = z.object({
  status: z.number().int().positive("Status must be positive"),
  message: z.string(),
  data: z.unknown(),
}) satisfies z.ZodType<ApiSuccessResponse>;

export const ApiErrorResponseSchema = z.object({
  status: z.number().int().positive("Status must be positive"),
  error: z.string(),
  errorId: z.string(),
  message: z.string(),
  path: z.string(),
}) satisfies z.ZodType<ApiErrorResponse>;

// ============================================================================
// Type Exports (Automatically inferred from schemas)
// ============================================================================

export type ValidatedLoginRequest = z.infer<typeof LoginRequestSchema>;
export type ValidatedRegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type ValidatedAuthSession = z.infer<typeof AuthSessionSchema>;
export type ValidatedUserProfile = z.infer<typeof UserProfileSchema>;

// ============================================================================
// Validation Result Types
// ============================================================================

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };

// ============================================================================
// Helper Functions for Safe Validation
// ============================================================================

/**
 * Safely validate data against a schema and return structured result
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Structured result with either validated data or detailed errors
 */
export function validateSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  // Transform Zod errors into a more readable format
  const errors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    const pathKey = path || "root";

    if (pathKey in errors) {
      errors[pathKey].push(issue.message);
    } else {
      errors[pathKey] = [issue.message];
    }
  }

  return {
    success: false,
    errors,
  };
}

/**
 * Validate data and throw detailed error on failure
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated data
 * @throws ZodError on validation failure
 */
export function validateStrict<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Try to validate with a fallback value
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param fallback - Value to return on validation failure
 * @returns Validated data or fallback
 */
export function validateWithFallback<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  fallback: T
): T {
  const result = schema.safeParse(data);
  return result.success ? result.data : fallback;
}
