/**
 * Handles API errors and throws a user-friendly error
 * @param error The error object to handle
 * @throws Always throws an error - never returns
 */
export declare function handleApiError(error: unknown): never;
/**
 * A higher-order function that wraps a function with error handling
 * @param fn The function to wrap
 * @returns A new function with error handling
 */
export declare function withErrorHandling<T extends (...args: any[]) => any>(fn: T): T;
