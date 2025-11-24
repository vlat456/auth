/**
 * Utility functions to safely handle potentially undefined values in the auth system
 */

import { AuthEvent, AuthContext } from "../machine/authMachine";
import { LoginRequestDTO, AuthSession, UserProfile } from "../types";

/**
 * To check if an object has specific required properties
 */
export function hasRequiredProperties<T extends Record<string, unknown>>(
  obj: unknown,
  requiredKeys: (keyof T)[]
): obj is T {
  if (typeof obj !== 'object' || obj === null) return false;

  const objRecord = obj as Record<string, unknown>;
  return requiredKeys.every(key => {
    const stringKey = key as string;
    return stringKey in objRecord && objRecord[stringKey] !== undefined && objRecord[stringKey] !== null;
  });
}

/**
 * Safely extract payload from an event
 */
export function safeExtractPayload<T = Record<string, unknown>>(event: AuthEvent): T | undefined {
  if ('payload' in event && typeof event.payload === 'object' && event.payload !== null) {
    return event.payload as T;
  }
  return undefined;
}

/**
 * Safely extract a string value from an event payload
 */
export function safeExtractStringFromPayload(event: AuthEvent, key: string): string | undefined {
  const payload = safeExtractPayload(event);
  if (payload && typeof payload[key] === 'string') {
    return payload[key] as string;
  }
  return undefined;
}

/**
 * Safely extract output from an event
 */
export function safeExtractOutput<T = unknown>(event: AuthEvent): T | undefined {
  if ('output' in event && event.output !== undefined) {
    return event.output as T;
  }
  return undefined;
}

/**
 * Safely extract email from event payload
 */
export function safeExtractEmail(event: AuthEvent): string | undefined {
  return safeExtractStringFromPayload(event, 'email');
}

/**
 * Safely extract OTP from event payload
 */
export function safeExtractOtp(event: AuthEvent): string | undefined {
  return safeExtractStringFromPayload(event, 'otp');
}

/**
 * Safely extract newPassword from event payload
 */
export function safeExtractNewPassword(event: AuthEvent): string | undefined {
  return safeExtractStringFromPayload(event, 'newPassword');
}

/**
 * Safely get a string value from context with fallback
 */
export function safeGetStringFromContext(value: string | undefined, fallback: string = ""): string {
  return typeof value === 'string' ? value : fallback;
}

/**
 * Safely validate LoginRequestDTO
 */
export function isValidLoginRequest(payload: unknown): payload is LoginRequestDTO {
  if (typeof payload === 'object' && payload !== null) {
    const dto = payload as LoginRequestDTO;
    return typeof dto.email === 'string' && typeof dto.password === 'string';
  }
  return false;
}

/**
 * Safely validate AuthSession
 */
export function isAuthSession(obj: unknown): obj is AuthSession {
  if (typeof obj !== 'object' || obj === null) return false;

  const session = obj as AuthSession;
  return typeof session.accessToken === 'string' &&
         session.accessToken.length > 0;
}

/**
 * Safely validate UserProfile
 */
export function isUserProfile(obj: unknown): obj is UserProfile {
  if (typeof obj !== 'object' || obj === null) return false;

  const profile = obj as UserProfile;
  return typeof profile.id === 'string' &&
         typeof profile.email === 'string';
}

/**
 * Safely extract action token from context with validation
 */
export function safeExtractActionToken(token: string | undefined): string {
  return typeof token === 'string' && token.trim().length > 0 ? token : "";
}

/**
 * Safely extract password from pending credentials
 */
export function safeExtractPasswordFromPending(pending: LoginRequestDTO | undefined): string {
  if (pending && typeof pending.password === 'string') {
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
  defaultValue?: T
): T | undefined {
  if (typeof obj !== 'object' || obj === null) return defaultValue;

  const keys = path.split('.');
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
  defaultValue?: T
): T | undefined {
  if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
    return defaultValue;
  }
  return arr[index];
}