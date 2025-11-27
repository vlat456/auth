"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
exports.handleApiError = handleApiError;
exports.withErrorHandling = withErrorHandling;
const axios_1 = __importDefault(require("axios"));
const errorCodes_1 = require("./errorCodes");
/**
 * Custom error class that preserves original error context while providing user-friendly messages
 */
class ApiError extends Error {
    constructor(message, options) {
        super(message);
        this.name = 'ApiError';
        this.originalError = options?.originalError;
        this.status = options?.status;
        this.code = options?.code;
        this.response = options?.response;
        // Maintain proper stack trace for the error
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ApiError);
        }
    }
}
exports.ApiError = ApiError;
/**
 * Handles API errors preserving original error context while making it available for state machine transitions
 * @param error The error object to handle
 * @throws ApiError with preserved context
 */
function handleApiError(error) {
    if (axios_1.default.isAxiosError(error)) {
        const axiosError = error;
        const response = axiosError.response;
        // Extract status code and response data
        const status = response?.status;
        const responseData = response?.data;
        const messageField = responseData?.message;
        const errorField = responseData?.error;
        // Create a user-friendly message based on status code
        let userMessage = errorCodes_1.ErrorMessages[errorCodes_1.AuthErrorCode.GENERAL_ERROR];
        if (response) {
            switch (status) {
                case 400:
                    userMessage = messageField || axiosError.message || errorCodes_1.ErrorMessages[errorCodes_1.AuthErrorCode.VALIDATION_ERROR];
                    break;
                case 401:
                    userMessage = messageField || axiosError.message || errorCodes_1.ErrorMessages[errorCodes_1.AuthErrorCode.UNAUTHORIZED];
                    break;
                case 403:
                    userMessage = messageField || axiosError.message || errorCodes_1.ErrorMessages[errorCodes_1.AuthErrorCode.FORBIDDEN];
                    break;
                case 404:
                    userMessage = messageField || axiosError.message || errorCodes_1.ErrorMessages[errorCodes_1.AuthErrorCode.NOT_FOUND];
                    break;
                case 429:
                    userMessage = messageField || errorCodes_1.ErrorMessages[errorCodes_1.AuthErrorCode.TOO_MANY_REQUESTS];
                    break;
                case 500:
                case 502:
                case 503:
                case 504:
                    userMessage = messageField || errorCodes_1.ErrorMessages[errorCodes_1.AuthErrorCode.SERVER_ERROR];
                    break;
                default:
                    userMessage = messageField || axiosError.message || errorCodes_1.ErrorMessages[errorCodes_1.AuthErrorCode.GENERAL_ERROR];
            }
        }
        else {
            // Network errors (no response)
            userMessage = axiosError.message || errorCodes_1.ErrorMessages[errorCodes_1.AuthErrorCode.GENERAL_ERROR];
        }
        // Create ApiError with preserved context
        throw new ApiError(userMessage, {
            originalError: error,
            status: status,
            response: response,
            code: getAuthErrorCodeFromStatus(status)
        });
    }
    // Handle non-axios errors
    const errorMessage = (error instanceof Error) ? error.message : errorCodes_1.ErrorMessages[errorCodes_1.AuthErrorCode.GENERAL_ERROR];
    throw new ApiError(errorCodes_1.ErrorMessages[errorCodes_1.AuthErrorCode.GENERAL_ERROR], {
        originalError: error,
        code: errorCodes_1.AuthErrorCode.GENERAL_ERROR
    });
}
/**
 * Maps HTTP status codes to AuthErrorCode for state machine logic
 */
function getAuthErrorCodeFromStatus(status) {
    if (!status)
        return undefined;
    switch (status) {
        case 400: return errorCodes_1.AuthErrorCode.VALIDATION_ERROR;
        case 401: return errorCodes_1.AuthErrorCode.UNAUTHORIZED;
        case 403: return errorCodes_1.AuthErrorCode.FORBIDDEN;
        case 404: return errorCodes_1.AuthErrorCode.NOT_FOUND;
        case 429: return errorCodes_1.AuthErrorCode.TOO_MANY_REQUESTS;
        case 500:
        case 502:
        case 503:
        case 504: return errorCodes_1.AuthErrorCode.SERVER_ERROR;
        default: return undefined;
    }
}
/**
 * A higher-order function that wraps a function with error handling
 * @param fn The function to wrap
 * @returns A new function with error handling
 */
function withErrorHandling(fn) {
    return ((...args) => {
        try {
            const result = fn(...args);
            if (result instanceof Promise) {
                return result.catch((error) => {
                    // Preserve the original stack trace before handling
                    if (error instanceof Error && error.stack) {
                        Error.captureStackTrace(error, fn);
                    }
                    return handleApiError(error);
                });
            }
            return result;
        }
        catch (error) {
            // Preserve the original stack trace before handling
            if (error instanceof Error && error.stack) {
                Error.captureStackTrace(error, fn);
            }
            handleApiError(error);
        }
    });
}
