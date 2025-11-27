"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiErrorResponseSchema = exports.RefreshResponseSchemaWrapper = exports.LoginResponseSchemaWrapper = exports.ApiSuccessResponseSchema = exports.AuthSessionSchema = exports.UserProfileSchema = exports.RefreshResponseDataSchema = exports.LoginResponseSchema = exports.RefreshRequestSchema = exports.DeleteAccountRequestSchema = exports.ChangePasswordRequestSchema = exports.CompletePasswordResetSchema = exports.CompleteRegistrationSchema = exports.VerifyOtpSchema = exports.RequestOtpSchema = exports.RegisterRequestSchema = exports.LoginRequestSchema = exports.ActionTokenSchema = exports.OtpSchema = exports.PasswordSchema = exports.EmailSchema = exports.sanitizeActionToken = exports.sanitizeOtp = exports.sanitizePassword = exports.sanitizeEmail = exports.sanitizeInput = void 0;
const zod_1 = require("zod");
// ============================================================================
// Sanitization helpers
// ============================================================================
const sanitizeInput = (input) => {
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
exports.sanitizeInput = sanitizeInput;
const sanitizeEmail = (email) => {
    if (typeof email !== "string") {
        return "";
    }
    // Use validator to normalize and validate email (if available, otherwise basic normalization)
    // For now, we implement basic normalization
    return email.toLowerCase().trim().substring(0, 254);
};
exports.sanitizeEmail = sanitizeEmail;
const sanitizePassword = (password) => {
    if (typeof password !== "string") {
        return "";
    }
    // Don't overly restrict password chars as this might reduce entropy
    // Just remove potentially dangerous characters
    return password.replace(/['"]/g, "");
};
exports.sanitizePassword = sanitizePassword;
const sanitizeOtp = (otp) => {
    if (typeof otp !== "string") {
        return "";
    }
    // Only allow digits and ensure it's not too long
    const digitsOnly = otp.replace(/\D/g, "").substring(0, 10);
    return digitsOnly;
};
exports.sanitizeOtp = sanitizeOtp;
const sanitizeActionToken = (token) => {
    if (typeof token !== "string") {
        return "";
    }
    // Remove potential dangerous characters but keep token format
    return token.replace(/['"<>]/g, "").trim();
};
exports.sanitizeActionToken = sanitizeActionToken;
// ============================================================================
// Primitive Schemas with sanitization
// ============================================================================
const UnsanitizedEmailSchema = zod_1.z
    .string()
    .min(1, "Email is required")
    .max(254, "Email is too long") // Standard email max length
    .email("Invalid email format");
exports.EmailSchema = UnsanitizedEmailSchema.transform(exports.sanitizeEmail);
const UnsanitizedPasswordSchema = zod_1.z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"); // Reasonable max length
exports.PasswordSchema = UnsanitizedPasswordSchema.transform(exports.sanitizePassword);
const UnsanitizedOtpSchema = zod_1.z
    .string()
    .max(10, "OTP is too long") // Additional safety limit
    .regex(/^\d{4,6}$/, "OTP must be a 4-6 digit code");
exports.OtpSchema = UnsanitizedOtpSchema.transform(exports.sanitizeOtp);
const UnsanitizedActionTokenSchema = zod_1.z
    .string()
    .min(1, "Action token is required")
    .min(20, "Invalid action token format")
    .max(512, "Action token is too long"); // Reasonable max length for tokens
exports.ActionTokenSchema = UnsanitizedActionTokenSchema.transform(exports.sanitizeActionToken);
// ============================================================================
// DTO Schemas
// ============================================================================
exports.LoginRequestSchema = zod_1.z.object({
    email: exports.EmailSchema,
    password: exports.PasswordSchema,
});
exports.RegisterRequestSchema = zod_1.z.object({
    email: exports.EmailSchema,
    password: exports.PasswordSchema,
});
exports.RequestOtpSchema = zod_1.z.object({
    email: exports.EmailSchema,
});
exports.VerifyOtpSchema = zod_1.z.object({
    email: exports.EmailSchema,
    otp: exports.OtpSchema,
});
exports.CompleteRegistrationSchema = zod_1.z.object({
    actionToken: exports.ActionTokenSchema,
    newPassword: exports.PasswordSchema,
});
exports.CompletePasswordResetSchema = zod_1.z.object({
    actionToken: exports.ActionTokenSchema,
    newPassword: exports.PasswordSchema,
});
exports.ChangePasswordRequestSchema = zod_1.z.object({
    email: exports.EmailSchema,
    newPassword: exports.PasswordSchema,
});
exports.DeleteAccountRequestSchema = zod_1.z.object({
    email: exports.EmailSchema,
});
const UnsanitizedRefreshRequestSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, "Refresh token is required"),
});
exports.RefreshRequestSchema = UnsanitizedRefreshRequestSchema.transform((val) => ({
    refreshToken: val.refreshToken.trim(),
}));
// ============================================================================
// Response Schemas
// ============================================================================
exports.LoginResponseSchema = zod_1.z.object({
    accessToken: zod_1.z.string().min(1, "Access token is required"),
    refreshToken: zod_1.z.string().min(1, "Refresh token is required"),
});
exports.RefreshResponseDataSchema = zod_1.z.object({
    accessToken: zod_1.z.string().min(1, "Access token is required"),
});
// ============================================================================
// Entity Schemas
// ============================================================================
exports.UserProfileSchema = zod_1.z.object({
    id: zod_1.z.string().min(1, "User ID is required"),
    email: exports.EmailSchema,
    name: zod_1.z.string().optional(),
});
exports.AuthSessionSchema = zod_1.z.object({
    accessToken: zod_1.z.string().min(5, "Access token must be at least 5 characters"),
    refreshToken: zod_1.z.string().min(1, "Refresh token is required").optional(),
    profile: exports.UserProfileSchema.optional(),
});
// ============================================================================
// API Response Schemas
// ============================================================================
exports.ApiSuccessResponseSchema = zod_1.z.object({
    status: zod_1.z.number().int().positive("Status must be positive"),
    message: zod_1.z.string(),
    data: zod_1.z.unknown(),
});
// Specific response schemas
exports.LoginResponseSchemaWrapper = zod_1.z.object({
    status: zod_1.z.number(),
    message: zod_1.z.string(),
    data: exports.LoginResponseSchema,
});
exports.RefreshResponseSchemaWrapper = zod_1.z.object({
    status: zod_1.z.number(),
    message: zod_1.z.string(),
    data: exports.RefreshResponseDataSchema,
});
exports.ApiErrorResponseSchema = zod_1.z.object({
    status: zod_1.z.number().int().positive("Status must be positive"),
    error: zod_1.z.string(),
    errorId: zod_1.z.string(),
    message: zod_1.z.string(),
    path: zod_1.z.string(),
});
