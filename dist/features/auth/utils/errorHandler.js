"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleApiError = handleApiError;
exports.withErrorHandling = withErrorHandling;
const axios_1 = __importDefault(require("axios"));
const safetyUtils_1 = require("./safetyUtils");
/**
 * Handles API errors and throws a user-friendly error
 * @param error The error object to handle
 * @throws Always throws an error - never returns
 */
function handleApiError(error) {
    if (axios_1.default.isAxiosError(error)) {
        const response = error.response;
        const responseData = response ? response.data : undefined;
        // Try to get a meaningful error message from the response using safe navigation
        const errorMessage = (0, safetyUtils_1.safeGetNestedValue)(responseData, 'message');
        if (typeof errorMessage === "string" && errorMessage) {
            throw new Error(errorMessage);
        }
        // Fall back to the error message from the axios error
        if (typeof error.message === "string" && error.message) {
            throw new Error(error.message);
        }
        // Default fallback
        throw new Error("An unexpected error occurred");
    }
    // Non-axios errors
    throw new Error("An unexpected error occurred");
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
                return result.catch(handleApiError);
            }
            return result;
        }
        catch (error) {
            handleApiError(error);
        }
    });
}
