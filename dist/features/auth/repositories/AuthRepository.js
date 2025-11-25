"use strict";
/**
 * Path: src/features/auth/repositories/AuthRepository.ts
 * A stateless API layer that only makes direct calls to the backend
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRepository = void 0;
const axios_1 = __importDefault(require("axios"));
const errorHandler_1 = require("../utils/errorHandler");
const validationSchemas_1 = require("../schemas/validationSchemas");
const STORAGE_KEY = "user_session_token";
const RETRY_CONFIG = {
    maxRetries: 3,
    initialDelayMs: 1000,
    retryableStatus: [500, 502, 503, 504],
};
class AuthRepository {
    constructor(storage, baseURL) {
        /**
         * Authenticates a user by email and password.
         */
        this.login = (0, errorHandler_1.withErrorHandling)(async (payload) => {
            const response = await this.apiClient.post("/auth/login", payload);
            const validationResult = (0, validationSchemas_1.validateSafe)(validationSchemas_1.LoginResponseSchemaWrapper, response.data);
            if (!validationResult.success) {
                throw new Error(`Invalid login response: ${JSON.stringify(validationResult.errors)}`);
            }
            const validatedData = validationResult.data;
            const session = {
                accessToken: validatedData.data.accessToken,
                refreshToken: validatedData.data.refreshToken,
            };
            await this.saveSession(session);
            return session;
        });
        this.register = (0, errorHandler_1.withErrorHandling)(async (payload) => {
            await this.apiClient.post("/auth/register", payload);
        });
        this.requestPasswordReset = (0, errorHandler_1.withErrorHandling)(async (payload) => {
            await this.apiClient.post("/auth/otp/request", payload);
        });
        this.verifyOtp = (0, errorHandler_1.withErrorHandling)(async (payload) => {
            const { data } = await this.apiClient.post("/auth/otp/verify", payload);
            return data.data.actionToken;
        });
        this.completeRegistration = (0, errorHandler_1.withErrorHandling)(async (payload) => {
            await this.apiClient.post("/auth/register/complete", payload);
        });
        this.completePasswordReset = (0, errorHandler_1.withErrorHandling)(async (payload) => {
            await this.apiClient.post("/auth/password/reset/complete", payload);
        });
        /**
         * Refreshes the access token using a refresh token.
         * NOTE: This method only refreshes the token, without fetching updated user profile.
         * Profile updates should be handled separately by the calling component/state machine.
         */
        this.refresh = (0, errorHandler_1.withErrorHandling)(async (refreshToken) => {
            const response = await this.apiClient.post("/auth/refresh-token", { refreshToken });
            const validationResult = (0, validationSchemas_1.validateSafe)(validationSchemas_1.RefreshResponseSchemaWrapper, response.data);
            if (!validationResult.success) {
                throw new Error(`Invalid refresh response: ${JSON.stringify(validationResult.errors)}`);
            }
            const validatedData = validationResult.data;
            const newAccessToken = validatedData.data.accessToken;
            // Get the current session to preserve other data
            const currentSession = await this.readSession();
            if (!currentSession) {
                throw new Error("No current session found during refresh");
            }
            // Create new session with fresh access token, keep refresh token, and preserve profile
            // Profile updates should be handled separately by the calling component/state machine
            const refreshedSession = {
                accessToken: newAccessToken,
                refreshToken: currentSession.refreshToken,
                profile: currentSession.profile, // Preserve the existing profile
            };
            await this.saveSession(refreshedSession);
            return refreshedSession;
        });
        this.storage = storage;
        const finalBaseURL = baseURL || "https://api.astra.example.com";
        this.apiClient = axios_1.default.create({
            baseURL: finalBaseURL,
            headers: { "Content-Type": "application/json" },
            timeout: 10000,
        });
        this.initializeInterceptors();
    }
    /**
     * Checks current session by reading from storage
     * (state management is handled by the auth machine)
     */
    async checkSession() {
        return await this.readSession();
    }
    /**
     * Refreshes the user profile data without requiring a token refresh.
     */
    async refreshProfile() {
        const session = await this.readSession();
        if (!session)
            return null;
        try {
            const response = await this.apiClient.get("/auth/me", {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            const userData = response.data;
            if (!this.isUserProfile(userData)) {
                return null;
            }
            // Update session with fresh profile
            const updatedSession = {
                accessToken: session.accessToken,
                refreshToken: session.refreshToken,
                profile: userData,
            };
            await this.saveSession(updatedSession);
            return updatedSession;
        }
        catch {
            // Return null on profile fetch failure
            return null;
        }
    }
    async logout() {
        await this.storage.removeItem(STORAGE_KEY);
    }
    // --- Internals ---
    async saveSession(session) {
        // Clear any previous session data to ensure session regeneration
        await this.storage.removeItem(STORAGE_KEY);
        await this.storage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
    async readSession() {
        const raw = await this.storage.getItem(STORAGE_KEY);
        if (!raw)
            return null;
        // Try to parse as JSON first
        try {
            const parsed = JSON.parse(raw);
            return this.processParsedSession(parsed);
        }
        catch (error) {
            console.error("Error parsing session token:", error);
            // Fall back to legacy string token storage
            if (typeof raw === "string" && raw.startsWith("{") === false) {
                return { accessToken: raw };
            }
        }
        return null;
    }
    processParsedSession(parsed) {
        // Use Zod to validate the parsed session object
        const validationResult = (0, validationSchemas_1.validateSafe)(validationSchemas_1.AuthSessionSchema, parsed);
        if (validationResult.success) {
            return validationResult.data;
        }
        // For backward compatibility with old stored data that might have empty tokens,
        // we'll try a more permissive validation but only for the case where access token exists
        if (typeof parsed === 'object' && parsed !== null) {
            const parsedObj = parsed;
            if ('accessToken' in parsedObj && typeof parsedObj.accessToken === 'string') {
                // Return a session with just the access token, setting others to undefined if missing
                return {
                    accessToken: parsedObj.accessToken,
                    refreshToken: typeof parsedObj.refreshToken === 'string' ? parsedObj.refreshToken : undefined,
                    profile: this.isUserProfile(parsedObj.profile) ? parsedObj.profile : undefined
                };
            }
        }
        return null;
    }
    isUserProfile(data) {
        if (!data || typeof data !== 'object')
            return false;
        const profile = data;
        return typeof profile.id === 'string' && typeof profile.email === 'string';
    }
    initializeInterceptors() {
        this.apiClient.interceptors.response.use((response) => response, async (error) => {
            const config = error.config;
            if (!config)
                return Promise.reject(error);
            config._retryCount = config._retryCount || 0;
            const shouldRetry = config._retryCount < RETRY_CONFIG.maxRetries &&
                (!error.response ||
                    RETRY_CONFIG.retryableStatus.includes(error.response.status));
            if (shouldRetry) {
                config._retryCount += 1;
                const delay = RETRY_CONFIG.initialDelayMs * Math.pow(2, config._retryCount - 1);
                await new Promise((resolve) => setTimeout(resolve, delay));
                return this.apiClient(config);
            }
            return Promise.reject(error);
        });
    }
}
exports.AuthRepository = AuthRepository;
