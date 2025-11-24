"use strict";
/**
 * Path: src/features/auth/repositories/AuthRepository.ts
 * Version: 0.2.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRepository = void 0;
const axios_1 = __importDefault(require("axios"));
const errorHandler_1 = require("../utils/errorHandler");
const safetyUtils_1 = require("../utils/safetyUtils");
const STORAGE_KEY = "user_session_token";
const RETRY_CONFIG = {
    maxRetries: 3,
    initialDelayMs: 1000,
    retryableStatus: [500, 502, 503, 504],
};
class AuthRepository {
    constructor(storage, baseURL = "https://api.astra.example.com") {
        this.login = (0, errorHandler_1.withErrorHandling)(async (payload) => {
            const response = await this.apiClient.post("/auth/login", payload);
            // Validate the response structure before accessing nested properties
            const responseData = response.data;
            if (!(0, safetyUtils_1.hasRequiredProperties)(responseData, ['data'])) {
                throw new Error("Invalid login response: missing data property");
            }
            const dataPayload = (0, safetyUtils_1.safeGetNestedValue)(responseData, 'data');
            if (!(0, safetyUtils_1.hasRequiredProperties)(dataPayload, ['accessToken'])) {
                throw new Error("Invalid login response: missing accessToken in data");
            }
            const accessToken = (0, safetyUtils_1.safeGetNestedValue)(dataPayload, 'accessToken');
            const refreshToken = (0, safetyUtils_1.safeGetNestedValue)(dataPayload, 'refreshToken');
            if (!accessToken || typeof accessToken !== 'string') {
                throw new Error("Invalid login response: accessToken is not a valid string");
            }
            const session = {
                accessToken,
                refreshToken, // refreshToken can be undefined
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
        this.refresh = (0, errorHandler_1.withErrorHandling)(async (refreshToken) => {
            const response = await this.apiClient.post("/auth/refresh-token", { refreshToken });
            // Validate the response structure before accessing nested properties
            const responseData = response.data;
            if (!(0, safetyUtils_1.hasRequiredProperties)(responseData, ['data'])) {
                throw new Error("Invalid refresh response: missing data property");
            }
            const dataPayload = (0, safetyUtils_1.safeGetNestedValue)(responseData, 'data');
            if (!(0, safetyUtils_1.hasRequiredProperties)(dataPayload, ['accessToken'])) {
                throw new Error("Invalid refresh response: missing accessToken in data");
            }
            const newAccessToken = (0, safetyUtils_1.safeGetNestedValue)(dataPayload, 'accessToken');
            if (!newAccessToken || typeof newAccessToken !== 'string') {
                throw new Error("Invalid refresh response: accessToken is not a valid string");
            }
            // Get the current session to preserve other data
            const currentSession = await this.readSession();
            if (!currentSession) {
                throw new Error("No current session found during refresh");
            }
            // Create new session with fresh access token but keep existing refresh token and profile
            const refreshedSession = {
                accessToken: newAccessToken,
                refreshToken: currentSession.refreshToken, // Keep the existing refresh token
                profile: currentSession.profile, // Keep the existing profile
            };
            await this.saveSession(refreshedSession);
            return refreshedSession;
        });
        this.storage = storage;
        this.apiClient = axios_1.default.create({
            baseURL,
            headers: { "Content-Type": "application/json" },
            timeout: 10000,
        });
        this.initializeInterceptors();
    }
    async checkSession() {
        // Step 1: Get the current session
        const session = await this.readSession();
        if (!session)
            return null;
        // Step 2: Handle expired access token with refresh
        if (this.isTokenExpired(session.accessToken)) {
            return await this.handleExpiredSession(session);
        }
        // Step 3: Validate session with server
        return await this.validateSessionWithServer(session);
    }
    async handleExpiredSession(session) {
        if (!session.refreshToken) {
            // No refresh token, so clear session and return null
            await this.logout();
            return null;
        }
        try {
            // Attempt to refresh the session using the refresh token
            return await this.refresh(session.refreshToken);
        }
        catch (refreshError) {
            // If refresh fails, logout and return null
            console.error('Token refresh failed:', refreshError);
            await this.logout();
            return null;
        }
    }
    async validateSessionWithServer(session) {
        try {
            const response = await this.apiClient.get("/auth/me", {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            // Validate the response data before using it
            const userData = response.data;
            if (!(0, safetyUtils_1.isUserProfile)(userData)) {
                console.error("Invalid user profile received from server");
                return null;
            }
            const enrichedSession = { ...session, profile: userData };
            await this.saveSession(enrichedSession);
            return enrichedSession;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                const response = error.response;
                if (response?.status === 401) {
                    // Server rejected the token, try to refresh
                    return await this.handle401Error();
                }
            }
            // For other errors, return null without logging out
            return null;
        }
    }
    async handle401Error() {
        const session = await this.readSession();
        if (!session?.refreshToken) {
            // No session or no refresh token, just return null
            // Don't logout if there was no session to begin with
            if (session) {
                await this.logout();
            }
            return null;
        }
        try {
            // Attempt to refresh using the available refresh token
            return await this.refresh(session.refreshToken);
        }
        catch (refreshError) {
            // If refresh fails, logout and return null
            console.error('Token refresh after 401 failed:', refreshError);
            await this.logout();
            return null;
        }
    }
    async logout() {
        await this.storage.removeItem(STORAGE_KEY);
    }
    // --- Internals ---
    async saveSession(session) {
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
        // Use hasRequiredProperties to validate the parsed object
        if ((0, safetyUtils_1.hasRequiredProperties)(parsed, ['accessToken'])) {
            // Now that we know it has accessToken, we can safely cast
            const parsedToken = parsed;
            return {
                accessToken: parsedToken.accessToken,
                refreshToken: this.extractRefreshToken(parsedToken),
                profile: this.extractProfile(parsedToken),
            };
        }
        return null;
    }
    extractRefreshToken(parsedToken) {
        if (typeof parsedToken.refreshToken === "string") {
            return parsedToken.refreshToken;
        }
        return undefined;
    }
    extractProfile(parsedToken) {
        if (parsedToken.profile && (0, safetyUtils_1.isUserProfile)(parsedToken.profile)) {
            return parsedToken.profile;
        }
        return undefined;
    }
    /**
     * Decodes JWT locally to check 'exp' claim.
     * Returns true if expired or invalid format.
     */
    isTokenExpired(token) {
        try {
            const parts = token.split(".");
            if (parts.length !== 3)
                return true; // Not a JWT
            // Decode payload (2nd part)
            const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
            let jsonString;
            if (typeof atob === "function") {
                // Browser / RN / Modern Node
                jsonString = atob(payloadBase64);
            }
            else if (typeof Buffer !== "undefined") {
                // Older Node environments (just in case)
                jsonString = Buffer.from(payloadBase64, "base64").toString();
            }
            else {
                // Fallback: assume not expired if we can't decode (safe fail-open to server)
                return false;
            }
            const payload = JSON.parse(jsonString);
            if (!payload.exp)
                return false; // No expiration field, let server decide
            // exp is in seconds, Date.now() is in ms
            const currentTime = Math.floor(Date.now() / 1000);
            return payload.exp < currentTime;
        }
        catch {
            return true; // Malformed token
        }
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
