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
 * - Input sanitization using transform methods
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
// Sanitization helpers
// ============================================================================

const sanitizeInput = (input: string): string => {
  if (typeof input !== "string") {
    return "";
  }

  // Remove or escape potentially dangerous characters
  return input
    .replace(/</g, "&lt;") // Prevent HTML injection
    .replace(/>/g, "&gt;") // Prevent HTML injection
    .replace(/"/g, "&quot;") // Prevent attribute escaping
    .replace(/'/g, "&#x27;") // Prevent attribute escaping
    .replace(/\//g, "&#x2F;") // Prevent closing tags
    .trim(); // Remove leading/trailing whitespace
};

const sanitizeEmail = (email: string): string => {
  if (typeof email !== "string") {
    return "";
  }

  // Use validator to normalize and validate email (if available, otherwise basic normalization)
  // For now, we implement basic normalization
  return email.toLowerCase().trim().substring(0, 254);
};

const sanitizePassword = (password: string): string => {
  if (typeof password !== "string") {
    return "";
  }

  // Don't overly restrict password chars as this might reduce entropy
  // Just remove potentially dangerous characters
  return password.replace(/['"]/g, "");
};

const sanitizeOtp = (otp: string): string => {
  if (typeof otp !== "string") {
    return "";
  }

  // Only allow digits and ensure it's not too long
  const digitsOnly = otp.replace(/\D/g, "").substring(0, 10);
  return digitsOnly;
};

const sanitizeActionToken = (token: string): string => {
  if (typeof token !== "string") {
    return "";
  }

  // Remove potential dangerous characters but keep token format
  return token.replace(/['"<>]/g, "").trim();
};

// ============================================================================
// Primitive Schemas with sanitization
// ============================================================================

const UnsanitizedEmailSchema = z
  .string()
  .min(1, "Email is required")
  .max(254, "Email is too long") // Standard email max length
  .email("Invalid email format");

export const EmailSchema = UnsanitizedEmailSchema.transform(sanitizeEmail);

const UnsanitizedPasswordSchema = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long"); // Reasonable max length

export const PasswordSchema =
  UnsanitizedPasswordSchema.transform(sanitizePassword);

const UnsanitizedOtpSchema = z
  .string()
  .max(10, "OTP is too long") // Additional safety limit
  .regex(/^\d{4,6}$/, "OTP must be a 4-6 digit code");

export const OtpSchema = UnsanitizedOtpSchema.transform(sanitizeOtp);

const UnsanitizedActionTokenSchema = z
  .string()
  .min(1, "Action token is required")
  .min(20, "Invalid action token format")
  .max(512, "Action token is too long"); // Reasonable max length for tokens

export const ActionTokenSchema =
  UnsanitizedActionTokenSchema.transform(sanitizeActionToken);

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

const UnsanitizedRefreshRequestSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
}) satisfies z.ZodType<RefreshRequestDTO>;

export const RefreshRequestSchema = UnsanitizedRefreshRequestSchema.transform(
  (val) => ({
    refreshToken: val.refreshToken.trim(),
  })
);

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
  accessToken: z.string().min(5, "Access token must be at least 5 characters"),
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
}) satisfies z.ZodType<ApiSuccessResponse<unknown>>;

// Specific response schemas
export const LoginResponseSchemaWrapper = z.object({
  status: z.number(),
  message: z.string(),
  data: LoginResponseSchema,
}) satisfies z.ZodType<ApiSuccessResponse<LoginResponseDTO>>;

export const RefreshResponseSchemaWrapper = z.object({
  status: z.number(),
  message: z.string(),
  data: RefreshResponseDataSchema,
}) satisfies z.ZodType<ApiSuccessResponse<RefreshResponseData>>;

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
