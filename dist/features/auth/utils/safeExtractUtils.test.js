"use strict";
/**
 * Additional tests for safe extract utilities to improve coverage
 */
Object.defineProperty(exports, "__esModule", { value: true });
const safetyUtils_1 = require("../utils/safetyUtils");
describe("Safe Extract Utilities", () => {
    describe("safeExtractPayload", () => {
        it("should extract valid payload", () => {
            const event = { type: "TEST", payload: { email: "test@example.com" } };
            const result = (0, safetyUtils_1.safeExtractPayload)(event);
            expect(result).toEqual({ email: "test@example.com" });
        });
        it("should return undefined when no payload", () => {
            const event = { type: "CHECK_SESSION" };
            const result = (0, safetyUtils_1.safeExtractPayload)(event);
            expect(result).toBeUndefined();
        });
        it("should return undefined when payload is not an object", () => {
            const event = { type: "LOGIN", payload: "not an object" };
            const result = (0, safetyUtils_1.safeExtractPayload)(event);
            expect(result).toBeUndefined();
        });
        it("should return undefined when payload is null", () => {
            const event = { type: "LOGIN", payload: null };
            const result = (0, safetyUtils_1.safeExtractPayload)(event);
            expect(result).toBeUndefined();
        });
    });
    describe("safeExtractStringFromPayload", () => {
        it("should extract valid string from payload", () => {
            const event = { type: "LOGIN", payload: { email: "test@example.com" } };
            const result = (0, safetyUtils_1.safeExtractStringFromPayload)(event, "email");
            expect(result).toBe("test@example.com");
        });
        it("should return undefined when key not in payload", () => {
            const event = { type: "LOGIN", payload: { email: "test@example.com" } };
            const result = (0, safetyUtils_1.safeExtractStringFromPayload)(event, "password");
            expect(result).toBeUndefined();
        });
        it("should return undefined when value is not string", () => {
            const event = { type: "LOGIN", payload: { email: 123 } };
            const result = (0, safetyUtils_1.safeExtractStringFromPayload)(event, "email");
            expect(result).toBeUndefined();
        });
        it("should return undefined when no payload", () => {
            const event = { type: "CHECK_SESSION" };
            const result = (0, safetyUtils_1.safeExtractStringFromPayload)(event, "email");
            expect(result).toBeUndefined();
        });
    });
    describe("safeExtractOutput", () => {
        it("should extract valid output", () => {
            const event = { type: "LOGIN", output: { result: "success" } };
            const result = (0, safetyUtils_1.safeExtractOutput)(event);
            expect(result).toEqual({ result: "success" });
        });
        it("should return undefined when no output", () => {
            const event = { type: "CHECK_SESSION" };
            const result = (0, safetyUtils_1.safeExtractOutput)(event);
            expect(result).toBeUndefined();
        });
        it("should return output when it's null", () => {
            const event = { type: "LOGIN", output: null };
            const result = (0, safetyUtils_1.safeExtractOutput)(event);
            expect(result).toBeNull();
        });
    });
    describe("safeExtractEmail", () => {
        it("should extract email from event payload", () => {
            const event = { type: "LOGIN", payload: { email: "test@example.com", password: "pass" } };
            const result = (0, safetyUtils_1.safeExtractEmail)(event);
            expect(result).toBe("test@example.com");
        });
        it("should return undefined when no email in payload", () => {
            const event = { type: "LOGIN", payload: { password: "pass" } };
            const result = (0, safetyUtils_1.safeExtractEmail)(event);
            expect(result).toBeUndefined();
        });
    });
    describe("safeExtractOtp", () => {
        it("should extract OTP from event payload", () => {
            const event = { type: "VERIFY_OTP", payload: { otp: "123456" } };
            const result = (0, safetyUtils_1.safeExtractOtp)(event);
            expect(result).toBe("123456");
        });
        it("should return undefined when no otp in payload", () => {
            const event = { type: "VERIFY_OTP", payload: { email: "test@example.com" } };
            const result = (0, safetyUtils_1.safeExtractOtp)(event);
            expect(result).toBeUndefined();
        });
    });
    describe("safeExtractNewPassword", () => {
        it("should extract newPassword from event payload", () => {
            const event = { type: "RESET_PASSWORD", payload: { newPassword: "newPass123" } };
            const result = (0, safetyUtils_1.safeExtractNewPassword)(event);
            expect(result).toBe("newPass123");
        });
        it("should return undefined when no newPassword in payload", () => {
            const event = { type: "RESET_PASSWORD", payload: { email: "test@example.com" } };
            const result = (0, safetyUtils_1.safeExtractNewPassword)(event);
            expect(result).toBeUndefined();
        });
    });
});
