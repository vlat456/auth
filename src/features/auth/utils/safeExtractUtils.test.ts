/**
 * Additional tests for safe extract utilities to improve coverage
 */

import {
  safeExtractPayload,
  safeExtractStringFromPayload,
  safeExtractOutput,
  safeExtractEmail,
  safeExtractOtp,
  safeExtractNewPassword
} from "../utils/safetyUtils";
import { AuthEvent } from "../machine/authMachine";

// Create a mock event type that has the same shape as AuthEvent for testing purposes
type MockEvent = {
  type: string;
  payload?: any;
  output?: any;
};

describe("Safe Extract Utilities", () => {
  describe("safeExtractPayload", () => {
    it("should extract valid payload", () => {
      const event = { type: "TEST", payload: { email: "test@example.com" } } as unknown as AuthEvent;
      const result = safeExtractPayload(event);
      expect(result).toEqual({ email: "test@example.com" });
    });

    it("should return undefined when no payload", () => {
      const event = { type: "CHECK_SESSION" } as AuthEvent;
      const result = safeExtractPayload(event);
      expect(result).toBeUndefined();
    });

    it("should return undefined when payload is not an object", () => {
      const event = { type: "LOGIN", payload: "not an object" } as any as AuthEvent;
      const result = safeExtractPayload(event);
      expect(result).toBeUndefined();
    });

    it("should return undefined when payload is null", () => {
      const event = { type: "LOGIN", payload: null } as any as AuthEvent;
      const result = safeExtractPayload(event);
      expect(result).toBeUndefined();
    });
  });

  describe("safeExtractStringFromPayload", () => {
    it("should extract valid string from payload", () => {
      const event = { type: "LOGIN", payload: { email: "test@example.com" } } as AuthEvent;
      const result = safeExtractStringFromPayload(event, "email");
      expect(result).toBe("test@example.com");
    });

    it("should return undefined when key not in payload", () => {
      const event = { type: "LOGIN", payload: { email: "test@example.com" } } as AuthEvent;
      const result = safeExtractStringFromPayload(event, "password");
      expect(result).toBeUndefined();
    });

    it("should return undefined when value is not string", () => {
      const event = { type: "LOGIN", payload: { email: 123 } } as any as AuthEvent;
      const result = safeExtractStringFromPayload(event, "email");
      expect(result).toBeUndefined();
    });

    it("should return undefined when no payload", () => {
      const event = { type: "CHECK_SESSION" } as AuthEvent;
      const result = safeExtractStringFromPayload(event, "email");
      expect(result).toBeUndefined();
    });
  });

  describe("safeExtractOutput", () => {
    it("should extract valid output", () => {
      const event = { type: "LOGIN", output: { result: "success" } } as any as AuthEvent;
      const result = safeExtractOutput(event);
      expect(result).toEqual({ result: "success" });
    });

    it("should return undefined when no output", () => {
      const event = { type: "CHECK_SESSION" } as any as AuthEvent;
      const result = safeExtractOutput(event);
      expect(result).toBeUndefined();
    });

    it("should return output when it's null", () => {
      const event = { type: "LOGIN", output: null } as any as AuthEvent;
      const result = safeExtractOutput(event);
      expect(result).toBeNull();
    });
  });

  describe("safeExtractEmail", () => {
    it("should extract email from event payload", () => {
      const event = { type: "LOGIN", payload: { email: "test@example.com", password: "pass" } } as AuthEvent;
      const result = safeExtractEmail(event);
      expect(result).toBe("test@example.com");
    });

    it("should return undefined when no email in payload", () => {
      const event = { type: "LOGIN", payload: { password: "pass" } } as any as AuthEvent;
      const result = safeExtractEmail(event);
      expect(result).toBeUndefined();
    });
  });

  describe("safeExtractOtp", () => {
    it("should extract OTP from event payload", () => {
      const event = { type: "VERIFY_OTP", payload: { otp: "123456" } } as AuthEvent;
      const result = safeExtractOtp(event);
      expect(result).toBe("123456");
    });

    it("should return undefined when no otp in payload", () => {
      const event = { type: "VERIFY_OTP", payload: { email: "test@example.com" } } as any as AuthEvent;
      const result = safeExtractOtp(event);
      expect(result).toBeUndefined();
    });
  });

  describe("safeExtractNewPassword", () => {
    it("should extract newPassword from event payload", () => {
      const event = { type: "RESET_PASSWORD", payload: { newPassword: "newPass123" } } as AuthEvent;
      const result = safeExtractNewPassword(event);
      expect(result).toBe("newPass123");
    });

    it("should return undefined when no newPassword in payload", () => {
      const event = { type: "RESET_PASSWORD", payload: { email: "test@example.com" } } as any as AuthEvent;
      const result = safeExtractNewPassword(event);
      expect(result).toBeUndefined();
    });
  });
});