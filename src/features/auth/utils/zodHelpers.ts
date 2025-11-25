/**
 * Path: src/features/auth/utils/zodHelpers.ts
 * Version: 1.0.0
 *
 * Advanced Zod validation helpers providing detailed error messages and
 * structured validation results. Useful for API responses and complex validation scenarios.
 */

import { z } from "zod";
import {
  LoginRequestSchema,
  RegisterRequestSchema,
  RequestOtpSchema,
  VerifyOtpSchema,
  CompleteRegistrationSchema,
  CompletePasswordResetSchema,
  AuthSessionSchema,
  UserProfileSchema,
  LoginResponseSchema,
  RefreshResponseDataSchema,
  validateSafe,
  ValidationResult,
} from "../schemas/validationSchemas";

// ============================================================================
// Detailed Validation Functions
// ============================================================================

/**
 * Validate LoginRequest with detailed error messages
 * @returns Structured result with validation errors
 */
export function validateLoginRequest(
  data: unknown
): ValidationResult<z.infer<typeof LoginRequestSchema>> {
  return validateSafe(LoginRequestSchema, data);
}

/**
 * Validate RegisterRequest with detailed error messages
 * @returns Structured result with validation errors
 */
export function validateRegisterRequest(
  data: unknown
): ValidationResult<z.infer<typeof RegisterRequestSchema>> {
  return validateSafe(RegisterRequestSchema, data);
}

/**
 * Validate RequestOtp with detailed error messages
 * @returns Structured result with validation errors
 */
export function validateRequestOtp(
  data: unknown
): ValidationResult<z.infer<typeof RequestOtpSchema>> {
  return validateSafe(RequestOtpSchema, data);
}

/**
 * Validate VerifyOtp with detailed error messages
 * @returns Structured result with validation errors
 */
export function validateVerifyOtp(
  data: unknown
): ValidationResult<z.infer<typeof VerifyOtpSchema>> {
  return validateSafe(VerifyOtpSchema, data);
}

/**
 * Validate CompleteRegistration with detailed error messages
 * @returns Structured result with validation errors
 */
export function validateCompleteRegistration(
  data: unknown
): ValidationResult<z.infer<typeof CompleteRegistrationSchema>> {
  return validateSafe(CompleteRegistrationSchema, data);
}

/**
 * Validate CompletePasswordReset with detailed error messages
 * @returns Structured result with validation errors
 */
export function validateCompletePasswordReset(
  data: unknown
): ValidationResult<z.infer<typeof CompletePasswordResetSchema>> {
  return validateSafe(CompletePasswordResetSchema, data);
}

/**
 * Validate AuthSession with detailed error messages
 * @returns Structured result with validation errors
 */
export function validateAuthSession(
  data: unknown
): ValidationResult<z.infer<typeof AuthSessionSchema>> {
  return validateSafe(AuthSessionSchema, data);
}

/**
 * Validate UserProfile with detailed error messages
 * @returns Structured result with validation errors
 */
export function validateUserProfile(
  data: unknown
): ValidationResult<z.infer<typeof UserProfileSchema>> {
  return validateSafe(UserProfileSchema, data);
}

/**
 * Validate LoginResponse with detailed error messages
 * @returns Structured result with validation errors
 */
export function validateLoginResponse(
  data: unknown
): ValidationResult<z.infer<typeof LoginResponseSchema>> {
  return validateSafe(LoginResponseSchema, data);
}

/**
 * Validate RefreshResponseData with detailed error messages
 * @returns Structured result with validation errors
 */
export function validateRefreshResponseData(
  data: unknown
): ValidationResult<z.infer<typeof RefreshResponseDataSchema>> {
  return validateSafe(RefreshResponseDataSchema, data);
}

// ============================================================================
// Error Message Formatting
// ============================================================================

/**
 * Format validation errors into a human-readable error message
 * @param errors - Error record from ValidationResult
 * @returns Formatted error message
 */
export function formatValidationErrors(
  errors: Record<string, string[]>
): string {
  const messages = Object.entries(errors).map(([field, fieldErrors]) => {
    const fieldName = field === "root" ? "Input" : field;
    return `${fieldName}: ${fieldErrors.join(", ")}`;
  });

  return messages.join("; ");
}

/**
 * Get the first error message from a ValidationResult
 * @param result - ValidationResult from any validation function
 * @returns First error message, or undefined if validation passed
 */
export function getFirstValidationError(
  result: ValidationResult<unknown>
): string | undefined {
  if (result.success) {
    return undefined;
  }

  const errorKeys = Object.keys(result.errors);
  if (errorKeys.length === 0) {
    return undefined;
  }

  const firstKey = errorKeys[0];
  return result.errors[firstKey][0];
}

// ============================================================================
// Batch Validation
// ============================================================================

/**
 * Type for batch validation result
 */
export interface BatchValidationResult<T> {
  valid: T[];
  invalid: { data: unknown; errors: Record<string, string[]> }[];
}

/**
 * Validate an array of items, separating valid from invalid
 * @param schema - Zod schema to validate against
 * @param items - Array of items to validate
 * @returns Object with separate arrays of valid and invalid items
 */
export function validateBatch<T>(
  schema: z.ZodSchema<T>,
  items: unknown[]
): BatchValidationResult<T> {
  const valid: T[] = [];
  const invalid: { data: unknown; errors: Record<string, string[]> }[] = [];

  for (const item of items) {
    const result = validateSafe(schema, item);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalid.push({ data: item, errors: result.errors });
    }
  }

  return { valid, invalid };
}
