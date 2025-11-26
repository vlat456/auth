"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasValidCredentials = exports.resolveRegistrationPassword = exports.safeExtractVerifyOtpPayload = exports.safeExtractOtpRequestPayload = exports.safeExtractRegisterPayload = exports.safeExtractLoginPayload = void 0;
exports.safeExtractErrorMessage = safeExtractErrorMessage;
exports.safeExtractPayload = safeExtractPayload;
exports.safeExtractAndValidatePayload = safeExtractAndValidatePayload;
exports.createSafeExtractFunction = createSafeExtractFunction;
exports.safeExtractValue = safeExtractValue;
exports.safeExtractStringFromPayload = safeExtractStringFromPayload;
exports.safeExtractOutput = safeExtractOutput;
exports.safeExtractEmail = safeExtractEmail;
exports.safeExtractOtp = safeExtractOtp;
exports.safeExtractNewPassword = safeExtractNewPassword;
exports.safeGetStringFromContext = safeGetStringFromContext;
exports.isValidRegisterRequest = isValidRegisterRequest;
exports.isValidRequestOtp = isValidRequestOtp;
exports.isValidVerifyOtp = isValidVerifyOtp;
exports.safeExtractResetPasswordPayload = safeExtractResetPasswordPayload;
exports.safeExtractSessionOutput = safeExtractSessionOutput;
exports.isValidLoginRequest = isValidLoginRequest;
exports.isAuthSession = isAuthSession;
exports.isUserProfile = isUserProfile;
exports.safeExtractActionToken = safeExtractActionToken;
exports.safeExtractPasswordFromPending = safeExtractPasswordFromPending;
exports.safeArrayAccess = safeArrayAccess;
const validationSchemas_1 = require("../schemas/validationSchemas");
/**
 * Safely extract an error message from an XState error event.
 * Checks several possible locations where error messages may appear.
 */
function safeExtractErrorMessage(event) {
    try {
        // event.data is commonly used by xstate for promise rejections
        const anyEvent = event;
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
    }
    catch {
        // swallow and return undefined
        console.debug("Error extracting message");
    }
    return undefined;
}
/**
 * Safely extract payload from an event
 */
function safeExtractPayload(event) {
    if ("payload" in event &&
        typeof event.payload === "object" &&
        event.payload !== null) {
        // Instead of unchecked cast, we could add validation based on expected type
        // For now, we'll keep the cast but with better documentation
        return event.payload;
    }
    return undefined;
}
/**
 * Generic function to safely extract and validate payload using a provided schema
 */
function safeExtractAndValidatePayload(event, schema) {
    const rawPayload = safeExtractPayload(event);
    if (rawPayload === undefined) {
        return undefined;
    }
    const result = schema.safeParse(rawPayload);
    if (result.success) {
        return result.data;
    }
    return undefined;
}
/**
 * Factory function to create schema-based extraction functions
 */
function createSafeExtractFunction(schema) {
    return (event) => {
        return safeExtractAndValidatePayload(event, schema);
    };
}
/**
 * Safely extract and validate login payload from event
 */
exports.safeExtractLoginPayload = createSafeExtractFunction(validationSchemas_1.LoginRequestSchema);
/**
 * Safely extract a value from an event payload with type validation
 */
function safeExtractValue(event, key, typeGuard) {
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
function safeExtractStringFromPayload(event, key) {
    return safeExtractValue(event, key, (value) => typeof value === "string");
}
/**
 * Safely extract output from an event
 */
function safeExtractOutput(event) {
    if ("output" in event && event.output !== undefined) {
        return event.output;
    }
    return undefined;
}
/**
 * Safely extract email from event payload
 */
function safeExtractEmail(event) {
    return safeExtractStringFromPayload(event, "email");
}
/**
 * Safely extract OTP from event payload
 */
function safeExtractOtp(event) {
    return safeExtractStringFromPayload(event, "otp");
}
/**
 * Safely extract newPassword from event payload
 */
function safeExtractNewPassword(event) {
    return safeExtractStringFromPayload(event, "newPassword");
}
/**
 * Safely get a string value from context with fallback
 */
function safeGetStringFromContext(value, fallback = "") {
    return typeof value === "string" ? value : fallback;
}
/**
 * Safely validate RegisterRequestDTO using Zod schema as single source of truth
 */
function isValidRegisterRequest(payload) {
    return validationSchemas_1.RegisterRequestSchema.safeParse(payload).success;
}
/**
 * Safely validate RequestOtpDTO using Zod schema as single source of truth
 */
function isValidRequestOtp(payload) {
    return validationSchemas_1.RequestOtpSchema.safeParse(payload).success;
}
/**
 * Safely validate VerifyOtpDTO using Zod schema as single source of truth
 */
function isValidVerifyOtp(payload) {
    return validationSchemas_1.VerifyOtpSchema.safeParse(payload).success;
}
/**
 * Safely extract and validate register payload from event
 */
exports.safeExtractRegisterPayload = createSafeExtractFunction(validationSchemas_1.RegisterRequestSchema);
/**
 * Safely extract and validate OTP request payload from event
 */
exports.safeExtractOtpRequestPayload = createSafeExtractFunction(validationSchemas_1.RequestOtpSchema);
/**
 * Safely extract and validate verify OTP payload from event
 */
exports.safeExtractVerifyOtpPayload = createSafeExtractFunction(validationSchemas_1.VerifyOtpSchema);
/**
 * Safely extract new password from RESET_PASSWORD event
 */
function safeExtractResetPasswordPayload(event) {
    const payload = safeExtractPayload(event);
    if (payload && typeof payload.newPassword === "string") {
        return { newPassword: payload.newPassword };
    }
    return undefined;
}
/**
 * Safely get AuthSession from output with validation
 */
function safeExtractSessionOutput(event) {
    const output = safeExtractOutput(event);
    if (isAuthSession(output)) {
        return output;
    }
    return undefined;
}
/**
 * Safely validate LoginRequestDTO using Zod schema as single source of truth
 */
function isValidLoginRequest(payload) {
    return validationSchemas_1.LoginRequestSchema.safeParse(payload).success;
}
/**
 * Safely validate AuthSession using Zod schema as single source of truth
 */
function isAuthSession(obj) {
    return validationSchemas_1.AuthSessionSchema.safeParse(obj).success;
}
/**
 * Safely validate UserProfile using Zod schema as single source of truth
 */
function isUserProfile(obj) {
    return validationSchemas_1.UserProfileSchema.safeParse(obj).success;
}
/**
 * Safely extract action token from context with validation
 */
function safeExtractActionToken(token) {
    return typeof token === "string" && token.trim().length > 0 ? token : "";
}
/**
 * Safely extract password from pending credentials
 */
function safeExtractPasswordFromPending(pending) {
    if (pending && typeof pending.password === "string") {
        return pending.password;
    }
    return "";
}
/**
 * Safe array access function
 */
function safeArrayAccess(arr, index, defaultValue) {
    if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
        return defaultValue;
    }
    return arr[index];
}
/**
 * Safely extracts password from pending credentials.
 * Returns non-empty password if available, otherwise empty string.
 */
const resolveRegistrationPassword = (pending) => {
    if (pending &&
        typeof pending.password === "string" &&
        pending.password.length > 0) {
        return pending.password;
    }
    return "";
};
exports.resolveRegistrationPassword = resolveRegistrationPassword;
/**
 * Validates that credentials are available for login.
 * Returns true only if both email and password are non-empty strings.
 * This prevents silent failures when credentials are lost during flow.
 */
const hasValidCredentials = (credentials) => {
    return (credentials !== undefined &&
        typeof credentials.email === "string" &&
        credentials.email.length > 0 &&
        typeof credentials.password === "string" &&
        credentials.password.length > 0);
};
exports.hasValidCredentials = hasValidCredentials;
