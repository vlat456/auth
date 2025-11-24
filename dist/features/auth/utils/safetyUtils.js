"use strict";
/**
 * Utility functions to safely handle potentially undefined values in the auth system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasRequiredProperties = hasRequiredProperties;
exports.safeExtractPayload = safeExtractPayload;
exports.safeExtractStringFromPayload = safeExtractStringFromPayload;
exports.safeExtractOutput = safeExtractOutput;
exports.safeExtractEmail = safeExtractEmail;
exports.safeExtractOtp = safeExtractOtp;
exports.safeExtractNewPassword = safeExtractNewPassword;
exports.safeGetStringFromContext = safeGetStringFromContext;
exports.isValidLoginRequest = isValidLoginRequest;
exports.isAuthSession = isAuthSession;
exports.isUserProfile = isUserProfile;
exports.safeExtractActionToken = safeExtractActionToken;
exports.safeExtractPasswordFromPending = safeExtractPasswordFromPending;
exports.safeGetNestedValue = safeGetNestedValue;
exports.safeArrayAccess = safeArrayAccess;
/**
 * To check if an object has specific required properties
 */
function hasRequiredProperties(obj, requiredKeys) {
    if (typeof obj !== 'object' || obj === null)
        return false;
    const objRecord = obj;
    return requiredKeys.every(key => {
        const stringKey = key;
        return stringKey in objRecord && objRecord[stringKey] !== undefined && objRecord[stringKey] !== null;
    });
}
/**
 * Safely extract payload from an event
 */
function safeExtractPayload(event) {
    if ('payload' in event && typeof event.payload === 'object' && event.payload !== null) {
        return event.payload;
    }
    return undefined;
}
/**
 * Safely extract a string value from an event payload
 */
function safeExtractStringFromPayload(event, key) {
    const payload = safeExtractPayload(event);
    if (payload && typeof payload[key] === 'string') {
        return payload[key];
    }
    return undefined;
}
/**
 * Safely extract output from an event
 */
function safeExtractOutput(event) {
    if ('output' in event && event.output !== undefined) {
        return event.output;
    }
    return undefined;
}
/**
 * Safely extract email from event payload
 */
function safeExtractEmail(event) {
    return safeExtractStringFromPayload(event, 'email');
}
/**
 * Safely extract OTP from event payload
 */
function safeExtractOtp(event) {
    return safeExtractStringFromPayload(event, 'otp');
}
/**
 * Safely extract newPassword from event payload
 */
function safeExtractNewPassword(event) {
    return safeExtractStringFromPayload(event, 'newPassword');
}
/**
 * Safely get a string value from context with fallback
 */
function safeGetStringFromContext(value, fallback = "") {
    return typeof value === 'string' ? value : fallback;
}
/**
 * Safely validate LoginRequestDTO
 */
function isValidLoginRequest(payload) {
    if (typeof payload === 'object' && payload !== null) {
        const dto = payload;
        return typeof dto.email === 'string' && typeof dto.password === 'string';
    }
    return false;
}
/**
 * Safely validate AuthSession
 */
function isAuthSession(obj) {
    if (typeof obj !== 'object' || obj === null)
        return false;
    const session = obj;
    return typeof session.accessToken === 'string' &&
        session.accessToken.length > 0;
}
/**
 * Safely validate UserProfile
 */
function isUserProfile(obj) {
    if (typeof obj !== 'object' || obj === null)
        return false;
    const profile = obj;
    return typeof profile.id === 'string' &&
        typeof profile.email === 'string';
}
/**
 * Safely extract action token from context with validation
 */
function safeExtractActionToken(token) {
    return typeof token === 'string' && token.trim().length > 0 ? token : "";
}
/**
 * Safely extract password from pending credentials
 */
function safeExtractPasswordFromPending(pending) {
    if (pending && typeof pending.password === 'string') {
        return pending.password;
    }
    return "";
}
/**
 * Safe navigation function for accessing nested properties
 */
function safeGetNestedValue(obj, path, defaultValue) {
    if (typeof obj !== 'object' || obj === null)
        return defaultValue;
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
        if (current === null || current === undefined || !(key in current)) {
            return defaultValue;
        }
        current = current[key];
    }
    return current;
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
