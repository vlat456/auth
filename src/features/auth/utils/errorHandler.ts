import axios, { AxiosError } from "axios";
import { AuthErrorCode, ErrorMessages } from "./errorCodes";

// Status code to error code mapping for both message and code purposes
const statusCodeToErrorCode: Record<number, AuthErrorCode> = {
  400: AuthErrorCode.VALIDATION_ERROR,
  401: AuthErrorCode.UNAUTHORIZED,
  403: AuthErrorCode.FORBIDDEN,
  404: AuthErrorCode.NOT_FOUND,
  429: AuthErrorCode.TOO_MANY_REQUESTS,
  500: AuthErrorCode.SERVER_ERROR,
  502: AuthErrorCode.SERVER_ERROR,
  503: AuthErrorCode.SERVER_ERROR,
  504: AuthErrorCode.SERVER_ERROR,
};

/**
 * Custom error class that preserves original error context while providing user-friendly messages
 */
export class ApiError extends Error {
  public originalError?: unknown;
  public status?: number;
  public code?: string;
  public response?: any;

  constructor(
    message: string,
    options?: {
      originalError?: unknown;
      status?: number;
      code?: string;
      response?: any;
    }
  ) {
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

/**
 * Handles API errors preserving original error context while making it available for state machine transitions
 * @param error The error object to handle
 * @throws ApiError with preserved context
 */
export function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<unknown>;
    const response = axiosError.response;

    // Extract status code and response data
    const status = response?.status;
    const responseData = response?.data as Record<string, unknown> | undefined;
    const messageField = responseData?.message as string | undefined;
    const errorField = responseData?.error as string | undefined;

    // Create a user-friendly message based on status code
    let userMessage = ErrorMessages[AuthErrorCode.GENERAL_ERROR];

    if (response) {
      // Get the appropriate error code based on status, then get corresponding message
      const errorCode = status ? statusCodeToErrorCode[status] : undefined;
      if (status && errorCode) {
        // For 429 and 5xx server errors, use message field or default error message
        // For other 4xx errors, use message field, axios error message, or default
        if (status === 429 || (status >= 500 && status <= 599)) {
          userMessage = messageField || ErrorMessages[errorCode];
        } else {
          // For 4xx errors (except 429), use the server message, then axios message, then default
          userMessage = messageField || axiosError.message || ErrorMessages[errorCode];
        }
      } else {
        // Default case for undefined status or other status codes
        userMessage = messageField || axiosError.message || ErrorMessages[AuthErrorCode.GENERAL_ERROR];
      }
    } else {
      // Network errors (no response)
      userMessage = axiosError.message || ErrorMessages[AuthErrorCode.GENERAL_ERROR];
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
  const errorMessage = (error instanceof Error) ? error.message : ErrorMessages[AuthErrorCode.GENERAL_ERROR];
  throw new ApiError(ErrorMessages[AuthErrorCode.GENERAL_ERROR], {
    originalError: error,
    code: AuthErrorCode.GENERAL_ERROR
  });
}

/**
 * Maps HTTP status codes to AuthErrorCode for state machine logic
 */
function getAuthErrorCodeFromStatus(status?: number): AuthErrorCode | undefined {
  if (!status) return undefined;
  return statusCodeToErrorCode[status];
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
        return result.catch((error) => {
          // Preserve the original stack trace before handling
          if (error instanceof Error && error.stack) {
            Error.captureStackTrace(error, fn);
          }
          return handleApiError(error);
        }) as ReturnType<T>;
      }
      return result;
    } catch (error) {
      // Preserve the original stack trace before handling
      if (error instanceof Error && error.stack) {
        Error.captureStackTrace(error, fn);
      }
      handleApiError(error);
    }
  }) as T;
}
