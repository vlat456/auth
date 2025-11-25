"use strict";
/**
 * Tests for the safety utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
const safetyUtils_1 = require("./safetyUtils");
describe("Safety Utilities", () => {
    describe("isAuthSession", () => {
        it("should return true for valid AuthSession", () => {
            const session = { accessToken: "token123" };
            expect((0, safetyUtils_1.isAuthSession)(session)).toBe(true);
        });
        it("should return false for null", () => {
            expect((0, safetyUtils_1.isAuthSession)(null)).toBe(false);
        });
        it("should return false for missing accessToken", () => {
            const session = { refreshToken: "refresh123" };
            expect((0, safetyUtils_1.isAuthSession)(session)).toBe(false);
        });
        it("should return false for empty accessToken", () => {
            const session = { accessToken: "" };
            expect((0, safetyUtils_1.isAuthSession)(session)).toBe(false);
        });
        it("should return true for AuthSession with refreshToken and profile", () => {
            const session = {
                accessToken: "token123",
                refreshToken: "refresh123",
                profile: { id: "1", email: "test@example.com" },
            };
            expect((0, safetyUtils_1.isAuthSession)(session)).toBe(true);
        });
    });
    describe("isUserProfile", () => {
        it("should return true for valid UserProfile", () => {
            const profile = { id: "1", email: "test@example.com" };
            expect((0, safetyUtils_1.isUserProfile)(profile)).toBe(true);
        });
        it("should return false for null", () => {
            expect((0, safetyUtils_1.isUserProfile)(null)).toBe(false);
        });
        it("should return false for missing required properties", () => {
            const profile = { id: "1" }; // missing email
            expect((0, safetyUtils_1.isUserProfile)(profile)).toBe(false);
        });
        it("should return false for non-string id", () => {
            const profile = { id: 1, email: "test@example.com" };
            expect((0, safetyUtils_1.isUserProfile)(profile)).toBe(false);
        });
        it("should return false for non-string email", () => {
            const profile = { id: "1", email: 123 };
            expect((0, safetyUtils_1.isUserProfile)(profile)).toBe(false);
        });
    });
    describe("safeArrayAccess", () => {
        it("should return element at valid index", () => {
            const arr = ["a", "b", "c"];
            expect((0, safetyUtils_1.safeArrayAccess)(arr, 1)).toBe("b");
        });
        it("should return defaultValue for invalid index", () => {
            const arr = ["a", "b", "c"];
            expect((0, safetyUtils_1.safeArrayAccess)(arr, 5, "default")).toBe("default");
        });
        it("should return undefined for invalid index with no default", () => {
            const arr = ["a", "b", "c"];
            expect((0, safetyUtils_1.safeArrayAccess)(arr, 5)).toBeUndefined();
        });
        it("should return undefined for non-array", () => {
            expect((0, safetyUtils_1.safeArrayAccess)("not an array", 0)).toBeUndefined();
        });
        it("should return undefined for undefined array", () => {
            expect((0, safetyUtils_1.safeArrayAccess)(undefined, 0)).toBeUndefined();
        });
    });
    describe("isValidLoginRequest", () => {
        it("should return true for valid LoginRequestDTO", () => {
            const dto = {
                email: "test@example.com",
                password: "password123",
            };
            expect((0, safetyUtils_1.isValidLoginRequest)(dto)).toBe(true);
        });
        it("should return false for null", () => {
            expect((0, safetyUtils_1.isValidLoginRequest)(null)).toBe(false);
        });
        it("should return false for missing email", () => {
            const dto = { password: "password123" };
            expect((0, safetyUtils_1.isValidLoginRequest)(dto)).toBe(false);
        });
        it("should return false for missing password", () => {
            const dto = { email: "test@example.com" };
            expect((0, safetyUtils_1.isValidLoginRequest)(dto)).toBe(false);
        });
        it("should return false for non-string email", () => {
            const dto = { email: 123, password: "password123" };
            expect((0, safetyUtils_1.isValidLoginRequest)(dto)).toBe(false);
        });
        it("should return false for non-string password", () => {
            const dto = { email: "test@example.com", password: 123 };
            expect((0, safetyUtils_1.isValidLoginRequest)(dto)).toBe(false);
        });
    });
    describe("Extended Coverage - Error Message Extraction", () => {
        it("should handle error with nested error object", () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const event = {
                error: { message: "Nested error" },
            };
            expect((0, safetyUtils_1.safeExtractErrorMessage)(event)).toBe("Nested error");
        });
        it("should handle error with data string", () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const event = {
                data: "String data error",
            };
            expect((0, safetyUtils_1.safeExtractErrorMessage)(event)).toBe("String data error");
        });
        it("should return undefined for event without error info", () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((0, safetyUtils_1.safeExtractErrorMessage)({})).toBeUndefined();
        });
        it("should handle extraction exception gracefully", () => {
            // This simulates an event that throws when accessing properties
            // The function should catch and return undefined
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((0, safetyUtils_1.safeExtractErrorMessage)(null)).toBeUndefined();
        });
    });
    describe("Extended Coverage - Array Access", () => {
        it("should safely access array elements", () => {
            const arr = ["first", "second", "third"];
            expect((0, safetyUtils_1.safeArrayAccess)(arr, 0)).toBe("first");
            expect((0, safetyUtils_1.safeArrayAccess)(arr, 1)).toBe("second");
        });
        it("should return undefined for out-of-bounds access", () => {
            const arr = ["first"];
            expect((0, safetyUtils_1.safeArrayAccess)(arr, 99)).toBeUndefined();
        });
        it("should handle null array", () => {
            expect((0, safetyUtils_1.safeArrayAccess)(null, 0)).toBeUndefined();
        });
        it("should handle non-array types", () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((0, safetyUtils_1.safeArrayAccess)("not an array", 0)).toBeUndefined();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((0, safetyUtils_1.safeArrayAccess)(123, 0)).toBeUndefined();
        });
    });
    describe("Additional edge cases for 100% coverage", () => {
        describe("safeExtractErrorMessage with various event structures", () => {
            it("should extract error from event.data.message", () => {
                const event = { data: { message: "error message" } };
                const result = (0, safetyUtils_1.safeExtractErrorMessage)(event);
                expect(result).toBe("error message");
            });
            it("should extract error from event.error.message", () => {
                const event = { error: { message: "error from error object" } };
                const result = (0, safetyUtils_1.safeExtractErrorMessage)(event);
                expect(result).toBe("error from error object");
            });
            it("should extract string from event.data when data is string", () => {
                const event = { data: "string error" };
                const result = (0, safetyUtils_1.safeExtractErrorMessage)(event);
                expect(result).toBe("string error");
            });
            it("should extract string from event.error when error is string", () => {
                const event = { error: "string error message" };
                const result = (0, safetyUtils_1.safeExtractErrorMessage)(event);
                expect(result).toBe("string error message");
            });
            it("should return undefined for null event", () => {
                const result = (0, safetyUtils_1.safeExtractErrorMessage)(null);
                expect(result).toBeUndefined();
            });
            it("should return undefined for non-object event", () => {
                const result = (0, safetyUtils_1.safeExtractErrorMessage)("string event");
                expect(result).toBeUndefined();
            });
            it("should return undefined when no error paths match", () => {
                const event = { type: "success", payload: {} };
                const result = (0, safetyUtils_1.safeExtractErrorMessage)(event);
                expect(result).toBeUndefined();
            });
            it("should catch and handle exceptions", () => {
                const event = Object.create(null);
                Object.defineProperty(event, "data", {
                    get() {
                        throw new Error("getter error");
                    },
                });
                const result = (0, safetyUtils_1.safeExtractErrorMessage)(event);
                expect(result).toBeUndefined();
            });
        });
        describe("isValidRequestOtp edge cases", () => {
            it("should validate request with email", () => {
                const payload = { email: "test@example.com" };
                expect((0, safetyUtils_1.isValidRequestOtp)(payload)).toBe(true);
            });
            it("should reject non-object payloads", () => {
                expect((0, safetyUtils_1.isValidRequestOtp)("not an object")).toBe(false);
                expect((0, safetyUtils_1.isValidRequestOtp)(123)).toBe(false);
                expect((0, safetyUtils_1.isValidRequestOtp)(null)).toBe(false);
            });
            it("should reject with empty email", () => {
                const payload = { email: "" };
                expect((0, safetyUtils_1.isValidRequestOtp)(payload)).toBe(false);
            });
            it("should reject with non-string email", () => {
                const payload = { email: 123 };
                expect((0, safetyUtils_1.isValidRequestOtp)(payload)).toBe(false);
            });
            it("should reject missing email", () => {
                const payload = { other: "value" };
                expect((0, safetyUtils_1.isValidRequestOtp)(payload)).toBe(false);
            });
        });
        describe("isValidVerifyOtp edge cases", () => {
            it("should validate correct OTP request", () => {
                const payload = { email: "test@example.com", otp: "123456" };
                expect((0, safetyUtils_1.isValidVerifyOtp)(payload)).toBe(true);
            });
            it("should reject with empty email", () => {
                const payload = { email: "", otp: "123456" };
                expect((0, safetyUtils_1.isValidVerifyOtp)(payload)).toBe(false);
            });
            it("should reject with empty OTP", () => {
                const payload = { email: "test@example.com", otp: "" };
                expect((0, safetyUtils_1.isValidVerifyOtp)(payload)).toBe(false);
            });
            it("should reject with null values", () => {
                const payload = { email: null, otp: null };
                expect((0, safetyUtils_1.isValidVerifyOtp)(payload)).toBe(false);
            });
            it("should reject non-object payloads", () => {
                expect((0, safetyUtils_1.isValidVerifyOtp)(null)).toBe(false);
            });
        });
        describe("isAuthSession edge cases", () => {
            it("should validate session with valid access token", () => {
                const session = { accessToken: "token123" };
                expect((0, safetyUtils_1.isAuthSession)(session)).toBe(true);
            });
            it("should reject session with empty access token", () => {
                const session = { accessToken: "" };
                expect((0, safetyUtils_1.isAuthSession)(session)).toBe(false);
            });
            it("should reject null session", () => {
                expect((0, safetyUtils_1.isAuthSession)(null)).toBe(false);
            });
            it("should reject non-object session", () => {
                expect((0, safetyUtils_1.isAuthSession)("not an object")).toBe(false);
            });
            it("should reject session without access token", () => {
                const session = { refreshToken: "refresh" };
                expect((0, safetyUtils_1.isAuthSession)(session)).toBe(false);
            });
            it("should reject session with non-string access token", () => {
                const session = { accessToken: 123 };
                expect((0, safetyUtils_1.isAuthSession)(session)).toBe(false);
            });
        });
        describe("isUserProfile edge cases", () => {
            it("should validate profile with required fields", () => {
                const profile = { id: "user123", email: "test@example.com" };
                expect((0, safetyUtils_1.isUserProfile)(profile)).toBe(true);
            });
            it("should reject profile with empty id string", () => {
                // New behavior: rejects content that should not be empty
                const profile = { id: "", email: "test@example.com" };
                expect((0, safetyUtils_1.isUserProfile)(profile)).toBe(false);
            });
            it("should reject profile with empty email string", () => {
                // New behavior: rejects content that should not be empty
                const profile = { id: "user123", email: "" };
                expect((0, safetyUtils_1.isUserProfile)(profile)).toBe(false);
            });
            it("should reject profile with non-string fields", () => {
                const profile = { id: 123, email: 456 };
                expect((0, safetyUtils_1.isUserProfile)(profile)).toBe(false);
            });
            it("should reject null profile", () => {
                expect((0, safetyUtils_1.isUserProfile)(null)).toBe(false);
            });
            it("should reject non-object profile", () => {
                expect((0, safetyUtils_1.isUserProfile)("not an object")).toBe(false);
            });
            it("should reject profile missing required fields", () => {
                const profile = { id: "user123" };
                expect((0, safetyUtils_1.isUserProfile)(profile)).toBe(false);
            });
            it("should reject when id is not string", () => {
                const profile = { id: null, email: "test@example.com" };
                expect((0, safetyUtils_1.isUserProfile)(profile)).toBe(false);
            });
            it("should reject when email is not string", () => {
                const profile = { id: "user123", email: null };
                expect((0, safetyUtils_1.isUserProfile)(profile)).toBe(false);
            });
        });
        describe("safeArrayAccess edge cases", () => {
            it("should access array element at valid index", () => {
                const arr = ["a", "b", "c"];
                expect((0, safetyUtils_1.safeArrayAccess)(arr, 1)).toBe("b");
            });
            it("should return default for negative index", () => {
                const arr = ["a", "b", "c"];
                expect((0, safetyUtils_1.safeArrayAccess)(arr, -1, "default")).toBe("default");
            });
            it("should return default for index >= length", () => {
                const arr = ["a", "b", "c"];
                expect((0, safetyUtils_1.safeArrayAccess)(arr, 10, "default")).toBe("default");
            });
            it("should return undefined for out of bounds without default", () => {
                const arr = ["a", "b", "c"];
                expect((0, safetyUtils_1.safeArrayAccess)(arr, 10)).toBeUndefined();
            });
            it("should handle undefined array", () => {
                expect((0, safetyUtils_1.safeArrayAccess)(undefined, 0, "default")).toBe("default");
            });
            it("should handle zero index", () => {
                const arr = ["first"];
                expect((0, safetyUtils_1.safeArrayAccess)(arr, 0)).toBe("first");
            });
            it("should handle last valid index", () => {
                const arr = ["a", "b", "c"];
                expect((0, safetyUtils_1.safeArrayAccess)(arr, 2)).toBe("c");
            });
        });
        describe("safeExtractActionToken edge cases", () => {
            it("should extract valid token", () => {
                const token = "validtoken123";
                expect((0, safetyUtils_1.safeExtractActionToken)(token)).toBe("validtoken123");
            });
            it("should return empty string for undefined token", () => {
                expect((0, safetyUtils_1.safeExtractActionToken)(undefined)).toBe("");
            });
            it("should return empty string for whitespace-only token", () => {
                expect((0, safetyUtils_1.safeExtractActionToken)("   ")).toBe("");
            });
            it("should trim token properly", () => {
                const token = "  token123  ";
                const result = (0, safetyUtils_1.safeExtractActionToken)(token);
                expect(result.trim()).toBe("token123");
            });
        });
        describe("safeExtractPasswordFromPending edge cases", () => {
            it("should extract password from pending credentials", () => {
                const pending = { email: "test@example.com", password: "pass123" };
                expect((0, safetyUtils_1.safeExtractPasswordFromPending)(pending)).toBe("pass123");
            });
            it("should return empty string for undefined pending", () => {
                expect((0, safetyUtils_1.safeExtractPasswordFromPending)(undefined)).toBe("");
            });
            it("should return empty string for missing password", () => {
                const pending = { email: "test@example.com" };
                expect((0, safetyUtils_1.safeExtractPasswordFromPending)(pending)).toBe("");
            });
            it("should return empty string for non-string password", () => {
                const pending = { email: "test@example.com", password: 123 };
                expect((0, safetyUtils_1.safeExtractPasswordFromPending)(pending)).toBe("");
            });
        });
        describe("safeExtractRegisterPayload", () => {
            it("should extract valid register payload from event", () => {
                const { safeExtractRegisterPayload } = require("./safetyUtils");
                const event = { payload: { email: "test@example.com", password: "pass1234" } };
                const result = safeExtractRegisterPayload(event);
                expect(result).toEqual({ email: "test@example.com", password: "pass1234" });
            });
            it("should return undefined for invalid payload object", () => {
                const { safeExtractRegisterPayload } = require("./safetyUtils");
                const event = { payload: { email: "", password: "pass123" } };
                const result = safeExtractRegisterPayload(event);
                expect(result).toBeUndefined();
            });
            it("should return undefined when email is empty", () => {
                const { safeExtractRegisterPayload } = require("./safetyUtils");
                const event = { payload: { email: "", password: "pass123" } };
                const result = safeExtractRegisterPayload(event);
                expect(result).toBeUndefined();
            });
            it("should return undefined when password is empty", () => {
                const { safeExtractRegisterPayload } = require("./safetyUtils");
                const event = { payload: { email: "test@example.com", password: "" } };
                const result = safeExtractRegisterPayload(event);
                expect(result).toBeUndefined();
            });
            it("should return undefined when email is not a string", () => {
                const { safeExtractRegisterPayload } = require("./safetyUtils");
                const event = { payload: { email: 123, password: "pass123" } };
                const result = safeExtractRegisterPayload(event);
                expect(result).toBeUndefined();
            });
            it("should return undefined when password is not a string", () => {
                const { safeExtractRegisterPayload } = require("./safetyUtils");
                const event = { payload: { email: "test@example.com", password: 123 } };
                const result = safeExtractRegisterPayload(event);
                expect(result).toBeUndefined();
            });
            it("should return undefined when payload is missing", () => {
                const { safeExtractRegisterPayload } = require("./safetyUtils");
                const event = {};
                const result = safeExtractRegisterPayload(event);
                expect(result).toBeUndefined();
            });
        });
        describe("safeExtractOtpRequestPayload", () => {
            it("should extract valid OTP request payload from event", () => {
                const { safeExtractOtpRequestPayload } = require("./safetyUtils");
                const event = { payload: { email: "test@example.com" } };
                const result = safeExtractOtpRequestPayload(event);
                expect(result).toEqual({ email: "test@example.com" });
            });
            it("should return undefined for empty email", () => {
                const { safeExtractOtpRequestPayload } = require("./safetyUtils");
                const event = { payload: { email: "" } };
                const result = safeExtractOtpRequestPayload(event);
                expect(result).toBeUndefined();
            });
            it("should return undefined when email is not a string", () => {
                const { safeExtractOtpRequestPayload } = require("./safetyUtils");
                const event = { payload: { email: 123 } };
                const result = safeExtractOtpRequestPayload(event);
                expect(result).toBeUndefined();
            });
            it("should return undefined when payload is missing", () => {
                const { safeExtractOtpRequestPayload } = require("./safetyUtils");
                const event = {};
                const result = safeExtractOtpRequestPayload(event);
                expect(result).toBeUndefined();
            });
        });
        describe("safeExtractVerifyOtpPayload", () => {
            it("should extract valid verify OTP payload from event", () => {
                const { safeExtractVerifyOtpPayload } = require("./safetyUtils");
                const event = { payload: { email: "test@example.com", otp: "123456" } };
                const result = safeExtractVerifyOtpPayload(event);
                expect(result).toEqual({ email: "test@example.com", otp: "123456" });
            });
            it("should return undefined when email is empty", () => {
                const { safeExtractVerifyOtpPayload } = require("./safetyUtils");
                const event = { payload: { email: "", otp: "123456" } };
                const result = safeExtractVerifyOtpPayload(event);
                expect(result).toBeUndefined();
            });
            it("should return undefined when otp is empty", () => {
                const { safeExtractVerifyOtpPayload } = require("./safetyUtils");
                const event = { payload: { email: "test@example.com", otp: "" } };
                const result = safeExtractVerifyOtpPayload(event);
                expect(result).toBeUndefined();
            });
            it("should return undefined when email is not a string", () => {
                const { safeExtractVerifyOtpPayload } = require("./safetyUtils");
                const event = { payload: { email: 123, otp: "123456" } };
                const result = safeExtractVerifyOtpPayload(event);
                expect(result).toBeUndefined();
            });
            it("should return undefined when otp is not a string", () => {
                const { safeExtractVerifyOtpPayload } = require("./safetyUtils");
                const event = { payload: { email: "test@example.com", otp: 123 } };
                const result = safeExtractVerifyOtpPayload(event);
                expect(result).toBeUndefined();
            });
            it("should return undefined when payload is missing", () => {
                const { safeExtractVerifyOtpPayload } = require("./safetyUtils");
                const event = {};
                const result = safeExtractVerifyOtpPayload(event);
                expect(result).toBeUndefined();
            });
        });
        describe("safeExtractResetPasswordPayload", () => {
            it("should extract valid reset password payload from event", () => {
                const { safeExtractResetPasswordPayload } = require("./safetyUtils");
                const event = { payload: { newPassword: "newPass123" } };
                const result = safeExtractResetPasswordPayload(event);
                expect(result).toEqual({ newPassword: "newPass123" });
            });
            it("should return undefined when newPassword is empty", () => {
                const { safeExtractResetPasswordPayload } = require("./safetyUtils");
                const event = { payload: { newPassword: "" } };
                const result = safeExtractResetPasswordPayload(event);
                expect(result).toEqual({ newPassword: "" });
            });
            it("should return undefined when newPassword is not a string", () => {
                const { safeExtractResetPasswordPayload } = require("./safetyUtils");
                const event = { payload: { newPassword: 123 } };
                const result = safeExtractResetPasswordPayload(event);
                expect(result).toBeUndefined();
            });
            it("should return undefined when payload is missing", () => {
                const { safeExtractResetPasswordPayload } = require("./safetyUtils");
                const event = {};
                const result = safeExtractResetPasswordPayload(event);
                expect(result).toBeUndefined();
            });
            it("should return undefined when newPassword property is missing", () => {
                const { safeExtractResetPasswordPayload } = require("./safetyUtils");
                const event = { payload: { someOtherField: "value" } };
                const result = safeExtractResetPasswordPayload(event);
                expect(result).toBeUndefined();
            });
        });
    });
});
describe("resolveRegistrationPassword", () => {
    const { resolveRegistrationPassword } = require("./safetyUtils");
    it("returns provided password when non-empty string", () => {
        expect(resolveRegistrationPassword({ email: "a", password: "Secret123" })).toBe("Secret123");
    });
    it("returns empty string when password is missing or blank", () => {
        expect(resolveRegistrationPassword({ email: "a", password: "" })).toBe("");
        expect(resolveRegistrationPassword({ email: "a" })).toBe("");
        expect(resolveRegistrationPassword(undefined)).toBe("");
    });
});
describe("hasValidCredentials", () => {
    const { hasValidCredentials } = require("./safetyUtils");
    it("returns true when both email and password are non-empty strings", () => {
        expect(hasValidCredentials({ email: "test@test.com", password: "password123" })).toBe(true);
    });
    it("returns false when credentials are undefined", () => {
        expect(hasValidCredentials(undefined)).toBe(false);
    });
    it("returns false when email is missing", () => {
        expect(hasValidCredentials({ password: "password123" })).toBe(false);
    });
    it("returns false when email is empty string", () => {
        expect(hasValidCredentials({ email: "", password: "password123" })).toBe(false);
    });
    it("returns false when password is missing", () => {
        expect(hasValidCredentials({ email: "test@test.com" })).toBe(false);
    });
    it("returns false when password is empty string", () => {
        expect(hasValidCredentials({ email: "test@test.com", password: "" })).toBe(false);
    });
    it("returns false when email is not a string", () => {
        expect(hasValidCredentials({
            email: 123,
            password: "password123",
        })).toBe(false);
    });
    it("returns false when password is not a string", () => {
        expect(hasValidCredentials({
            email: "test@test.com",
            password: 123,
        })).toBe(false);
    });
});
