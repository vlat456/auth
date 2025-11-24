/**
 * Utility functions to safely handle potentially undefined values in the auth system
 */
import { AuthEvent } from "../machine/authMachine";
import { LoginRequestDTO, AuthSession, UserProfile } from "../types";
/**
 * To check if an object has specific required properties
 */
export declare function hasRequiredProperties<T extends Record<string, unknown>>(obj: unknown, requiredKeys: (keyof T)[]): obj is T;
/**
 * Safely extract payload from an event
 */
export declare function safeExtractPayload<T = Record<string, unknown>>(event: AuthEvent): T | undefined;
/**
 * Safely extract a string value from an event payload
 */
export declare function safeExtractStringFromPayload(event: AuthEvent, key: string): string | undefined;
/**
 * Safely extract output from an event
 */
export declare function safeExtractOutput<T = unknown>(event: AuthEvent): T | undefined;
/**
 * Safely extract email from event payload
 */
export declare function safeExtractEmail(event: AuthEvent): string | undefined;
/**
 * Safely extract OTP from event payload
 */
export declare function safeExtractOtp(event: AuthEvent): string | undefined;
/**
 * Safely extract newPassword from event payload
 */
export declare function safeExtractNewPassword(event: AuthEvent): string | undefined;
/**
 * Safely get a string value from context with fallback
 */
export declare function safeGetStringFromContext(value: string | undefined, fallback?: string): string;
/**
 * Safely validate LoginRequestDTO
 */
export declare function isValidLoginRequest(payload: unknown): payload is LoginRequestDTO;
/**
 * Safely validate AuthSession
 */
export declare function isAuthSession(obj: unknown): obj is AuthSession;
/**
 * Safely validate UserProfile
 */
export declare function isUserProfile(obj: unknown): obj is UserProfile;
/**
 * Safely extract action token from context with validation
 */
export declare function safeExtractActionToken(token: string | undefined): string;
/**
 * Safely extract password from pending credentials
 */
export declare function safeExtractPasswordFromPending(pending: LoginRequestDTO | undefined): string;
/**
 * Safe navigation function for accessing nested properties
 */
export declare function safeGetNestedValue<T>(obj: unknown, path: string, defaultValue?: T): T | undefined;
/**
 * Safe array access function
 */
export declare function safeArrayAccess<T>(arr: T[] | undefined, index: number, defaultValue?: T): T | undefined;
