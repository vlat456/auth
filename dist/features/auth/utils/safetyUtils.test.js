"use strict";
/**
 * Tests for the safety utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
const safetyUtils_1 = require("./safetyUtils");
describe("Safety Utilities", () => {
    describe("hasRequiredProperties", () => {
        it("should return true when object has all required properties", () => {
            const obj = { email: "test@example.com", password: "password123" };
            const result = (0, safetyUtils_1.hasRequiredProperties)(obj, ['email', 'password']);
            expect(result).toBe(true);
        });
        it("should return false when object is null", () => {
            const result = (0, safetyUtils_1.hasRequiredProperties)(null, ['email', 'password']);
            expect(result).toBe(false);
        });
        it("should return false when object is not an object", () => {
            const result = (0, safetyUtils_1.hasRequiredProperties)("not an object", ['email', 'password']);
            expect(result).toBe(false);
        });
        it("should return false when object is missing a required property", () => {
            const obj = { email: "test@example.com" }; // missing password
            const result = (0, safetyUtils_1.hasRequiredProperties)(obj, ['email', 'password']);
            expect(result).toBe(false);
        });
        it("should return false when object has required property but it's null", () => {
            const obj = { email: null, password: "password123" };
            const result = (0, safetyUtils_1.hasRequiredProperties)(obj, ['email', 'password']);
            expect(result).toBe(false);
        });
        it("should return false when object has required property but it's undefined", () => {
            const obj = { email: undefined, password: "password123" };
            const result = (0, safetyUtils_1.hasRequiredProperties)(obj, ['email', 'password']);
            expect(result).toBe(false);
        });
    });
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
                profile: { id: "1", email: "test@example.com" }
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
    describe("safeGetNestedValue", () => {
        it("should return nested value when path exists", () => {
            const obj = { user: { profile: { name: "John" } } };
            const result = (0, safetyUtils_1.safeGetNestedValue)(obj, "user.profile.name");
            expect(result).toBe("John");
        });
        it("should return defaultValue when path doesn't exist", () => {
            const obj = { user: { profile: { name: "John" } } };
            const result = (0, safetyUtils_1.safeGetNestedValue)(obj, "user.profile.age", "unknown");
            expect(result).toBe("unknown");
        });
        it("should return undefined when path doesn't exist and no defaultValue", () => {
            const obj = { user: { profile: { name: "John" } } };
            const result = (0, safetyUtils_1.safeGetNestedValue)(obj, "user.profile.age");
            expect(result).toBeUndefined();
        });
        it("should return undefined for null object", () => {
            const result = (0, safetyUtils_1.safeGetNestedValue)(null, "user.profile.name");
            expect(result).toBeUndefined();
        });
        it("should return undefined for non-object", () => {
            const result = (0, safetyUtils_1.safeGetNestedValue)("not an object", "user.profile.name");
            expect(result).toBeUndefined();
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
            const dto = { email: "test@example.com", password: "password123" };
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
    describe("isAuthSession", () => {
        it("should return true for valid AuthSession", () => {
            const session = { accessToken: "valid_token" };
            expect((0, safetyUtils_1.isAuthSession)(session)).toBe(true);
        });
        it("should return false for empty accessToken", () => {
            const session = { accessToken: "" };
            expect((0, safetyUtils_1.isAuthSession)(session)).toBe(false);
        });
        it("should return true with refreshToken and profile", () => {
            const session = {
                accessToken: "valid_token",
                refreshToken: "refresh_token",
                profile: { id: "1", email: "test@example.com" }
            };
            expect((0, safetyUtils_1.isAuthSession)(session)).toBe(true);
        });
    });
    describe("isUserProfile", () => {
        it("should return true for valid UserProfile", () => {
            const profile = { id: "1", email: "test@example.com" };
            expect((0, safetyUtils_1.isUserProfile)(profile)).toBe(true);
        });
        it("should return false for missing id", () => {
            const profile = { email: "test@example.com" };
            expect((0, safetyUtils_1.isUserProfile)(profile)).toBe(false);
        });
        it("should return false for missing email", () => {
            const profile = { id: "1" };
            expect((0, safetyUtils_1.isUserProfile)(profile)).toBe(false);
        });
    });
    describe("safeExtractActionToken", () => {
        it("should return valid token", () => {
            expect((0, safetyUtils_1.safeExtractActionToken)("valid_token")).toBe("valid_token");
        });
        it("should return empty string for undefined", () => {
            expect((0, safetyUtils_1.safeExtractActionToken)(undefined)).toBe("");
        });
        it("should return empty string for empty string", () => {
            expect((0, safetyUtils_1.safeExtractActionToken)("")).toBe("");
        });
        it("should return empty string for whitespace-only string", () => {
            expect((0, safetyUtils_1.safeExtractActionToken)("   ")).toBe("");
        });
    });
    describe("safeExtractPasswordFromPending", () => {
        it("should return password when available", () => {
            const pending = { email: "test@example.com", password: "pass123" };
            expect((0, safetyUtils_1.safeExtractPasswordFromPending)(pending)).toBe("pass123");
        });
        it("should return empty string when pending is undefined", () => {
            expect((0, safetyUtils_1.safeExtractPasswordFromPending)(undefined)).toBe("");
        });
        it("should return empty string when password is not a string", () => {
            const pending = { email: "test@example.com", password: 123 };
            expect((0, safetyUtils_1.safeExtractPasswordFromPending)(pending)).toBe("");
        });
    });
    describe("safeGetStringFromContext", () => {
        it("should return valid string", () => {
            expect((0, safetyUtils_1.safeGetStringFromContext)("valid_string")).toBe("valid_string");
        });
        it("should return fallback for undefined", () => {
            expect((0, safetyUtils_1.safeGetStringFromContext)(undefined)).toBe("");
        });
        it("should return custom fallback", () => {
            expect((0, safetyUtils_1.safeGetStringFromContext)(undefined, "fallback")).toBe("fallback");
        });
        it("should return fallback for non-string", () => {
            expect((0, safetyUtils_1.safeGetStringFromContext)(123)).toBe("");
        });
    });
});
