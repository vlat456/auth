"use strict";
/**
 * Tests for Zod helpers
 */
Object.defineProperty(exports, "__esModule", { value: true });
const zodHelpers_1 = require("./zodHelpers");
const validationSchemas_1 = require("../schemas/validationSchemas");
describe("Zod Helpers", () => {
    describe("validateLoginRequest", () => {
        it("should validate correct login request", () => {
            const result = (0, zodHelpers_1.validateLoginRequest)({
                email: "test@example.com",
                password: "password123",
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.email).toBe("test@example.com");
                expect(result.data.password).toBe("password123");
            }
        });
        it("should fail with invalid email", () => {
            const result = (0, zodHelpers_1.validateLoginRequest)({
                email: "invalid-email",
                password: "password123",
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors).toHaveProperty("email");
            }
        });
        it("should fail with short password", () => {
            const result = (0, zodHelpers_1.validateLoginRequest)({
                email: "test@example.com",
                password: "short",
            });
            expect(result.success).toBe(false);
        });
        it("should fail with missing fields", () => {
            const result = (0, zodHelpers_1.validateLoginRequest)({ email: "test@example.com" });
            expect(result.success).toBe(false);
        });
    });
    describe("validateRegisterRequest", () => {
        it("should validate correct register request", () => {
            const result = (0, zodHelpers_1.validateRegisterRequest)({
                email: "test@example.com",
                password: "password123",
            });
            expect(result.success).toBe(true);
        });
        it("should fail with invalid email", () => {
            const result = (0, zodHelpers_1.validateRegisterRequest)({
                email: "not-an-email",
                password: "password123",
            });
            expect(result.success).toBe(false);
        });
    });
    describe("validateRequestOtp", () => {
        it("should validate correct OTP request", () => {
            const result = (0, zodHelpers_1.validateRequestOtp)({ email: "test@example.com" });
            expect(result.success).toBe(true);
        });
        it("should fail with invalid email", () => {
            const result = (0, zodHelpers_1.validateRequestOtp)({ email: "invalid" });
            expect(result.success).toBe(false);
        });
    });
    describe("validateVerifyOtp", () => {
        it("should validate correct verify OTP request", () => {
            const result = (0, zodHelpers_1.validateVerifyOtp)({
                email: "test@example.com",
                otp: "123456",
            });
            expect(result.success).toBe(true);
        });
        it("should fail with invalid OTP format", () => {
            const result = (0, zodHelpers_1.validateVerifyOtp)({
                email: "test@example.com",
                otp: "abc",
            });
            expect(result.success).toBe(false);
        });
        it("should accept 4-digit OTP", () => {
            const result = (0, zodHelpers_1.validateVerifyOtp)({
                email: "test@example.com",
                otp: "1234",
            });
            expect(result.success).toBe(true);
        });
        it("should accept 5-digit OTP", () => {
            const result = (0, zodHelpers_1.validateVerifyOtp)({
                email: "test@example.com",
                otp: "12345",
            });
            expect(result.success).toBe(true);
        });
        it("should fail with 7-digit OTP", () => {
            const result = (0, zodHelpers_1.validateVerifyOtp)({
                email: "test@example.com",
                otp: "1234567",
            });
            expect(result.success).toBe(false);
        });
    });
    describe("validateCompleteRegistration", () => {
        it("should validate correct registration completion", () => {
            const result = (0, zodHelpers_1.validateCompleteRegistration)({
                actionToken: "verylongactiontoken123456",
                newPassword: "newpassword123",
            });
            expect(result.success).toBe(true);
        });
        it("should fail with short action token", () => {
            const result = (0, zodHelpers_1.validateCompleteRegistration)({
                actionToken: "short",
                newPassword: "newpassword123",
            });
            expect(result.success).toBe(false);
        });
    });
    describe("validateCompletePasswordReset", () => {
        it("should validate correct password reset completion", () => {
            const result = (0, zodHelpers_1.validateCompletePasswordReset)({
                actionToken: "verylongactiontoken123456",
                newPassword: "newpassword123",
            });
            expect(result.success).toBe(true);
        });
    });
    describe("validateAuthSession", () => {
        it("should validate correct auth session", () => {
            const result = (0, zodHelpers_1.validateAuthSession)({
                accessToken: "verylongaccesstoken123456",
                refreshToken: "refreshtoken",
                profile: {
                    id: "user123",
                    email: "test@example.com",
                },
            });
            expect(result.success).toBe(true);
        });
        it("should fail with short access token", () => {
            const result = (0, zodHelpers_1.validateAuthSession)({
                accessToken: "sho", // 3 characters - less than required 5
            });
            expect(result.success).toBe(false);
        });
        it("should fail with missing access token", () => {
            const result = (0, zodHelpers_1.validateAuthSession)({});
            expect(result.success).toBe(false);
        });
        it("should accept session without refresh token", () => {
            const result = (0, zodHelpers_1.validateAuthSession)({
                accessToken: "verylongaccesstoken123456",
            });
            expect(result.success).toBe(true);
        });
    });
    describe("validateUserProfile", () => {
        it("should validate correct user profile", () => {
            const result = (0, zodHelpers_1.validateUserProfile)({
                id: "user123",
                email: "test@example.com",
                name: "John Doe",
            });
            expect(result.success).toBe(true);
        });
        it("should validate profile without optional name", () => {
            const result = (0, zodHelpers_1.validateUserProfile)({
                id: "user123",
                email: "test@example.com",
            });
            expect(result.success).toBe(true);
        });
        it("should fail with invalid email", () => {
            const result = (0, zodHelpers_1.validateUserProfile)({
                id: "user123",
                email: "not-an-email",
            });
            expect(result.success).toBe(false);
        });
        it("should fail with missing id", () => {
            const result = (0, zodHelpers_1.validateUserProfile)({
                email: "test@example.com",
            });
            expect(result.success).toBe(false);
        });
    });
    describe("validateLoginResponse", () => {
        it("should validate correct login response", () => {
            const result = (0, zodHelpers_1.validateLoginResponse)({
                accessToken: "token123",
                refreshToken: "refresh123",
            });
            expect(result.success).toBe(true);
        });
        it("should fail with missing access token", () => {
            const result = (0, zodHelpers_1.validateLoginResponse)({
                refreshToken: "refresh123",
            });
            expect(result.success).toBe(false);
        });
        it("should fail with missing refresh token", () => {
            const result = (0, zodHelpers_1.validateLoginResponse)({
                accessToken: "token123",
            });
            expect(result.success).toBe(false);
        });
    });
    describe("validateRefreshResponseData", () => {
        it("should validate correct refresh response", () => {
            const result = (0, zodHelpers_1.validateRefreshResponseData)({
                accessToken: "newaccesstoken123",
            });
            expect(result.success).toBe(true);
        });
        it("should fail with missing access token", () => {
            const result = (0, zodHelpers_1.validateRefreshResponseData)({});
            expect(result.success).toBe(false);
        });
        it("should fail with empty access token", () => {
            const result = (0, zodHelpers_1.validateRefreshResponseData)({
                accessToken: "",
            });
            expect(result.success).toBe(false);
        });
    });
    describe("formatValidationErrors", () => {
        it("should format single error", () => {
            const errors = { email: ["Invalid email format"] };
            const result = (0, zodHelpers_1.formatValidationErrors)(errors);
            expect(result).toContain("email");
            expect(result).toContain("Invalid email format");
        });
        it("should format multiple errors for same field", () => {
            const errors = { password: ["Too short", "Missing uppercase"] };
            const result = (0, zodHelpers_1.formatValidationErrors)(errors);
            expect(result).toContain("password");
        });
        it("should format multiple fields", () => {
            const errors = {
                email: ["Invalid email"],
                password: ["Too short"],
            };
            const result = (0, zodHelpers_1.formatValidationErrors)(errors);
            expect(result).toContain("email");
            expect(result).toContain("password");
        });
        it("should handle root errors", () => {
            const errors = { root: ["Invalid input"] };
            const result = (0, zodHelpers_1.formatValidationErrors)(errors);
            expect(result).toContain("Input");
        });
    });
    describe("getFirstValidationError", () => {
        it("should return first error from failed validation", () => {
            const result = (0, zodHelpers_1.validateLoginRequest)({ email: "invalid" });
            if (!result.success) {
                const error = (0, zodHelpers_1.getFirstValidationError)(result);
                expect(error).toBeDefined();
            }
        });
        it("should return undefined for successful validation", () => {
            const result = (0, zodHelpers_1.validateLoginRequest)({
                email: "test@example.com",
                password: "password123",
            });
            const error = (0, zodHelpers_1.getFirstValidationError)(result);
            expect(error).toBeUndefined();
        });
        it("should return first available error message", () => {
            const result = (0, zodHelpers_1.validateLoginRequest)({ email: "invalid", password: "a" });
            if (!result.success) {
                const error = (0, zodHelpers_1.getFirstValidationError)(result);
                expect(error).toBeDefined();
                expect(typeof error).toBe("string");
            }
        });
        it("should return undefined when validation fails but errors object is empty", () => {
            // Simulate an edge case where validation result has success: false but errors: {}
            const emptyErrorsResult = {
                success: false,
                errors: {},
            };
            const error = (0, zodHelpers_1.getFirstValidationError)(emptyErrorsResult);
            expect(error).toBeUndefined();
        });
    });
    describe("validateBatch", () => {
        it("should validate array of valid items", () => {
            const items = [
                { email: "test1@example.com", password: "password123" },
                { email: "test2@example.com", password: "password456" },
            ];
            const result = (0, zodHelpers_1.validateBatch)(validationSchemas_1.LoginRequestSchema, items);
            expect(result.valid).toHaveLength(2);
            expect(result.invalid).toHaveLength(0);
        });
        it("should separate valid and invalid items", () => {
            const items = [
                { email: "test@example.com", password: "password123" },
                { email: "invalid-email", password: "password456" },
            ];
            const result = (0, zodHelpers_1.validateBatch)(validationSchemas_1.LoginRequestSchema, items);
            expect(result.valid).toHaveLength(1);
            expect(result.invalid).toHaveLength(1);
        });
        it("should include error details for invalid items", () => {
            const items = [{ email: "invalid-email", password: "short" }];
            const result = (0, zodHelpers_1.validateBatch)(validationSchemas_1.LoginRequestSchema, items);
            expect(result.invalid).toHaveLength(1);
            expect(result.invalid[0]).toHaveProperty("errors");
            expect(result.invalid[0]).toHaveProperty("data");
        });
        it("should handle empty array", () => {
            const items = [];
            const result = (0, zodHelpers_1.validateBatch)(validationSchemas_1.LoginRequestSchema, items);
            expect(result.valid).toHaveLength(0);
            expect(result.invalid).toHaveLength(0);
        });
        it("should handle array of all invalid items", () => {
            const items = [
                { email: "invalid1" },
                { email: "invalid2" },
                { email: "invalid3" },
            ];
            const result = (0, zodHelpers_1.validateBatch)(validationSchemas_1.LoginRequestSchema, items);
            expect(result.valid).toHaveLength(0);
            expect(result.invalid).toHaveLength(3);
        });
    });
});
