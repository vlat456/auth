import { AuthEvent } from "../machine/authMachine";
import { LoginRequestDTO, AuthSession, UserProfile } from "../types";

import {
  LoginRequestSchema,
  RegisterRequestSchema,
  VerifyOtpSchema,
  RequestOtpSchema,
  AuthSessionSchema,
  UserProfileSchema,
} from "../schemas/validationSchemas";
import type { ZodSchema } from "zod";

/**
 * Generic function to create a validation function based on a Zod schema
 */
export function createValidationFunction<T>(schema: ZodSchema<T>) {
  return (payload: unknown): payload is T => {
    return schema.safeParse(payload).success;
  };
}

/**
 * Safely extract an error message from an XState error event.
 * Checks several possible locations where error messages may appear.
 */
export function safeExtractErrorMessage(event: AuthEvent): string | undefined {
  try {
    // event.data is commonly used by xstate for promise rejections
    const anyEvent = event as any;
    if (anyEvent && typeof anyEvent === "object") {
      if (anyEvent.data && typeof anyEvent.data.message === "string") {
        return anyEvent.data.message;
      }
      if (anyEvent.error && typeof anyEvent.error.message === "string") {
        return anyEvent.error.message;
      }
      if (anyEvent.data && typeof anyEvent.data === "string") {
        return anyEvent.data;
      }
      if (anyEvent.error && typeof anyEvent.error === "string") {
        return anyEvent.error;
      }
    }
  } catch {
    // swallow and return undefined
    console.debug("Error extracting message");
  }
  return undefined;
}

/**
 * Safely extract payload from an event
 */
export function safeExtractPayload<T = Record<string, unknown>>(
  event: AuthEvent
): T | undefined {
  if (
    "payload" in event &&
    typeof event.payload === "object" &&
    event.payload !== null
  ) {
    // Instead of unchecked cast, we could add validation based on expected type
    // For now, we'll keep the cast but with better documentation
    return event.payload as T;
  }
  return undefined;
}

/**
 * Generic function to safely extract and validate payload using a provided schema
 */
export function safeExtractAndValidatePayload<T>(
  event: AuthEvent,
  schema: ZodSchema<T>
): T | undefined {
  const rawPayload = safeExtractPayload(event);
  if (rawPayload === undefined) {
    return undefined;
  }

  const result = schema.safeParse(rawPayload);
  if (result.success) {
    return result.data as T;
  }

  return undefined;
}

/**
 * Factory function to create schema-based extraction functions
 */
export function createSafeExtractFunction<T>(schema: ZodSchema<T>) {
  return (event: AuthEvent): T | undefined => {
    return safeExtractAndValidatePayload(event, schema);
  };
}

/**
 * Safely extract and validate login payload from event
 */
export const safeExtractLoginPayload =
  createSafeExtractFunction(LoginRequestSchema);

/**
 * Safely extract a value from an event payload with type validation
 */
export function safeExtractValue<T>(
  event: AuthEvent,
  key: string,
  typeGuard: (value: unknown) => value is T
): T | undefined {
  const payload = safeExtractPayload(event);
  if (payload && key in payload) {
    const value = payload[key];
    if (typeGuard(value)) {
      return value;
    }
  }
  return undefined;
}

/**
 * Safely extract a string value from an event payload
 */
export function safeExtractStringFromPayload(
  event: AuthEvent,
  key: string
): string | undefined {
  return safeExtractValue(
    event,
    key,
    (value): value is string => typeof value === "string"
  );
}

/**
 * Safely extract output from an event
 */
export function safeExtractOutput<T = unknown>(
  event: AuthEvent
): T | undefined {
  if ("output" in event && event.output !== undefined) {
    return event.output as T;
  }
  return undefined;
}

/**
 * Safely extract email from event payload
 */
export function safeExtractEmail(event: AuthEvent): string | undefined {
  return safeExtractStringFromPayload(event, "email");
}

/**
 * Safely extract OTP from event payload
 */
export function safeExtractOtp(event: AuthEvent): string | undefined {
  return safeExtractStringFromPayload(event, "otp");
}

/**
 * Safely extract newPassword from event payload
 */
export function safeExtractNewPassword(event: AuthEvent): string | undefined {
  return safeExtractStringFromPayload(event, "newPassword");
}

/**
 * Safely get a string value from context with fallback
 */
export function safeGetStringFromContext(
  value: string | undefined,
  fallback: string = ""
): string {
  return typeof value === "string" ? value : fallback;
}

/**
 * Safely validate RegisterRequestDTO using Zod schema as single source of truth
 */
export const isValidRegisterRequest = createValidationFunction(RegisterRequestSchema);

/**
 * Safely validate RequestOtpDTO using Zod schema as single source of truth
 */
export const isValidRequestOtp = createValidationFunction(RequestOtpSchema);

/**
 * Safely validate VerifyOtpDTO using Zod schema as single source of truth
 */
export const isValidVerifyOtp = createValidationFunction(VerifyOtpSchema);

/**
 * Safely extract and validate register payload from event
 */
export const safeExtractRegisterPayload = createSafeExtractFunction(
  RegisterRequestSchema
);

/**
 * Safely extract and validate OTP request payload from event
 */
export const safeExtractOtpRequestPayload =
  createSafeExtractFunction(RequestOtpSchema);

/**
 * Safely extract and validate verify OTP payload from event
 */
export const safeExtractVerifyOtpPayload =
  createSafeExtractFunction(VerifyOtpSchema);

/**
 * Safely extract new password from RESET_PASSWORD event
 */
export function safeExtractResetPasswordPayload(
  event: AuthEvent
): { newPassword: string } | undefined {
  const payload = safeExtractPayload<{ newPassword: unknown }>(event);
  if (payload && typeof payload.newPassword === "string") {
    return { newPassword: payload.newPassword };
  }
  return undefined;
}

/**
 * Safely get AuthSession from output with validation
 */
export function safeExtractSessionOutput(
  event: AuthEvent
): AuthSession | undefined {
  const output = safeExtractOutput(event);
  if (isAuthSession(output)) {
    return output;
  }
  return undefined;
}

/**
 * Safely validate LoginRequestDTO using Zod schema as single source of truth
 */
export const isValidLoginRequest = createValidationFunction(LoginRequestSchema);

/**
 * Safely validate AuthSession using Zod schema as single source of truth
 */
export const isAuthSession = createValidationFunction(AuthSessionSchema);

/**
 * Safely validate UserProfile using Zod schema as single source of truth
 */
export const isUserProfile = createValidationFunction(UserProfileSchema);
/**
 * Safely extract action token from context with validation
 */
export function safeExtractActionToken(token: string | undefined): string {
  return typeof token === "string" && token.trim().length > 0 ? token : "";
}

/**
 * Safely extract password from pending credentials
 */
export function safeExtractPasswordFromPending(
  pending: LoginRequestDTO | undefined
): string {
  if (pending && typeof pending.password === "string") {
    return pending.password;
  }
  return "";
}

/**
 * Safe array access function
 */
export function safeArrayAccess<T>(
  arr: T[] | undefined,
  index: number,
  defaultValue?: T
): T | undefined {
  if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
    return defaultValue;
  }
  return arr[index];
}

/**
 * Safely extracts password from pending credentials.
 * Returns non-empty password if available, otherwise empty string.
 */
export const resolveRegistrationPassword = (
  pending?: LoginRequestDTO
): string => {
  if (
    pending &&
    typeof pending.password === "string" &&
    pending.password.length > 0
  ) {
    return pending.password;
  }
  return "";
};

/**
 * Validates that credentials are available for login.
 * Returns true only if both email and password are non-empty strings.
 * This prevents silent failures when credentials are lost during flow.
 */
export const hasValidCredentials = (
  credentials?: LoginRequestDTO
): credentials is LoginRequestDTO => {
  return (
    credentials !== undefined &&
    typeof credentials.email === "string" &&
    credentials.email.length > 0 &&
    typeof credentials.password === "string" &&
    credentials.password.length > 0
  );
};
