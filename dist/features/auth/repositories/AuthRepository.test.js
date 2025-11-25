"use strict";
/**
 * Path: src/features/auth/repositories/AuthRepository.test.ts
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
describe("AuthRepository (Stateless)", () => {
    let repository;
    let mockAxiosInstance;
    beforeEach(() => {
        jest.clearAllMocks();
        mockAxiosInstance = {
            post: jest.fn(),
            get: jest.fn(),
            interceptors: { response: { use: jest.fn() } },
        };
        mockedAxios.create.mockReturnValue(mockAxiosInstance);
        repository = new AuthRepository_1.AuthRepository(mockStorage, "https://test.api.com");
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
            const mockSession = {
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
            expect(mockStorage.setItem).toHaveBeenCalledWith("user_session_token", JSON.stringify(mockSession));
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
            await expect(repository.login({ email: "test@test.com", password: "password" })).rejects.toThrow();
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
            const mockSession = { accessToken: "token" };
            mockStorage.getItem.mockResolvedValue(JSON.stringify(mockSession));
            const result = await repository.checkSession();
            expect(mockStorage.getItem).toHaveBeenCalledWith("user_session_token");
            expect(result).toEqual(mockSession);
        });
        it("should return null if storage is empty", async () => {
            mockStorage.getItem.mockResolvedValue(null);
            const result = await repository.checkSession();
            expect(result).toBeNull();
        });
    });
    describe("refresh", () => {
        it("should call the refresh endpoint and save the new session without fetching profile", async () => {
            const oldSession = {
                accessToken: "old-token",
                refreshToken: "refresh-token",
                profile: { id: "1", email: "old@test.com" },
            };
            const newAccessToken = "new-access-token";
            mockStorage.getItem.mockResolvedValue(JSON.stringify(oldSession));
            mockAxiosInstance.post.mockResolvedValue({
                data: {
                    status: 200,
                    message: "Token refreshed",
                    data: { accessToken: newAccessToken },
                },
            });
            const result = await repository.refresh("refresh-token");
            expect(mockAxiosInstance.post).toHaveBeenCalledWith("/auth/refresh-token", {
                refreshToken: "refresh-token",
            });
            // Verify that the profile fetch endpoint was NOT called (it's now handled by state machine)
            expect(mockAxiosInstance.get).not.toHaveBeenCalledWith("/auth/me", {
                headers: { Authorization: `Bearer ${newAccessToken}` },
            });
            const expectedSession = {
                accessToken: newAccessToken,
                refreshToken: "refresh-token",
                profile: oldSession.profile, // Profile should be preserved from existing session
            };
            expect(mockStorage.setItem).toHaveBeenCalledWith("user_session_token", JSON.stringify(expectedSession));
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
