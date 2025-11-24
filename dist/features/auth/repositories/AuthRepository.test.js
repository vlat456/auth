"use strict";
/**
 * Path: src/features/auth/repositories/AuthRepository.test.ts
 * Version: 0.2.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const AuthRepository_1 = require("./AuthRepository");
jest.mock("axios");
const mockedAxios = axios_1.default;
const mockStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
};
// Helpers to generate test JWTs
const createMockJwt = (expInSeconds) => {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payloadObj = expInSeconds
        ? { exp: expInSeconds, sub: "123" }
        : { sub: "123" };
    const payload = btoa(JSON.stringify(payloadObj));
    return `${header}.${payload}.signature`;
};
describe("AuthRepository", () => {
    let repository;
    let mockAxiosInstance;
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        mockAxiosInstance = jest.fn();
        mockAxiosInstance.post = jest.fn();
        mockAxiosInstance.get = jest.fn();
        mockAxiosInstance.interceptors = { response: { use: jest.fn() } };
        mockedAxios.create.mockReturnValue(mockAxiosInstance);
        mockedAxios.isAxiosError.mockReturnValue(true);
        repository = new AuthRepository_1.AuthRepository(mockStorage, "https://test.api.com");
    });
    it("should create an axios instance with the provided baseURL", () => {
        expect(mockedAxios.create).toHaveBeenCalledWith({
            baseURL: "https://test.api.com",
            headers: { "Content-Type": "application/json" },
            timeout: 10000,
        });
    });
    it("should fall back to the default baseURL when none is provided", () => {
        mockedAxios.create.mockClear();
        new AuthRepository_1.AuthRepository(mockStorage);
        expect(mockedAxios.create).toHaveBeenLastCalledWith({
            baseURL: "https://api.astra.example.com",
            headers: { "Content-Type": "application/json" },
            timeout: 10000,
        });
    });
    afterEach(() => {
        jest.useRealTimers();
    });
    describe("Login & Register", () => {
        it("should call API, save session, and return tokens on login success", async () => {
            mockAxiosInstance.post.mockResolvedValue({
                data: {
                    status: 200,
                    message: "OK",
                    data: { accessToken: "abc-123", refreshToken: "ref-456" },
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
            expect(mockStorage.setItem).toHaveBeenCalledWith("user_session_token", JSON.stringify({ accessToken: "abc-123", refreshToken: "ref-456" }));
            expect(result).toEqual({
                accessToken: "abc-123",
                refreshToken: "ref-456",
            });
        });
        it("should register user via OTP-init endpoint without touching storage", async () => {
            mockAxiosInstance.post.mockResolvedValue({ data: undefined });
            await repository.register({
                email: "new@test.com",
                password: "secret",
            });
            expect(mockAxiosInstance.post).toHaveBeenCalledWith("/auth/register", {
                email: "new@test.com",
                password: "secret",
            });
            expect(mockStorage.setItem).not.toHaveBeenCalled();
        });
        it("should surface server errors when login fails", async () => {
            const axiosError = {
                response: { data: { message: "Invalid credentials" } },
                message: "fallback",
            };
            mockAxiosInstance.post.mockRejectedValue(axiosError);
            await expect(repository.login({ email: "bad@test.com", password: "wrong" })).rejects.toThrow("Invalid credentials");
        });
        it("should surface fallback message when register fails without server message", async () => {
            const axiosError = {
                response: { data: "no-object" },
                message: "Cannot register",
            };
            mockAxiosInstance.post.mockRejectedValue(axiosError);
            await expect(repository.register({ email: "bad@test.com", password: "pass" })).rejects.toThrow("Cannot register");
        });
        it("should throw network error message when no response payload exists", async () => {
            const axiosError = {
                message: "Network down",
            };
            mockAxiosInstance.post.mockRejectedValue(axiosError);
            await expect(repository.login({ email: "offline@test.com", password: "pass" })).rejects.toThrow("Network down");
        });
        it("should throw a generic error if error has no message", async () => {
            const error = {};
            mockAxiosInstance.post.mockRejectedValue(error);
            await expect(repository.login({ email: "test@test.com", password: "password" })).rejects.toThrow("An unexpected error occurred");
        });
    });
    describe("Check Session (JWT Logic)", () => {
        const serializeSession = (token) => JSON.stringify({ accessToken: token });
        it("should return null if no token exists", async () => {
            mockStorage.getItem.mockResolvedValue(null);
            const result = await repository.checkSession();
            expect(result).toBeNull();
            expect(mockAxiosInstance.get).not.toHaveBeenCalled();
        });
        it("should skip API and LOGOUT if token is locally expired", async () => {
            const pastTime = Math.floor(Date.now() / 1000) - 3600;
            const expiredToken = createMockJwt(pastTime);
            mockStorage.getItem.mockResolvedValue(serializeSession(expiredToken));
            const result = await repository.checkSession();
            expect(result).toBeNull();
            expect(mockStorage.removeItem).toHaveBeenCalledWith("user_session_token");
            expect(mockAxiosInstance.get).not.toHaveBeenCalled();
        });
        it("should proceed to API if token is locally valid", async () => {
            const futureTime = Math.floor(Date.now() / 1000) + 3600;
            const validToken = createMockJwt(futureTime);
            mockStorage.getItem.mockResolvedValue(serializeSession(validToken));
            const mockProfile = { id: "1", email: "me@test.com" };
            mockAxiosInstance.get.mockResolvedValue({ data: mockProfile });
            const result = await repository.checkSession();
            expect(mockAxiosInstance.get).toHaveBeenCalledWith("/auth/me", {
                headers: { Authorization: `Bearer ${validToken}` },
            });
            expect(result).toEqual({
                accessToken: validToken,
                profile: mockProfile,
            });
        });
        it("should drop non-string refresh tokens when reading session", async () => {
            const futureTime = Math.floor(Date.now() / 1000) + 3600;
            const validToken = createMockJwt(futureTime);
            mockStorage.getItem.mockResolvedValue(JSON.stringify({ accessToken: validToken, refreshToken: 12345 }));
            const mockProfile = { id: "1", email: "me@test.com" };
            mockAxiosInstance.get.mockResolvedValue({ data: mockProfile });
            const result = await repository.checkSession();
            expect(result).toEqual({
                accessToken: validToken,
                refreshToken: undefined,
                profile: mockProfile,
            });
        });
        it("should keep refresh token when stored session includes string value", async () => {
            const futureTime = Math.floor(Date.now() / 1000) + 3600;
            const validToken = createMockJwt(futureTime);
            mockStorage.getItem.mockResolvedValue(JSON.stringify({
                accessToken: validToken,
                refreshToken: "refresh-123",
            }));
            const mockProfile = { id: "1", email: "me@test.com" };
            mockAxiosInstance.get.mockResolvedValue({ data: mockProfile });
            const result = await repository.checkSession();
            expect(result).toEqual({
                accessToken: validToken,
                refreshToken: "refresh-123",
                profile: mockProfile,
            });
        });
        it("should LOGOUT if token is locally valid but server rejects it (401)", async () => {
            const futureTime = Math.floor(Date.now() / 1000) + 3600;
            const validToken = createMockJwt(futureTime);
            mockStorage.getItem.mockResolvedValue(serializeSession(validToken));
            mockAxiosInstance.get.mockRejectedValue({ response: { status: 401 } });
            const result = await repository.checkSession();
            expect(result).toBeNull();
            expect(mockAxiosInstance.get).toHaveBeenCalled();
            expect(mockStorage.removeItem).toHaveBeenCalled();
        });
        it("should return null without logout when server responds with non-401 error", async () => {
            const futureTime = Math.floor(Date.now() / 1000) + 3600;
            const validToken = createMockJwt(futureTime);
            mockStorage.getItem.mockResolvedValue(serializeSession(validToken));
            mockAxiosInstance.get.mockRejectedValue({ response: { status: 500 } });
            const result = await repository.checkSession();
            expect(result).toBeNull();
            expect(mockStorage.removeItem).not.toHaveBeenCalled();
        });
        it("should handle network errors without response object", async () => {
            const futureTime = Math.floor(Date.now() / 1000) + 3600;
            const validToken = createMockJwt(futureTime);
            mockStorage.getItem.mockResolvedValue(serializeSession(validToken));
            mockAxiosInstance.get.mockRejectedValue({});
            const result = await repository.checkSession();
            expect(result).toBeNull();
            expect(mockStorage.removeItem).not.toHaveBeenCalled();
        });
        it("should handle legacy plain string tokens gracefully", async () => {
            const futureTime = Math.floor(Date.now() / 1000) + 3600;
            const validToken = createMockJwt(futureTime);
            mockStorage.getItem.mockResolvedValue(validToken);
            mockAxiosInstance.get.mockResolvedValue({ data: { id: "1", email: "a" } });
            const result = await repository.checkSession();
            expect(result?.accessToken).toBe(validToken);
        });
        it("should handle malformed tokens gracefully (treat as invalid)", async () => {
            mockStorage.getItem.mockResolvedValue("not.a.jwt");
            const result = await repository.checkSession();
            expect(result).toBeNull();
            expect(mockStorage.removeItem).toHaveBeenCalled();
            expect(mockAxiosInstance.get).not.toHaveBeenCalled();
        });
        it("should return null when stored JSON lacks accessToken", async () => {
            mockStorage.getItem.mockResolvedValue(JSON.stringify({ refreshToken: "abc" }));
            const result = await repository.checkSession();
            expect(result).toBeNull();
            expect(mockAxiosInstance.get).not.toHaveBeenCalled();
        });
    });
    describe("Request Password Reset", () => {
        it("should call OTP request endpoint", async () => {
            mockAxiosInstance.post.mockResolvedValue(undefined);
            await repository.requestPasswordReset({ email: "reset@test.com" });
            expect(mockAxiosInstance.post).toHaveBeenCalledWith("/auth/otp/request", { email: "reset@test.com" });
        });
        it("should throw when OTP request fails", async () => {
            const axiosError = {
                response: { data: { message: "Email missing" } },
                message: "fallback",
            };
            mockAxiosInstance.post.mockRejectedValue(axiosError);
            await expect(repository.requestPasswordReset({ email: "missing@test.com" })).rejects.toThrow("Email missing");
        });
    });
    describe("Verify OTP and Reset Password", () => {
        it("should call verify-otp endpoint and return action token", async () => {
            mockAxiosInstance.post.mockResolvedValue({
                data: {
                    status: 200,
                    message: "OK",
                    data: { actionToken: "action-token-123" },
                },
            });
            const token = await repository.verifyOtp({
                email: "test@test.com",
                otp: "123456",
            });
            expect(mockAxiosInstance.post).toHaveBeenCalledWith("/auth/otp/verify", {
                email: "test@test.com",
                otp: "123456",
            });
            expect(token).toBe("action-token-123");
        });
        it("should throw when verify-otp fails", async () => {
            const axiosError = {
                response: { data: { message: "Invalid OTP" } },
                message: "fallback",
            };
            mockAxiosInstance.post.mockRejectedValue(axiosError);
            await expect(repository.verifyOtp({ email: "test@test.com", otp: "123456" })).rejects.toThrow("Invalid OTP");
        });
        it("should call password reset completion endpoint", async () => {
            mockAxiosInstance.post.mockResolvedValue(undefined);
            await repository.completePasswordReset({
                actionToken: "action-token-123",
                newPassword: "new-password",
            });
            expect(mockAxiosInstance.post).toHaveBeenCalledWith("/auth/password/reset/complete", {
                actionToken: "action-token-123",
                newPassword: "new-password",
            });
            expect(mockStorage.setItem).not.toHaveBeenCalled();
        });
        it("should throw when password reset completion fails", async () => {
            const axiosError = {
                response: { data: { message: "Invalid action token" } },
                message: "fallback",
            };
            mockAxiosInstance.post.mockRejectedValue(axiosError);
            await expect(repository.completePasswordReset({
                actionToken: "action-token-123",
                newPassword: "new-password",
            })).rejects.toThrow("Invalid action token");
        });
    });
    describe("Complete Registration", () => {
        it("should call complete registration endpoint", async () => {
            mockAxiosInstance.post.mockResolvedValue(undefined);
            await repository.completeRegistration({
                actionToken: "token-1",
                newPassword: "Secret123!",
            });
            expect(mockAxiosInstance.post).toHaveBeenCalledWith("/auth/register/complete", {
                actionToken: "token-1",
                newPassword: "Secret123!",
            });
        });
        it("should throw when completion fails", async () => {
            const axiosError = {
                response: { data: { message: "Token expired" } },
                message: "fallback",
            };
            mockAxiosInstance.post.mockRejectedValue(axiosError);
            await expect(repository.completeRegistration({
                actionToken: "token-1",
                newPassword: "Secret123!",
            })).rejects.toThrow("Token expired");
        });
    });
    // ... include remaining existing tests (Retry logic, Logout, etc.) ...
    describe("Logout", () => {
        it("should remove token from storage", async () => {
            await repository.logout();
            expect(mockStorage.removeItem).toHaveBeenCalledWith("user_session_token");
        });
    });
    describe("Retry Logic", () => {
        // ... Keep existing retry logic tests ...
        it("should retry on 503", async () => {
            const error503 = {
                config: { url: "/test", method: "get" },
                response: { status: 503 },
            };
            mockAxiosInstance.mockResolvedValue({ data: "success" });
            const calls = mockAxiosInstance.interceptors.response.use.mock.calls[0];
            const errorHandler = calls[1];
            const retryPromise = errorHandler(error503);
            jest.runAllTimers();
            await retryPromise;
            expect(error503.config).toHaveProperty("_retryCount", 1);
        });
    });
    describe("Response Interceptor", () => {
        it("should return response as-is for success handler", () => {
            const [successHandler] = mockAxiosInstance.interceptors.response.use.mock.calls[0];
            const response = { data: 123 };
            expect(successHandler(response)).toBe(response);
        });
        it("should not retry when error is non-retryable", async () => {
            const [, errorHandler] = mockAxiosInstance.interceptors.response.use.mock.calls[0];
            const error = {
                config: { _retryCount: 3 },
                response: { status: 400 },
            };
            await expect(errorHandler(error)).rejects.toBe(error);
            expect(mockAxiosInstance).not.toHaveBeenCalled();
        });
        it("should reject immediately when config is missing", async () => {
            const [, errorHandler] = mockAxiosInstance.interceptors.response.use.mock.calls[0];
            const error = {};
            await expect(errorHandler(error)).rejects.toBe(error);
        });
    });
    describe("isTokenExpired", () => {
        it("returns false when token lacks exp so server can decide", () => {
            const tokenWithoutExp = createMockJwt();
            expect(repository.isTokenExpired(tokenWithoutExp)).toBe(false);
        });
        it("uses Buffer fallback when atob is unavailable", () => {
            const globalAny = global;
            const originalAtob = globalAny.atob;
            delete globalAny.atob;
            const futureTime = Math.floor(Date.now() / 1000) + 120;
            const token = createMockJwt(futureTime);
            expect(repository.isTokenExpired(token)).toBe(false);
            globalAny.atob = originalAtob;
        });
        it("returns true when payload cannot be parsed", () => {
            const badPayload = Buffer.from("not-json").toString("base64");
            const token = `header.${badPayload}.signature`;
            expect(repository.isTokenExpired(token)).toBe(true);
        });
        it("returns false when neither atob nor Buffer are available", () => {
            const globalAny = global;
            const originalAtob = globalAny.atob;
            const originalBuffer = globalAny.Buffer;
            globalAny.atob = undefined;
            globalAny.Buffer = undefined;
            const futureTime = Math.floor(Date.now() / 1000) + 60;
            const token = createMockJwt(futureTime);
            expect(repository.isTokenExpired(token)).toBe(false);
            globalAny.atob = originalAtob;
            globalAny.Buffer = originalBuffer;
        });
        it("returns true when token is missing required segments", () => {
            expect(repository.isTokenExpired("invalid-token")).toBe(true);
        });
    });
    describe("Refresh Token", () => {
        it("should refresh access token using refresh token", async () => {
            const validToken = createMockJwt(Math.floor(Date.now() / 1000) + 3600);
            const newAccessToken = createMockJwt(Math.floor(Date.now() / 1000) + 7200);
            const sessionWithRefresh = {
                accessToken: validToken,
                refreshToken: "refresh-123",
            };
            mockStorage.getItem.mockResolvedValue(JSON.stringify(sessionWithRefresh));
            mockAxiosInstance.post.mockResolvedValue({
                data: {
                    status: 200,
                    message: "OK",
                    data: { accessToken: newAccessToken },
                },
            });
            const result = await repository.refresh("refresh-123");
            expect(mockAxiosInstance.post).toHaveBeenCalledWith("/auth/refresh-token", {
                refreshToken: "refresh-123",
            });
            expect(result).toEqual({
                accessToken: newAccessToken,
                refreshToken: "refresh-123", // Should keep the same refresh token
            });
            expect(mockStorage.setItem).toHaveBeenCalledWith("user_session_token", JSON.stringify({
                accessToken: newAccessToken,
                refreshToken: "refresh-123",
            }));
        });
        it("should throw error when refresh token request fails", async () => {
            mockAxiosInstance.post.mockRejectedValue({
                response: { data: { message: "Invalid refresh token" } },
            });
            await expect(repository.refresh("invalid-refresh-token"))
                .rejects.toThrow("Invalid refresh token");
        });
        it("should throw error when no current session exists during refresh", async () => {
            mockStorage.getItem.mockResolvedValue(null);
            mockAxiosInstance.post.mockResolvedValue({
                data: {
                    status: 200,
                    message: "OK",
                    data: { accessToken: "new-token" },
                },
            });
            await expect(repository.refresh("refresh-token"))
                .rejects.toThrow("No current session found during refresh");
        });
    });
    describe("Check Session with Expired Tokens", () => {
        it("should logout and return null when token is expired but no refresh token is present", async () => {
            const expiredTime = Math.floor(Date.now() / 1000) - 3600;
            const expiredToken = createMockJwt(expiredTime);
            mockStorage.getItem.mockResolvedValue(JSON.stringify({ accessToken: expiredToken }));
            const result = await repository.checkSession();
            expect(result).toBeNull();
            expect(mockStorage.removeItem).toHaveBeenCalledWith("user_session_token");
        });
        it("should attempt refresh when 401 occurs and refresh token is available", async () => {
            const validToken = createMockJwt(Math.floor(Date.now() / 1000) + 3600);
            const newAccessToken = createMockJwt(Math.floor(Date.now() / 1000) + 7200);
            mockStorage.getItem.mockResolvedValue(JSON.stringify({
                accessToken: validToken,
                refreshToken: "refresh-123"
            }));
            // Make the /auth/me request fail with 401 to trigger refresh attempt
            mockAxiosInstance.get.mockRejectedValue({
                response: { status: 401 }
            });
            // Mock the refresh endpoint to return a new token
            mockAxiosInstance.post.mockResolvedValue({
                data: {
                    status: 200,
                    message: "OK",
                    data: { accessToken: newAccessToken },
                },
            });
            const result = await repository.checkSession();
            expect(mockAxiosInstance.post).toHaveBeenCalledWith("/auth/refresh-token", {
                refreshToken: "refresh-123"
            });
            expect(result).toEqual({
                accessToken: newAccessToken,
                refreshToken: "refresh-123",
                profile: undefined
            });
        });
        it("should logout when 401 occurs and refresh token is not available", async () => {
            const validToken = createMockJwt(Math.floor(Date.now() / 1000) + 3600);
            mockStorage.getItem.mockResolvedValue(JSON.stringify({ accessToken: validToken }));
            // Make the /auth/me request fail with 401
            mockAxiosInstance.get.mockRejectedValue({
                response: { status: 401 }
            });
            const result = await repository.checkSession();
            expect(result).toBeNull();
            expect(mockStorage.removeItem).toHaveBeenCalledWith("user_session_token");
        });
        it("should logout when token is expired and refresh attempt fails", async () => {
            const expiredTime = Math.floor(Date.now() / 1000) - 3600;
            const expiredToken = createMockJwt(expiredTime);
            mockStorage.getItem.mockResolvedValue(JSON.stringify({
                accessToken: expiredToken,
                refreshToken: "refresh-123"
            }));
            // Make the refresh call fail
            mockAxiosInstance.post.mockRejectedValue({
                response: { data: { message: "Invalid refresh token" } },
            });
            const result = await repository.checkSession();
            expect(result).toBeNull();
            expect(mockStorage.removeItem).toHaveBeenCalledWith("user_session_token");
        });
        it("should logout when 401 occurs and refresh attempt fails", async () => {
            const validToken = createMockJwt(Math.floor(Date.now() / 1000) + 3600);
            mockStorage.getItem.mockResolvedValue(JSON.stringify({
                accessToken: validToken,
                refreshToken: "refresh-123"
            }));
            // Make the /auth/me request fail with 401 to trigger refresh
            mockAxiosInstance.get.mockRejectedValue({
                response: { status: 401 }
            });
            // Make the refresh call fail
            mockAxiosInstance.post.mockRejectedValue({
                response: { data: { message: "Invalid refresh token" } },
            });
            const result = await repository.checkSession();
            expect(result).toBeNull();
            expect(mockStorage.removeItem).toHaveBeenCalledWith("user_session_token");
        });
        it("should return null without logout when non-401 error occurs", async () => {
            const validToken = createMockJwt(Math.floor(Date.now() / 1000) + 3600);
            mockStorage.getItem.mockResolvedValue(JSON.stringify({
                accessToken: validToken,
                refreshToken: "refresh-123" // Has refresh token but we'll trigger a non-401 error
            }));
            // Make the /auth/me request fail with 500 (not 401)
            mockAxiosInstance.get.mockRejectedValue({
                response: { status: 500 }
            });
            const result = await repository.checkSession();
            expect(result).toBeNull();
            // Should NOT logout for non-401 errors
            expect(mockStorage.removeItem).not.toHaveBeenCalled();
        });
        it("should return null without logout when non-axios error occurs", async () => {
            const validToken = createMockJwt(Math.floor(Date.now() / 1000) + 3600);
            mockStorage.getItem.mockResolvedValue(JSON.stringify({
                accessToken: validToken,
                refreshToken: "refresh-123"
            }));
            // Make the /auth/me request fail with a non-axios error
            mockAxiosInstance.get.mockRejectedValue(new Error("Network error"));
            const result = await repository.checkSession();
            expect(result).toBeNull();
            // Should NOT logout for non-axios errors
            expect(mockStorage.removeItem).not.toHaveBeenCalled();
        });
        it("should logout and return null when 401 occurs and no refresh token is available", async () => {
            const futureTime = Math.floor(Date.now() / 1000) + 3600; // Token not expired
            const validToken = createMockJwt(futureTime);
            const sessionData = JSON.stringify({
                accessToken: validToken
                // No refresh token
            });
            // Mock the first call to readSession (in checkSession method)
            mockStorage.getItem.mockResolvedValueOnce(sessionData);
            // Mock the second call to readSession (in the 401 handling logic)
            mockStorage.getItem.mockResolvedValueOnce(sessionData);
            // Make the /auth/me request fail with 401
            mockAxiosInstance.get.mockRejectedValue({
                response: { status: 401 }
            });
            const result = await repository.checkSession();
            expect(result).toBeNull();
            expect(mockStorage.removeItem).toHaveBeenCalledWith("user_session_token");
        });
        it("should return null without logout when 401 occurs and no session exists for refresh", async () => {
            const futureTime = Math.floor(Date.now() / 1000) + 3600; // Token not expired
            const validToken = createMockJwt(futureTime);
            const sessionData = JSON.stringify({
                accessToken: validToken
                // No refresh token
            });
            // Mock the first call to readSession - valid session
            mockStorage.getItem.mockResolvedValueOnce(sessionData);
            // Mock the second call to readSession during 401 handling - return null (no session)
            mockStorage.getItem.mockResolvedValueOnce(null);
            // Make the /auth/me request fail with 401
            mockAxiosInstance.get.mockRejectedValue({
                response: { status: 401 }
            });
            const result = await repository.checkSession();
            expect(result).toBeNull();
            // Should not logout since there was no session when trying to refresh
            expect(mockStorage.removeItem).not.toHaveBeenCalled();
        });
        it("should cover final return path when 401 error has response and no refresh token", async () => {
            const futureTime = Math.floor(Date.now() / 1000) + 3600; // Token not expired
            const validToken = createMockJwt(futureTime);
            const sessionData = JSON.stringify({
                accessToken: validToken
                // No refresh token
            });
            // Set up the storage mock
            const mockGetItem = jest.fn();
            mockGetItem.mockResolvedValueOnce(sessionData); // First readSession call
            mockGetItem.mockResolvedValueOnce(sessionData); // Second readSession call in 401 handler
            mockStorage.getItem = mockGetItem;
            // Make the /auth/me request fail with 401
            mockAxiosInstance.get.mockRejectedValue({
                response: {
                    status: 401,
                    data: { message: "Unauthorized" }
                }
            });
            const result = await repository.checkSession();
            expect(result).toBeNull();
            expect(mockStorage.removeItem).toHaveBeenCalledWith("user_session_token");
        });
    });
});
