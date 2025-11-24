/**
 * Additional tests for AuthRepository error paths to improve coverage
 */

import axios from "axios";
import { AuthRepository } from "./AuthRepository";
import { LoginRequestDTO, AuthSession, UserProfile, IStorage } from "../types";

// Mock storage for testing
const createMockStorage = (): IStorage => {
  const storage: Record<string, string> = {};
  return {
    getItem: jest.fn(async (key: string) => storage[key] || null),
    setItem: jest.fn(async (key: string, value: string) => { storage[key] = value; }),
    removeItem: jest.fn(async (key: string) => { delete storage[key]; }),
  };
};

describe("AuthRepository Error Path Tests", () => {
  let authRepository: AuthRepository;
  let mockStorage: IStorage;

  beforeEach(() => {
    mockStorage = createMockStorage();
    authRepository = new AuthRepository(mockStorage, "https://api.test.com");

    // Mock axios to return controlled responses
    jest.clearAllMocks();
    jest.spyOn(axios, 'create').mockReturnValue(authRepository['apiClient']);
  });

  describe("readSession error handling", () => {
    it("should handle invalid JSON in stored session by falling back to legacy format", async () => {
      const badJson = "not valid json";
      (mockStorage.getItem as jest.Mock).mockResolvedValue(badJson);

      const result = await authRepository["readSession"]();
      // The function falls back to legacy format for non-JSON strings
      expect(result).toEqual({ accessToken: "not valid json" });
    });

    it("should handle JSON that starts with { but is invalid", async () => {
      const badJson = "{ invalid json";
      (mockStorage.getItem as jest.Mock).mockResolvedValue(badJson);

      const result = await authRepository["readSession"]();
      expect(result).toBeNull(); // Invalid JSON will cause it to return null
    });

    it("should handle stored data without accessToken", async () => {
      const noAccessToken = JSON.stringify({ refreshToken: "valid" });
      (mockStorage.getItem as jest.Mock).mockResolvedValue(noAccessToken);

      const result = await authRepository["readSession"]();
      expect(result).toBeNull();
    });

    it("should handle stored data with empty accessToken", async () => {
      const emptyToken = JSON.stringify({ accessToken: "" });
      (mockStorage.getItem as jest.Mock).mockResolvedValue(emptyToken);

      const result = await authRepository["readSession"]();
      // The function returns the object with empty accessToken since hasRequiredProperties just checks key exists
      expect(result).toEqual({
        accessToken: "",
        refreshToken: undefined,
        profile: undefined
      });
    });

    it("should handle stored data with valid structure", async () => {
      const validSession = JSON.stringify({
        accessToken: "valid_token",
        refreshToken: "refresh_token",
        profile: { id: "1", email: "test@example.com" }
      });
      (mockStorage.getItem as jest.Mock).mockResolvedValue(validSession);

      const result = await authRepository["readSession"]();
      expect(result).toEqual({
        accessToken: "valid_token",
        refreshToken: "refresh_token",
        profile: { id: "1", email: "test@example.com" }
      });
    });
  });

  describe("validateSessionWithServer error handling", () => {
    it("should handle invalid user profile from server", async () => {
      jest.spyOn(authRepository["apiClient"], "get").mockResolvedValue({
        data: { id: "1" } // Missing required email field
      });

      const session: AuthSession = { accessToken: "valid", refreshToken: "refresh" };
      const result = await authRepository["validateSessionWithServer"](session);
      expect(result).toBeNull();
    });
  });

  describe("isTokenExpired utility", () => {
    it("should return true for malformed JWT", () => {
      const result = authRepository["isTokenExpired"]("not.a.jwt");
      expect(result).toBe(true);
    });

    it("should return true for JWT with non-numeric payload", () => {
      // Create a token with invalid payload: header.payload.signature
      // where payload is non-base64
      const result = authRepository["isTokenExpired"]("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature");
      expect(result).toBe(true);
    });

    it("should return false when no expiration claim", () => {
      // JWT with header and payload that has no "exp" field
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
                   Buffer.from('{"sub":"1234567890","name":"John Doe","iat":1516239022}').toString('base64') +
                   ".SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      const result = authRepository["isTokenExpired"](token);
      expect(result).toBe(false);
    });
  });
});