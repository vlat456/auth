/**
 * Path: src/features/auth/repositories/AuthRepository.test.ts
 */

import axios from "axios";
import { AuthRepository } from "./AuthRepository";
import { IStorage, AuthSession } from "../types";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockStorage: IStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

describe("AuthRepository (Stateless)", () => {
  let repository: AuthRepository;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
      interceptors: { response: { use: jest.fn() } },
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    repository = new AuthRepository(mockStorage, "https://test.api.com");
  });

  it("should create an axios instance with the provided baseURL", () => {
    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: "https://test.api.com",
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });
  });

  describe("login", () => {
    it("should call the login endpoint and save the session", async () => {
      const mockSession: AuthSession = {
        accessToken: "abc-123",
        refreshToken: "ref-456",
      };
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 200,
          message: "Login successful",
          data: mockSession,
        },
      });

      const result = await repository.login({
        email: "test@test.com",
        password: "password",
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith("/auth/login", {
        email: "test@test.com",
        password: "password",
      });
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "user_session_token",
        JSON.stringify(mockSession)
      );
      expect(result).toEqual(mockSession);
    });

    it("should throw if the login response is invalid", async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 200,
          message: "Login successful",
          data: { accessToken: null },
        }, // Invalid session
      });

      // Since validation errors are wrapped by withErrorHandling, just check that an error is thrown
      await expect(
        repository.login({ email: "test@test.com", password: "password" })
      ).rejects.toThrow();
    });
  });

  describe("register", () => {
    it("should call the register endpoint", async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: undefined });
      await repository.register({
        email: "new@test.com",
        password: "password",
      });
      expect(mockAxiosInstance.post).toHaveBeenCalledWith("/auth/register", {
        email: "new@test.com",
        password: "password",
      });
      expect(mockStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe("checkSession", () => {
    it("should read the session from storage", async () => {
      const mockSession: AuthSession = { accessToken: "token" };
      (mockStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockSession)
      );
      const result = await repository.checkSession();
      expect(mockStorage.getItem).toHaveBeenCalledWith("user_session_token");
      expect(result).toEqual(mockSession);
    });

    it("should return null if storage is empty", async () => {
      (mockStorage.getItem as jest.Mock).mockResolvedValue(null);
      const result = await repository.checkSession();
      expect(result).toBeNull();
    });
  });

  describe("refresh", () => {
    it("should call the refresh endpoint, fetch profile, and save the new session", async () => {
      const oldSession: AuthSession = {
        accessToken: "old-token",
        refreshToken: "refresh-token",
        profile: { id: "1", email: "old@test.com" },
      };
      const newAccessToken = "new-access-token";
      const freshProfile = { id: "1", email: "new@test.com" };

      (mockStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(oldSession)
      );

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 200,
          message: "Token refreshed",
          data: { accessToken: newAccessToken },
        },
      });

      mockAxiosInstance.get.mockResolvedValue({
        data: freshProfile,
      });

      const result = await repository.refresh("refresh-token");

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/auth/refresh-token",
        {
          refreshToken: "refresh-token",
        }
      );

      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/auth/me", {
        headers: { Authorization: `Bearer ${newAccessToken}` },
      });

      const expectedSession: AuthSession = {
        accessToken: newAccessToken,
        refreshToken: "refresh-token",
        profile: freshProfile,
      };

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "user_session_token",
        JSON.stringify(expectedSession)
      );
      expect(result).toEqual(expectedSession);
    });
  });

  describe("logout", () => {
    it("should remove the session from storage", async () => {
      await repository.logout();
      expect(mockStorage.removeItem).toHaveBeenCalledWith("user_session_token");
    });
  });
});
