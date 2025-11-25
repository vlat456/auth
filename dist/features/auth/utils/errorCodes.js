"use strict";
/**
 * Error codes dictionary for secure error handling
 * Contains generic error messages to prevent information disclosure
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMessages = exports.AuthErrorCode = void 0;
var AuthErrorCode;
(function (AuthErrorCode) {
    // General errors
    AuthErrorCode["GENERAL_ERROR"] = "AUTH_001";
    AuthErrorCode["NETWORK_ERROR"] = "AUTH_002";
    AuthErrorCode["INVALID_INPUT"] = "AUTH_003";
    AuthErrorCode["SESSION_EXPIRED"] = "AUTH_004";
    AuthErrorCode["TOKEN_INVALID"] = "AUTH_005";
    // Authentication errors
    AuthErrorCode["LOGIN_FAILED"] = "AUTH_101";
    AuthErrorCode["REGISTRATION_FAILED"] = "AUTH_102";
    AuthErrorCode["USER_NOT_FOUND"] = "AUTH_103";
    AuthErrorCode["INVALID_CREDENTIALS"] = "AUTH_104";
    AuthErrorCode["ACCOUNT_LOCKED"] = "AUTH_105";
    AuthErrorCode["ACCOUNT_DISABLED"] = "AUTH_106";
    // Authorization errors
    AuthErrorCode["UNAUTHORIZED_ACCESS"] = "AUTH_201";
    AuthErrorCode["INSUFFICIENT_PERMISSIONS"] = "AUTH_202";
    AuthErrorCode["INVALID_TOKEN"] = "AUTH_203";
    AuthErrorCode["TOKEN_EXPIRED"] = "AUTH_204";
    // OTP related errors
    AuthErrorCode["OTP_INVALID"] = "AUTH_301";
    AuthErrorCode["OTP_EXPIRED"] = "AUTH_302";
    AuthErrorCode["OTP_RATE_LIMITED"] = "AUTH_303";
    AuthErrorCode["OTP_SEND_FAILED"] = "AUTH_304";
    // Password related errors
    AuthErrorCode["PASSWORD_RESET_FAILED"] = "AUTH_401";
    AuthErrorCode["PASSWORD_WEAK"] = "AUTH_402";
    AuthErrorCode["PASSWORD_MISMATCH"] = "AUTH_403";
    AuthErrorCode["PASSWORD_SAME_AS_OLD"] = "AUTH_404";
    // Rate limiting
    AuthErrorCode["TOO_MANY_REQUESTS"] = "AUTH_501";
    AuthErrorCode["RATE_LIMIT_EXCEEDED"] = "AUTH_502";
    // Additional API error codes
    AuthErrorCode["VALIDATION_ERROR"] = "AUTH_601";
    AuthErrorCode["UNAUTHORIZED"] = "AUTH_602";
    AuthErrorCode["FORBIDDEN"] = "AUTH_603";
    AuthErrorCode["NOT_FOUND"] = "AUTH_604";
    // Server errors
    AuthErrorCode["SERVER_ERROR"] = "AUTH_999";
})(AuthErrorCode || (exports.AuthErrorCode = AuthErrorCode = {}));
exports.ErrorMessages = {
    // General errors
    [AuthErrorCode.GENERAL_ERROR]: 'An unexpected error occurred',
    [AuthErrorCode.NETWORK_ERROR]: 'Network connection error',
    [AuthErrorCode.INVALID_INPUT]: 'Invalid input provided',
    [AuthErrorCode.SESSION_EXPIRED]: 'Session expired, please login again',
    [AuthErrorCode.TOKEN_INVALID]: 'Invalid authentication token',
    // Authentication errors
    [AuthErrorCode.LOGIN_FAILED]: 'Login failed',
    [AuthErrorCode.REGISTRATION_FAILED]: 'Registration failed',
    [AuthErrorCode.USER_NOT_FOUND]: 'User not found',
    [AuthErrorCode.INVALID_CREDENTIALS]: 'Invalid credentials',
    [AuthErrorCode.ACCOUNT_LOCKED]: 'Account is locked',
    [AuthErrorCode.ACCOUNT_DISABLED]: 'Account is disabled',
    // Authorization errors
    [AuthErrorCode.UNAUTHORIZED_ACCESS]: 'Access denied',
    [AuthErrorCode.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',
    [AuthErrorCode.INVALID_TOKEN]: 'Invalid token',
    [AuthErrorCode.TOKEN_EXPIRED]: 'Token expired',
    // OTP related errors
    [AuthErrorCode.OTP_INVALID]: 'Invalid OTP code',
    [AuthErrorCode.OTP_EXPIRED]: 'OTP code has expired',
    [AuthErrorCode.OTP_RATE_LIMITED]: 'Too many attempts, please try again later',
    [AuthErrorCode.OTP_SEND_FAILED]: 'Failed to send OTP',
    // Password related errors
    [AuthErrorCode.PASSWORD_RESET_FAILED]: 'Password reset failed',
    [AuthErrorCode.PASSWORD_WEAK]: 'Password does not meet requirements',
    [AuthErrorCode.PASSWORD_MISMATCH]: 'Passwords do not match',
    [AuthErrorCode.PASSWORD_SAME_AS_OLD]: 'New password cannot be the same as old password',
    // Rate limiting
    [AuthErrorCode.TOO_MANY_REQUESTS]: 'Too many requests, please try again later',
    [AuthErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
    // Additional API error messages
    [AuthErrorCode.VALIDATION_ERROR]: 'Validation error occurred',
    [AuthErrorCode.UNAUTHORIZED]: 'Unauthorized access',
    [AuthErrorCode.FORBIDDEN]: 'Access forbidden',
    [AuthErrorCode.NOT_FOUND]: 'Resource not found',
    // Server errors
    [AuthErrorCode.SERVER_ERROR]: 'Server error occurred',
};
