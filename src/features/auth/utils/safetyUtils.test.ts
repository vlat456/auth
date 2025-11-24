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
});
