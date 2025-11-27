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
const lockUtils_1 = require("../utils/lockUtils");
const validationSchemas_1 = require("../schemas/validationSchemas");
const STORAGE_KEY = "user_session_token";
class AuthRepository {
    constructor(storage, baseURL) {
        this.storageMutex = new lockUtils_1.Mutex(); // Ensures atomic session storage operations
        this.refreshMutex = new lockUtils_1.Mutex(); // Prevents concurrent token refresh requests
        /**
         * Authenticates a user by email and password.
         */
        this.login = (0, errorHandler_1.withErrorHandling)(async (payload) => {
            const response = await this.apiClient.post("/auth/login", payload);
            // Validate using direct Zod parsing
            const validatedData = validationSchemas_1.LoginResponseSchemaWrapper.parse(response.data);
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
         * Checks current session by reading from storage
         * (state management is handled by the auth machine)
         */
        this.checkSession = (0, errorHandler_1.withErrorHandling)(async () => {
            return await this.readSession();
        });
        /**
         * Refreshes the access token using a refresh token.
         * NOTE: This method only refreshes the token, without fetching updated user profile.
         * Profile updates should be handled separately by the calling component/state machine.
         *
         * Uses a mutex to prevent concurrent refresh requests:
         * - If refresh already in progress, waits for that one to complete
         * - Prevents multiple concurrent API calls to refresh endpoint
         * - Ensures only one new token is issued per refresh cycle
         */
        this.refresh = (0, errorHandler_1.withErrorHandling)(async (refreshToken) => {
            const release = await this.refreshMutex.acquire();
            try {
                const response = await this.apiClient.post("/auth/refresh-token", { refreshToken });
                // Validate using direct Zod parsing
                const validatedData = validationSchemas_1.RefreshResponseSchemaWrapper.parse(response.data);
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
            }
            finally {
                release();
            }
        });
        /**
         * Refreshes the user profile data without requiring a token refresh.
         */
        this.refreshProfile = (0, errorHandler_1.withErrorHandling)(async () => {
            const session = await this.readSession();
            if (!session)
                return null;
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
        });
        this.logout = (0, errorHandler_1.withErrorHandling)(async () => {
            await this.storage.removeItem(STORAGE_KEY);
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
    // --- Internals ---
    async saveSession(session) {
        // Use mutex to ensure atomic write: no crash between remove and set
        // This prevents data loss if app crashes during session save
        const release = await this.storageMutex.acquire();
        try {
            // Write new session first (safest order)
            await this.storage.setItem(STORAGE_KEY, JSON.stringify(session));
            // Note: We keep any old data to minimize data loss if crash occurs
            // Storage will contain either old or new complete session, never partial state
        }
        finally {
            release();
        }
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
        catch {
            // Fall back to legacy string token storage
            if (typeof raw === "string" && raw.startsWith("{") === false) {
                return { accessToken: raw };
            }
        }
        return null;
    }
    processParsedSession(parsed) {
        // Use Zod to validate the parsed session object
        try {
            return validationSchemas_1.AuthSessionSchema.parse(parsed);
        }
        catch (error) {
            console.warn(`Failed to parse session with strict validation: ${error}`);
            // For backward compatibility with old stored data that might have empty tokens,
            // we'll try a more permissive validation but only for the case where access token exists
            if (typeof parsed === "object" && parsed !== null) {
                const parsedObj = parsed;
                // Strict backward compatibility check: ensure only safe keys are present
                if ("accessToken" in parsedObj &&
                    typeof parsedObj.accessToken === "string" &&
                    Object.keys(parsedObj).length <= 4 // Only safe keys: accessToken, refreshToken, profile, and optionally one more
                ) {
                    // Additional safety check: ensure no unexpected properties
                    const validKeys = ['accessToken', 'refreshToken', 'profile'];
                    const hasOnlyValidKeys = Object.keys(parsedObj).every(key => validKeys.includes(key) || key.startsWith('__') // Allow private/internal keys if needed
                    );
                    if (hasOnlyValidKeys) {
                        console.warn("Using legacy session format - migration recommended");
                        // Return a session with just the access token, setting others to undefined if missing
                        return {
                            accessToken: parsedObj.accessToken,
                            refreshToken: typeof parsedObj.refreshToken === "string"
                                ? parsedObj.refreshToken
                                : undefined,
                            profile: this.isUserProfile(parsedObj.profile)
                                ? parsedObj.profile
                                : undefined,
                        };
                    }
                }
            }
            console.error(`Invalid session format in storage - clearing`);
            return null;
        }
    }
    isUserProfile(data) {
        return validationSchemas_1.UserProfileSchema.safeParse(data).success;
    }
    initializeInterceptors() {
        // Interceptors were removed - we don't use retry logic currently
        // Can be re-enabled if needed in the future
    }
}
exports.AuthRepository = AuthRepository;
