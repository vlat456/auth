"use strict";
/**
 * Path: src/features/auth/utils/zodHelpers.ts
 * Version: 1.0.0
 *
 * Advanced Zod validation helpers providing detailed error messages and
 * structured validation results. Useful for API responses and complex validation scenarios.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLoginRequest = validateLoginRequest;
exports.validateRegisterRequest = validateRegisterRequest;
exports.validateRequestOtp = validateRequestOtp;
exports.validateVerifyOtp = validateVerifyOtp;
exports.validateCompleteRegistration = validateCompleteRegistration;
exports.validateCompletePasswordReset = validateCompletePasswordReset;
exports.validateAuthSession = validateAuthSession;
exports.validateUserProfile = validateUserProfile;
exports.validateLoginResponse = validateLoginResponse;
exports.validateRefreshResponseData = validateRefreshResponseData;
exports.formatValidationErrors = formatValidationErrors;
exports.getFirstValidationError = getFirstValidationError;
exports.validateBatch = validateBatch;
const validationSchemas_1 = require("../schemas/validationSchemas");
// ============================================================================
// Detailed Validation Functions
// ============================================================================
/**
 * Validate LoginRequest with detailed error messages
 * @returns Structured result with validation errors
 */
function validateLoginRequest(data) {
    return (0, validationSchemas_1.validateSafe)(validationSchemas_1.LoginRequestSchema, data);
}
/**
 * Validate RegisterRequest with detailed error messages
 * @returns Structured result with validation errors
 */
function validateRegisterRequest(data) {
    return (0, validationSchemas_1.validateSafe)(validationSchemas_1.RegisterRequestSchema, data);
}
/**
 * Validate RequestOtp with detailed error messages
 * @returns Structured result with validation errors
 */
function validateRequestOtp(data) {
    return (0, validationSchemas_1.validateSafe)(validationSchemas_1.RequestOtpSchema, data);
}
/**
 * Validate VerifyOtp with detailed error messages
 * @returns Structured result with validation errors
 */
function validateVerifyOtp(data) {
    return (0, validationSchemas_1.validateSafe)(validationSchemas_1.VerifyOtpSchema, data);
}
/**
 * Validate CompleteRegistration with detailed error messages
 * @returns Structured result with validation errors
 */
function validateCompleteRegistration(data) {
    return (0, validationSchemas_1.validateSafe)(validationSchemas_1.CompleteRegistrationSchema, data);
}
/**
 * Validate CompletePasswordReset with detailed error messages
 * @returns Structured result with validation errors
 */
function validateCompletePasswordReset(data) {
    return (0, validationSchemas_1.validateSafe)(validationSchemas_1.CompletePasswordResetSchema, data);
}
/**
 * Validate AuthSession with detailed error messages
 * @returns Structured result with validation errors
 */
function validateAuthSession(data) {
    return (0, validationSchemas_1.validateSafe)(validationSchemas_1.AuthSessionSchema, data);
}
/**
 * Validate UserProfile with detailed error messages
 * @returns Structured result with validation errors
 */
function validateUserProfile(data) {
    return (0, validationSchemas_1.validateSafe)(validationSchemas_1.UserProfileSchema, data);
}
/**
 * Validate LoginResponse with detailed error messages
 * @returns Structured result with validation errors
 */
function validateLoginResponse(data) {
    return (0, validationSchemas_1.validateSafe)(validationSchemas_1.LoginResponseSchema, data);
}
/**
 * Validate RefreshResponseData with detailed error messages
 * @returns Structured result with validation errors
 */
function validateRefreshResponseData(data) {
    return (0, validationSchemas_1.validateSafe)(validationSchemas_1.RefreshResponseDataSchema, data);
}
// ============================================================================
// Error Message Formatting
// ============================================================================
/**
 * Format validation errors into a human-readable error message
 * @param errors - Error record from ValidationResult
 * @returns Formatted error message
 */
function formatValidationErrors(errors) {
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
function getFirstValidationError(result) {
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
/**
 * Validate an array of items, separating valid from invalid
 * @param schema - Zod schema to validate against
 * @param items - Array of items to validate
 * @returns Object with separate arrays of valid and invalid items
 */
function validateBatch(schema, items) {
    const valid = [];
    const invalid = [];
    for (const item of items) {
        const result = (0, validationSchemas_1.validateSafe)(schema, item);
        if (result.success) {
            valid.push(result.data);
        }
        else {
            invalid.push({ data: item, errors: result.errors });
        }
    }
    return { valid, invalid };
}
