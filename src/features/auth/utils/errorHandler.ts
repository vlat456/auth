import axios, { AxiosError } from "axios";
import { AuthErrorCode, ErrorMessages } from "./errorCodes";

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
    const axiosError = error as AxiosError;
    const response = axiosError.response;

    // Extract status code and response data
    const status = response?.status;
    const responseData = response?.data as Record<string, unknown> | undefined;
    const messageField = responseData?.message as string | undefined;
    const errorField = responseData?.error as string | undefined;

    // Create a user-friendly message based on status code
    let userMessage = ErrorMessages[AuthErrorCode.GENERAL_ERROR];

    if (response) {
      switch (status) {
        case 400:
          userMessage = messageField || axiosError.message || ErrorMessages[AuthErrorCode.VALIDATION_ERROR];
          break;
        case 401:
          userMessage = messageField || axiosError.message || ErrorMessages[AuthErrorCode.UNAUTHORIZED];
          break;
        case 403:
          userMessage = messageField || axiosError.message || ErrorMessages[AuthErrorCode.FORBIDDEN];
          break;
        case 404:
          userMessage = messageField || axiosError.message || ErrorMessages[AuthErrorCode.NOT_FOUND];
          break;
        case 429:
          userMessage = messageField || ErrorMessages[AuthErrorCode.TOO_MANY_REQUESTS];
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          userMessage = messageField ||
            (errorField &&
              (errorField.toLowerCase().includes('internal') || errorField.toLowerCase().includes('error'))
              ? ErrorMessages[AuthErrorCode.SERVER_ERROR]
              : ErrorMessages[AuthErrorCode.SERVER_ERROR]);
          break;
        default:
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

  switch (status) {
    case 400: return AuthErrorCode.VALIDATION_ERROR;
    case 401: return AuthErrorCode.UNAUTHORIZED;
    case 403: return AuthErrorCode.FORBIDDEN;
    case 404: return AuthErrorCode.NOT_FOUND;
    case 429: return AuthErrorCode.TOO_MANY_REQUESTS;
    case 500:
    case 502:
    case 503:
    case 504: return AuthErrorCode.SERVER_ERROR;
    default: return undefined;
  }
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
