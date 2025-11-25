/**
 * Custom error class that preserves original error context while providing user-friendly messages
 */
export declare class ApiError extends Error {
    originalError?: unknown;
    status?: number;
    code?: string;
    response?: any;
    constructor(message: string, options?: {
        originalError?: unknown;
        status?: number;
        code?: string;
        response?: any;
    });
}
/**
 * Handles API errors preserving original error context while making it available for state machine transitions
 * @param error The error object to handle
 * @throws ApiError with preserved context
 */
export declare function handleApiError(error: unknown): never;
/**
 * A higher-order function that wraps a function with error handling
 * @param fn The function to wrap
 * @returns A new function with error handling
 */
export declare function withErrorHandling<T extends (...args: any[]) => any>(fn: T): T;
