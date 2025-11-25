import { AuthEvent } from "../machine/authMachine";
import { LoginRequestDTO, AuthSession, UserProfile } from "../types";
import type { ZodSchema } from "zod";
/**
 * Safely extract an error message from an XState error event.
 * Checks several possible locations where error messages may appear.
 */
export declare function safeExtractErrorMessage(event: AuthEvent): string | undefined;
/**
 * Safely extract payload from an event
 */
export declare function safeExtractPayload<T = Record<string, unknown>>(event: AuthEvent): T | undefined;
/**
 * Generic function to safely extract and validate payload using a provided schema
 */
export declare function safeExtractAndValidatePayload<T>(event: AuthEvent, schema: ZodSchema<T>): T | undefined;
/**
 * Factory function to create schema-based extraction functions
 */
export declare function createSafeExtractFunction<T>(schema: ZodSchema<T>): (event: AuthEvent) => T | undefined;
/**
 * Safely extract and validate login payload from event
 */
export declare const safeExtractLoginPayload: (event: AuthEvent) => {
    email: string;
    password: string;
} | undefined;
/**
 * Safely extract a value from an event payload with type validation
 */
export declare function safeExtractValue<T>(event: AuthEvent, key: string, typeGuard: (value: unknown) => value is T): T | undefined;
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
 * Safely validate RegisterRequestDTO using Zod schema as single source of truth
 */
export declare function isValidRegisterRequest(payload: unknown): payload is {
    email: string;
    password: string;
};
/**
 * Safely validate RequestOtpDTO using Zod schema as single source of truth
 */
export declare function isValidRequestOtp(payload: unknown): payload is {
    email: string;
};
/**
 * Safely validate VerifyOtpDTO using Zod schema as single source of truth
 */
export declare function isValidVerifyOtp(payload: unknown): payload is {
    email: string;
    otp: string;
};
/**
 * Safely extract and validate register payload from event
 */
export declare const safeExtractRegisterPayload: (event: AuthEvent) => {
    email: string;
    password: string;
} | undefined;
/**
 * Safely extract and validate OTP request payload from event
 */
export declare const safeExtractOtpRequestPayload: (event: AuthEvent) => {
    email: string;
} | undefined;
/**
 * Safely extract and validate verify OTP payload from event
 */
export declare const safeExtractVerifyOtpPayload: (event: AuthEvent) => {
    email: string;
    otp: string;
} | undefined;
/**
 * Safely extract new password from RESET_PASSWORD event
 */
export declare function safeExtractResetPasswordPayload(event: AuthEvent): {
    newPassword: string;
} | undefined;
/**
 * Safely get AuthSession from output with validation
 */
export declare function safeExtractSessionOutput(event: AuthEvent): AuthSession | undefined;
/**
 * Safely validate LoginRequestDTO using Zod schema as single source of truth
 */
export declare function isValidLoginRequest(payload: unknown): payload is LoginRequestDTO;
/**
 * Safely validate AuthSession using Zod schema as single source of truth
 */
export declare function isAuthSession(obj: unknown): obj is AuthSession;
/**
 * Safely validate UserProfile using Zod schema as single source of truth
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
 * Safe array access function
 */
export declare function safeArrayAccess<T>(arr: T[] | undefined, index: number, defaultValue?: T): T | undefined;
/**
 * Safely extracts password from pending credentials.
 * Returns non-empty password if available, otherwise empty string.
 */
export declare const resolveRegistrationPassword: (pending?: LoginRequestDTO) => string;
/**
 * Validates that credentials are available for login.
 * Returns true only if both email and password are non-empty strings.
 * This prevents silent failures when credentials are lost during flow.
 */
export declare const hasValidCredentials: (credentials?: LoginRequestDTO) => credentials is LoginRequestDTO;
