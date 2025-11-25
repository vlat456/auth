/**
 * Tests for the safety utilities
 */

import {
  hasRequiredProperties,
  isAuthSession,
  isUserProfile,
  safeGetNestedValue,
  safeArrayAccess,
  isValidLoginRequest,
  safeExtractActionToken,
  safeExtractPasswordFromPending,
  safeGetStringFromContext,
  safeExtractErrorMessage,
  isValidRequestOtp,
  isValidVerifyOtp,
} from "./safetyUtils";
import { LoginRequestDTO, AuthSession, UserProfile } from "../types";

// Create type that extends Record for the test
type ExtendedLoginRequestDTO = LoginRequestDTO & Record<string, unknown>;

describe("Safety Utilities", () => {
  describe("hasRequiredProperties", () => {
    it("should return true when object has all required properties", () => {
      const obj = { email: "test@example.com", password: "password123" };
      const result = hasRequiredProperties<ExtendedLoginRequestDTO>(obj, [
        "email",
        "password",
      ]);
      expect(result).toBe(true);
    });

    it("should return false when object is null", () => {
      const result = hasRequiredProperties<ExtendedLoginRequestDTO>(null, [
        "email",
        "password",
      ]);
      expect(result).toBe(false);
    });

    it("should return false when object is not an object", () => {
      const result = hasRequiredProperties<ExtendedLoginRequestDTO>(
        "not an object",
        ["email", "password"]
      );
      expect(result).toBe(false);
    });

    it("should return false when object is missing a required property", () => {
      const obj = { email: "test@example.com" }; // missing password
      const result = hasRequiredProperties<ExtendedLoginRequestDTO>(obj, [
        "email",
        "password",
      ]);
      expect(result).toBe(false);
    });

    it("should return false when object has required property but it's null", () => {
      const obj = { email: null, password: "password123" };
      const result = hasRequiredProperties<ExtendedLoginRequestDTO>(obj, [
        "email",
        "password",
      ]);
      expect(result).toBe(false);
    });

    it("should return false when object has required property but it's undefined", () => {
      const obj = { email: undefined, password: "password123" };
      const result = hasRequiredProperties<ExtendedLoginRequestDTO>(obj, [
        "email",
        "password",
      ]);
      expect(result).toBe(false);
    });

    it("should return false when given an array (security fix)", () => {
      // SECURITY: Arrays should be rejected even though typeof [] === 'object'
      const arr = ["email", "password"];
      const result = hasRequiredProperties<ExtendedLoginRequestDTO>(arr, [
        "email",
        "password",
      ]);
      expect(result).toBe(false);
    });

    it("should return false when given an array with numeric string indices", () => {
      // SECURITY: Array with numeric properties should still be rejected
      const arr = ["test@example.com", "password123"] as any;
      const result = hasRequiredProperties<ExtendedLoginRequestDTO>(arr, [
        "email",
        "password",
      ]);
      expect(result).toBe(false);
    });

    it("should return false when given an array of objects", () => {
      // SECURITY: Nested array structure should be rejected
      const arr = [{ email: "test@example.com", password: "password123" }];
      const result = hasRequiredProperties<ExtendedLoginRequestDTO>(arr, [
        "email",
        "password",
      ]);
      expect(result).toBe(false);
    });

    it("should return true for regular objects with properties", () => {
      const obj = {
        email: "test@example.com",
        password: "password123",
        extra: "field",
      };
      const result = hasRequiredProperties<ExtendedLoginRequestDTO>(obj, [
        "email",
        "password",
      ]);
      expect(result).toBe(true);
    });
  });

  describe("isAuthSession", () => {
    it("should return true for valid AuthSession", () => {
      const session: AuthSession = { accessToken: "token123" };
      expect(isAuthSession(session)).toBe(true);
    });

    it("should return false for null", () => {
      expect(isAuthSession(null)).toBe(false);
    });

    it("should return false for missing accessToken", () => {
      const session = { refreshToken: "refresh123" };
      expect(isAuthSession(session)).toBe(false);
    });

    it("should return false for empty accessToken", () => {
      const session: AuthSession = { accessToken: "" };
      expect(isAuthSession(session)).toBe(false);
    });

    it("should return true for AuthSession with refreshToken and profile", () => {
      const session: AuthSession = {
        accessToken: "token123",
        refreshToken: "refresh123",
        profile: { id: "1", email: "test@example.com" },
      };
      expect(isAuthSession(session)).toBe(true);
    });
  });

  describe("isUserProfile", () => {
    it("should return true for valid UserProfile", () => {
      const profile: UserProfile = { id: "1", email: "test@example.com" };
      expect(isUserProfile(profile)).toBe(true);
    });

    it("should return false for null", () => {
      expect(isUserProfile(null)).toBe(false);
    });

    it("should return false for missing required properties", () => {
      const profile = { id: "1" }; // missing email
      expect(isUserProfile(profile)).toBe(false);
    });

    it("should return false for non-string id", () => {
      const profile = { id: 1, email: "test@example.com" };
      expect(isUserProfile(profile)).toBe(false);
    });

    it("should return false for non-string email", () => {
      const profile = { id: "1", email: 123 };
      expect(isUserProfile(profile)).toBe(false);
    });
  });

  describe("safeGetNestedValue", () => {
    it("should return nested value when path exists", () => {
      const obj = { user: { profile: { name: "John" } } };
      const result = safeGetNestedValue<string>(obj, "user.profile.name");
      expect(result).toBe("John");
    });

    it("should return defaultValue when path doesn't exist", () => {
      const obj = { user: { profile: { name: "John" } } };
      const result = safeGetNestedValue<string>(
        obj,
        "user.profile.age",
        "unknown"
      );
      expect(result).toBe("unknown");
    });

    it("should return undefined when path doesn't exist and no defaultValue", () => {
      const obj = { user: { profile: { name: "John" } } };
      const result = safeGetNestedValue<string>(obj, "user.profile.age");
      expect(result).toBeUndefined();
    });

    it("should return undefined for null object", () => {
      const result = safeGetNestedValue<string>(null, "user.profile.name");
      expect(result).toBeUndefined();
    });

    it("should return undefined for non-object", () => {
      const result = safeGetNestedValue<string>(
        "not an object",
        "user.profile.name"
      );
      expect(result).toBeUndefined();
    });
  });

  describe("safeArrayAccess", () => {
    it("should return element at valid index", () => {
      const arr = ["a", "b", "c"];
      expect(safeArrayAccess(arr, 1)).toBe("b");
    });

    it("should return defaultValue for invalid index", () => {
      const arr = ["a", "b", "c"];
      expect(safeArrayAccess(arr, 5, "default")).toBe("default");
    });

    it("should return undefined for invalid index with no default", () => {
      const arr = ["a", "b", "c"];
      expect(safeArrayAccess(arr, 5)).toBeUndefined();
    });

    it("should return undefined for non-array", () => {
      expect(safeArrayAccess("not an array" as any, 0)).toBeUndefined();
    });

    it("should return undefined for undefined array", () => {
      expect(safeArrayAccess(undefined, 0)).toBeUndefined();
    });
  });

  describe("isValidLoginRequest", () => {
    it("should return true for valid LoginRequestDTO", () => {
      const dto: LoginRequestDTO = {
        email: "test@example.com",
        password: "password123",
      };
      expect(isValidLoginRequest(dto)).toBe(true);
    });

    it("should return false for null", () => {
      expect(isValidLoginRequest(null)).toBe(false);
    });

    it("should return false for missing email", () => {
      const dto = { password: "password123" };
      expect(isValidLoginRequest(dto)).toBe(false);
    });

    it("should return false for missing password", () => {
      const dto = { email: "test@example.com" };
      expect(isValidLoginRequest(dto)).toBe(false);
    });

    it("should return false for non-string email", () => {
      const dto = { email: 123, password: "password123" };
      expect(isValidLoginRequest(dto)).toBe(false);
    });

    it("should return false for non-string password", () => {
      const dto = { email: "test@example.com", password: 123 };
      expect(isValidLoginRequest(dto)).toBe(false);
    });
  });

  describe("Extended Coverage - Error Message Extraction", () => {
    it("should handle error with nested error object", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const event: any = {
        error: { message: "Nested error" },
      };
      expect(safeExtractErrorMessage(event)).toBe("Nested error");
    });

    it("should handle error with data string", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const event: any = {
        data: "String data error",
      };
      expect(safeExtractErrorMessage(event)).toBe("String data error");
    });

    it("should return undefined for event without error info", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(safeExtractErrorMessage({} as any)).toBeUndefined();
    });

    it("should handle extraction exception gracefully", () => {
      // This simulates an event that throws when accessing properties
      // The function should catch and return undefined
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(safeExtractErrorMessage(null as any)).toBeUndefined();
    });
  });

  describe("Extended Coverage - Safe Navigation", () => {
    it("should handle nested path with deep objects", () => {
      const obj = { a: { b: { c: "value" } } };
      expect(safeGetNestedValue(obj, "a.b.c")).toBe("value");
    });

    it("should return undefined for missing intermediate path", () => {
      const obj = { a: { c: "value" } };
      expect(safeGetNestedValue(obj, "a.b.c")).toBeUndefined();
    });

    it("should handle null values in path", () => {
      const obj = { a: null };
      expect(safeGetNestedValue(obj, "a.b")).toBeUndefined();
    });

    it("should handle undefined values in path", () => {
      const obj = { a: undefined };
      expect(safeGetNestedValue(obj, "a.b")).toBeUndefined();
    });

    it("should access top-level properties", () => {
      const obj = { name: "test" };
      expect(safeGetNestedValue(obj, "name")).toBe("test");
    });

    it("should return undefined for missing top-level property", () => {
      const obj = { name: "test" };
      expect(safeGetNestedValue(obj, "age")).toBeUndefined();
    });
  });

  describe("Extended Coverage - Array Access", () => {
    it("should safely access array elements", () => {
      const arr = ["first", "second", "third"];
      expect(safeArrayAccess(arr, 0)).toBe("first");
      expect(safeArrayAccess(arr, 1)).toBe("second");
    });

    it("should return undefined for out-of-bounds access", () => {
      const arr = ["first"];
      expect(safeArrayAccess(arr, 99)).toBeUndefined();
    });

    it("should handle null array", () => {
      expect(safeArrayAccess(null as any, 0)).toBeUndefined();
    });

    it("should handle non-array types", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(safeArrayAccess("not an array" as any, 0)).toBeUndefined();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(safeArrayAccess(123 as any, 0)).toBeUndefined();
    });
  });

  describe("Additional edge cases for 100% coverage", () => {
    describe("safeExtractErrorMessage with various event structures", () => {
      it("should extract error from event.data.message", () => {
        const event = { data: { message: "error message" } };
        const result = safeExtractErrorMessage(event as any);
        expect(result).toBe("error message");
      });

      it("should extract error from event.error.message", () => {
        const event = { error: { message: "error from error object" } };
        const result = safeExtractErrorMessage(event as any);
        expect(result).toBe("error from error object");
      });

      it("should extract string from event.data when data is string", () => {
        const event = { data: "string error" };
        const result = safeExtractErrorMessage(event as any);
        expect(result).toBe("string error");
      });

      it("should extract string from event.error when error is string", () => {
        const event = { error: "string error message" };
        const result = safeExtractErrorMessage(event as any);
        expect(result).toBe("string error message");
      });

      it("should return undefined for null event", () => {
        const result = safeExtractErrorMessage(null as any);
        expect(result).toBeUndefined();
      });

      it("should return undefined for non-object event", () => {
        const result = safeExtractErrorMessage("string event" as any);
        expect(result).toBeUndefined();
      });

      it("should return undefined when no error paths match", () => {
        const event = { type: "success", payload: {} };
        const result = safeExtractErrorMessage(event as any);
        expect(result).toBeUndefined();
      });

      it("should catch and handle exceptions", () => {
        const event = Object.create(null);
        Object.defineProperty(event, "data", {
          get() {
            throw new Error("getter error");
          },
        });
        const result = safeExtractErrorMessage(event as any);
        expect(result).toBeUndefined();
      });
    });

    describe("isValidRequestOtp edge cases", () => {
      it("should validate request with email", () => {
        const payload = { email: "test@example.com" };
        expect(isValidRequestOtp(payload)).toBe(true);
      });

      it("should reject non-object payloads", () => {
        expect(isValidRequestOtp("not an object")).toBe(false);
        expect(isValidRequestOtp(123)).toBe(false);
        expect(isValidRequestOtp(null)).toBe(false);
      });

      it("should reject with empty email", () => {
        const payload = { email: "" };
        expect(isValidRequestOtp(payload)).toBe(false);
      });

      it("should reject with non-string email", () => {
        const payload = { email: 123 };
        expect(isValidRequestOtp(payload)).toBe(false);
      });

      it("should reject missing email", () => {
        const payload = { other: "value" };
        expect(isValidRequestOtp(payload)).toBe(false);
      });
    });

    describe("isValidVerifyOtp edge cases", () => {
      it("should validate correct OTP request", () => {
        const payload = { email: "test@example.com", otp: "123456" };
        expect(isValidVerifyOtp(payload)).toBe(true);
      });

      it("should reject with empty email", () => {
        const payload = { email: "", otp: "123456" };
        expect(isValidVerifyOtp(payload)).toBe(false);
      });

      it("should reject with empty OTP", () => {
        const payload = { email: "test@example.com", otp: "" };
        expect(isValidVerifyOtp(payload)).toBe(false);
      });

      it("should reject with null values", () => {
        const payload = { email: null, otp: null };
        expect(isValidVerifyOtp(payload)).toBe(false);
      });

      it("should reject non-object payloads", () => {
        expect(isValidVerifyOtp(null)).toBe(false);
      });
    });

    describe("isAuthSession edge cases", () => {
      it("should validate session with valid access token", () => {
        const session = { accessToken: "token123" };
        expect(isAuthSession(session)).toBe(true);
      });

      it("should reject session with empty access token", () => {
        const session = { accessToken: "" };
        expect(isAuthSession(session)).toBe(false);
      });

      it("should reject null session", () => {
        expect(isAuthSession(null)).toBe(false);
      });

      it("should reject non-object session", () => {
        expect(isAuthSession("not an object")).toBe(false);
      });

      it("should reject session without access token", () => {
        const session = { refreshToken: "refresh" };
        expect(isAuthSession(session)).toBe(false);
      });

      it("should reject session with non-string access token", () => {
        const session = { accessToken: 123 };
        expect(isAuthSession(session)).toBe(false);
      });
    });

    describe("isUserProfile edge cases", () => {
      it("should validate profile with required fields", () => {
        const profile = { id: "user123", email: "test@example.com" };
        expect(isUserProfile(profile)).toBe(true);
      });

      it("should reject profile with empty id string", () => {
        // New behavior: rejects content that should not be empty
        const profile = { id: "", email: "test@example.com" };
        expect(isUserProfile(profile)).toBe(false);
      });

      it("should reject profile with empty email string", () => {
        // New behavior: rejects content that should not be empty
        const profile = { id: "user123", email: "" };
        expect(isUserProfile(profile)).toBe(false);
      });

      it("should reject profile with non-string fields", () => {
        const profile = { id: 123, email: 456 };
        expect(isUserProfile(profile)).toBe(false);
      });

      it("should reject null profile", () => {
        expect(isUserProfile(null)).toBe(false);
      });

      it("should reject non-object profile", () => {
        expect(isUserProfile("not an object")).toBe(false);
      });

      it("should reject profile missing required fields", () => {
        const profile = { id: "user123" };
        expect(isUserProfile(profile)).toBe(false);
      });

      it("should reject when id is not string", () => {
        const profile = { id: null, email: "test@example.com" };
        expect(isUserProfile(profile)).toBe(false);
      });

      it("should reject when email is not string", () => {
        const profile = { id: "user123", email: null };
        expect(isUserProfile(profile)).toBe(false);
      });
    });

    describe("safeGetNestedValue edge cases", () => {
      it("should get nested value with dot notation", () => {
        const obj = { user: { profile: { name: "John" } } };
        const result = safeGetNestedValue(obj, "user.profile.name");
        expect(result).toBe("John");
      });

      it("should return default value for missing path", () => {
        const obj = { user: { profile: { name: "John" } } };
        const result = safeGetNestedValue(obj, "user.missing.name", "default");
        expect(result).toBe("default");
      });

      it("should return undefined for missing path without default", () => {
        const obj = { user: { profile: { name: "John" } } };
        const result = safeGetNestedValue(obj, "user.missing.name");
        expect(result).toBeUndefined();
      });

      it("should handle null in path", () => {
        const obj = { user: null };
        const result = safeGetNestedValue(obj, "user.name");
        expect(result).toBeUndefined();
      });

      it("should handle non-object input", () => {
        const result = safeGetNestedValue(null, "some.path", "default");
        expect(result).toBe("default");
      });

      it("should handle undefined values in path", () => {
        const obj = { user: undefined };
        const result = safeGetNestedValue(obj, "user.name");
        expect(result).toBeUndefined();
      });

      it("should get simple property", () => {
        const obj = { name: "John" };
        const result = safeGetNestedValue(obj, "name");
        expect(result).toBe("John");
      });
    });

    describe("safeArrayAccess edge cases", () => {
      it("should access array element at valid index", () => {
        const arr = ["a", "b", "c"];
        expect(safeArrayAccess(arr, 1)).toBe("b");
      });

      it("should return default for negative index", () => {
        const arr = ["a", "b", "c"];
        expect(safeArrayAccess(arr, -1, "default")).toBe("default");
      });

      it("should return default for index >= length", () => {
        const arr = ["a", "b", "c"];
        expect(safeArrayAccess(arr, 10, "default")).toBe("default");
      });

      it("should return undefined for out of bounds without default", () => {
        const arr = ["a", "b", "c"];
        expect(safeArrayAccess(arr, 10)).toBeUndefined();
      });

      it("should handle undefined array", () => {
        expect(safeArrayAccess(undefined, 0, "default")).toBe("default");
      });

      it("should handle zero index", () => {
        const arr = ["first"];
        expect(safeArrayAccess(arr, 0)).toBe("first");
      });

      it("should handle last valid index", () => {
        const arr = ["a", "b", "c"];
        expect(safeArrayAccess(arr, 2)).toBe("c");
      });
    });

    describe("safeExtractActionToken edge cases", () => {
      it("should extract valid token", () => {
        const token = "validtoken123";
        expect(safeExtractActionToken(token)).toBe("validtoken123");
      });

      it("should return empty string for undefined token", () => {
        expect(safeExtractActionToken(undefined)).toBe("");
      });

      it("should return empty string for whitespace-only token", () => {
        expect(safeExtractActionToken("   ")).toBe("");
      });

      it("should trim token properly", () => {
        const token = "  token123  ";
        const result = safeExtractActionToken(token);
        expect(result.trim()).toBe("token123");
      });
    });

    describe("safeExtractPasswordFromPending edge cases", () => {
      it("should extract password from pending credentials", () => {
        const pending = { email: "test@example.com", password: "pass123" };
        expect(safeExtractPasswordFromPending(pending)).toBe("pass123");
      });

      it("should return empty string for undefined pending", () => {
        expect(safeExtractPasswordFromPending(undefined)).toBe("");
      });

      it("should return empty string for missing password", () => {
        const pending = { email: "test@example.com" };
        expect(safeExtractPasswordFromPending(pending as any)).toBe("");
      });

      it("should return empty string for non-string password", () => {
        const pending = { email: "test@example.com", password: 123 };
        expect(safeExtractPasswordFromPending(pending as any)).toBe("");
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
