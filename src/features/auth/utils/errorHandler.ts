import axios, { AxiosError } from "axios";
import { safeGetNestedValue } from "./safetyUtils";

/**
 * Handles API errors and throws a user-friendly error
 * @param error The error object to handle
 * @throws Always throws an error - never returns
 */
export function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const response = (error as AxiosError).response;
    const responseData = response ? response.data : undefined;

    // Try to get a meaningful error message from the response using safe navigation
    const errorMessage = safeGetNestedValue<string>(responseData, 'message');
    if (typeof errorMessage === "string" && errorMessage) {
      throw new Error(errorMessage);
    }

    // Fall back to the error message from the axios error
    if (typeof (error as AxiosError).message === "string" && (error as AxiosError).message) {
      throw new Error((error as AxiosError).message);
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
export function withErrorHandling<T extends (...args: any[]) => any>(fn: T): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result.catch(handleApiError) as ReturnType<T>;
      }
      return result;
    } catch (error) {
      handleApiError(error);
    }
  }) as T;
}
