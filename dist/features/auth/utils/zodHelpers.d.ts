/**
 * Path: src/features/auth/utils/zodHelpers.ts
 * Version: 1.0.0
 *
 * Advanced Zod validation helpers providing detailed error messages and
 * structured validation results. Useful for API responses and complex validation scenarios.
 */
import { z } from "zod";
import { LoginRequestSchema, RegisterRequestSchema, RequestOtpSchema, VerifyOtpSchema, CompleteRegistrationSchema, CompletePasswordResetSchema, AuthSessionSchema, UserProfileSchema, LoginResponseSchema, RefreshResponseDataSchema, ValidationResult } from "../schemas/validationSchemas";
/**
 * Validate LoginRequest with detailed error messages
 * @returns Structured result with validation errors
 */
export declare function validateLoginRequest(data: unknown): ValidationResult<z.infer<typeof LoginRequestSchema>>;
/**
 * Validate RegisterRequest with detailed error messages
 * @returns Structured result with validation errors
 */
export declare function validateRegisterRequest(data: unknown): ValidationResult<z.infer<typeof RegisterRequestSchema>>;
/**
 * Validate RequestOtp with detailed error messages
 * @returns Structured result with validation errors
 */
export declare function validateRequestOtp(data: unknown): ValidationResult<z.infer<typeof RequestOtpSchema>>;
/**
 * Validate VerifyOtp with detailed error messages
 * @returns Structured result with validation errors
 */
export declare function validateVerifyOtp(data: unknown): ValidationResult<z.infer<typeof VerifyOtpSchema>>;
/**
 * Validate CompleteRegistration with detailed error messages
 * @returns Structured result with validation errors
 */
export declare function validateCompleteRegistration(data: unknown): ValidationResult<z.infer<typeof CompleteRegistrationSchema>>;
/**
 * Validate CompletePasswordReset with detailed error messages
 * @returns Structured result with validation errors
 */
export declare function validateCompletePasswordReset(data: unknown): ValidationResult<z.infer<typeof CompletePasswordResetSchema>>;
/**
 * Validate AuthSession with detailed error messages
 * @returns Structured result with validation errors
 */
export declare function validateAuthSession(data: unknown): ValidationResult<z.infer<typeof AuthSessionSchema>>;
/**
 * Validate UserProfile with detailed error messages
 * @returns Structured result with validation errors
 */
export declare function validateUserProfile(data: unknown): ValidationResult<z.infer<typeof UserProfileSchema>>;
/**
 * Validate LoginResponse with detailed error messages
 * @returns Structured result with validation errors
 */
export declare function validateLoginResponse(data: unknown): ValidationResult<z.infer<typeof LoginResponseSchema>>;
/**
 * Validate RefreshResponseData with detailed error messages
 * @returns Structured result with validation errors
 */
export declare function validateRefreshResponseData(data: unknown): ValidationResult<z.infer<typeof RefreshResponseDataSchema>>;
/**
 * Format validation errors into a human-readable error message
 * @param errors - Error record from ValidationResult
 * @returns Formatted error message
 */
export declare function formatValidationErrors(errors: Record<string, string[]>): string;
/**
 * Get the first error message from a ValidationResult
 * @param result - ValidationResult from any validation function
 * @returns First error message, or undefined if validation passed
 */
export declare function getFirstValidationError(result: ValidationResult<unknown>): string | undefined;
/**
 * Type for batch validation result
 */
export interface BatchValidationResult<T> {
    valid: T[];
    invalid: {
        data: unknown;
        errors: Record<string, string[]>;
    }[];
}
/**
 * Validate an array of items, separating valid from invalid
 * @param schema - Zod schema to validate against
 * @param items - Array of items to validate
 * @returns Object with separate arrays of valid and invalid items
 */
export declare function validateBatch<T>(schema: z.ZodSchema<T>, items: unknown[]): BatchValidationResult<T>;
