/**
 * Utility functions to safely handle potentially undefined values in the auth system
 */

import { AuthEvent } from "../machine/authMachine";
import { LoginRequestDTO, AuthSession, UserProfile } from "../types";

/**
 * To check if an object has specific required properties.
 *
 * SECURITY: Explicitly rejects arrays to prevent treating array data
 * as object properties. In JavaScript, arrays are objects (typeof [] === 'object'),
 * but they should not be treated as key-value stores for session data.
 *
 * Example vulnerability prevented:
 * - Data: ["token", "refresh"]
 * - Without array check: would pass and ["token"] would become accessToken
 * - With array check: correctly rejected
 */
export function hasRequiredProperties<T extends Record<string, unknown>>(
  obj: unknown,
  requiredKeys: (keyof T)[],
): obj is T {
  // Reject non-objects, null, and ARRAYS
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return false;
  }

  const objRecord = obj as Record<string, unknown>;
  return requiredKeys.every((key) => {
    const stringKey = key as string;
    return (
      stringKey in objRecord &&
      objRecord[stringKey] !== undefined &&
      objRecord[stringKey] !== null
    );
  });
}

/**
 * Safely validate LoginRequestDTO
 */
/* moved validator implementations further down to avoid use-before-define issues */
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
  }
  return undefined;
}

/**
 * Safely extract payload from an event
 */
export function safeExtractPayload<T = Record<string, unknown>>(
  event: AuthEvent,
): T | undefined {
  if (
    "payload" in event &&
    typeof event.payload === "object" &&
    event.payload !== null
  ) {
    return event.payload as T;
  }
  return undefined;
}

/**
 * Safely extract and validate login payload from event
 */
export function safeExtractLoginPayload(
  event: AuthEvent,
): LoginRequestDTO | undefined {
  const payload = safeExtractPayload(event);
  if (isValidLoginRequest(payload)) {
    return payload;
  }
  return undefined;
}

/**
 * Safely extract a string value from an event payload
 */
export function safeExtractStringFromPayload(
  event: AuthEvent,
  key: string,
): string | undefined {
  const payload = safeExtractPayload(event);
  if (payload && typeof payload[key] === "string") {
    return payload[key];
  }
  return undefined;
}

/**
 * Safely extract output from an event
 */
export function safeExtractOutput<T = unknown>(
  event: AuthEvent,
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
  fallback: string = "",
): string {
  return typeof value === "string" ? value : fallback;
}

/**
 * Safely validate RegisterRequestDTO
 */
export function isValidRegisterRequest(
  payload: unknown,
): payload is { email: string; password: string } {
  if (typeof payload === "object" && payload !== null) {
    const dto = payload as Record<string, unknown>;
    return (
      typeof dto.email === "string" &&
      dto.email.length > 0 &&
      typeof dto.password === "string" &&
      dto.password.length > 0
    );
  }
  return false;
}

/**
 * Safely validate RequestOtpDTO
 */
export function isValidRequestOtp(
  payload: unknown,
): payload is { email: string } {
  if (typeof payload === "object" && payload !== null) {
    const dto = payload as Record<string, unknown>;
    return typeof dto.email === "string" && dto.email.length > 0;
  }
  return false;
}

/**
 * Safely validate VerifyOtpDTO
 */
export function isValidVerifyOtp(
  payload: unknown,
): payload is { email: string; otp: string } {
  if (typeof payload === "object" && payload !== null) {
    const dto = payload as Record<string, unknown>;
    return (
      typeof dto.email === "string" &&
      dto.email.length > 0 &&
      typeof dto.otp === "string" &&
      dto.otp.length > 0
    );
  }
  return false;
}

/**
 * Safely extract and validate register payload from event
 */
export function safeExtractRegisterPayload(
  event: AuthEvent,
): { email: string; password: string } | undefined {
  const payload = safeExtractPayload(event);
  if (isValidRegisterRequest(payload)) {
    return payload;
  }
  return undefined;
}

/**
 * Safely extract and validate OTP request payload from event
 */
export function safeExtractOtpRequestPayload(
  event: AuthEvent,
): { email: string } | undefined {
  const payload = safeExtractPayload(event);
  if (isValidRequestOtp(payload)) {
    return payload;
  }
  return undefined;
}

/**
 * Safely extract and validate verify OTP payload from event
 */
export function safeExtractVerifyOtpPayload(
  event: AuthEvent,
): { email: string; otp: string } | undefined {
  const payload = safeExtractPayload(event);
  if (isValidVerifyOtp(payload)) {
    return payload;
  }
  return undefined;
}

/**
 * Safely extract new password from RESET_PASSWORD event
 */
export function safeExtractResetPasswordPayload(
  event: AuthEvent,
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
  event: AuthEvent,
): AuthSession | undefined {
  const output = safeExtractOutput(event);
  if (isAuthSession(output)) {
    return output;
  }
  return undefined;
}

/**
 * Safely validate LoginRequestDTO
 */
export function isValidLoginRequest(
  payload: unknown,
): payload is LoginRequestDTO {
  if (typeof payload === "object" && payload !== null) {
    const dto = payload as LoginRequestDTO;
    return typeof dto.email === "string" && typeof dto.password === "string";
  }
  return false;
}

/**
 * Safely validate AuthSession
 */
export function isAuthSession(obj: unknown): obj is AuthSession {
  if (typeof obj !== "object" || obj === null) return false;

  const session = obj as AuthSession;
  return (
    typeof session.accessToken === "string" && session.accessToken.length > 0
  );
}

/**
 * Safely validate UserProfile
 */
export function isUserProfile(obj: unknown): obj is UserProfile {
  if (typeof obj !== "object" || obj === null) return false;

  const profile = obj as UserProfile;
  return typeof profile.id === "string" && typeof profile.email === "string";
}
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
  pending: LoginRequestDTO | undefined,
): string {
  if (pending && typeof pending.password === "string") {
    return pending.password;
  }
  return "";
}

/**
 * Safe navigation function for accessing nested properties
 */
export function safeGetNestedValue<T>(
  obj: unknown,
  path: string,
  defaultValue?: T,
): T | undefined {
  if (typeof obj !== "object" || obj === null) return defaultValue;

  const keys = path.split(".");
  let current: any = obj;

  for (const key of keys) {
    if (current === null || current === undefined || !(key in current)) {
      return defaultValue;
    }
    current = current[key];
  }

  return current as T;
}

/**
 * Safe array access function
 */
export function safeArrayAccess<T>(
  arr: T[] | undefined,
  index: number,
  defaultValue?: T,
): T | undefined {
  if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
    return defaultValue;
  }
  return arr[index];
}
