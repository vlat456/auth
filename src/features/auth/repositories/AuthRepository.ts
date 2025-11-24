/**
 * Path: src/features/auth/repositories/AuthRepository.ts
 * Version: 0.2.0
 */

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import {
  IAuthRepository,
  LoginRequestDTO,
  RegisterRequestDTO,
  RequestOtpDTO,
  VerifyOtpDTO,
  CompletePasswordResetDTO,
  CompleteRegistrationDTO,
  AuthSession,
  ApiSuccessResponse,
  LoginResponseDTO,
  RefreshRequestDTO,
  RefreshResponseData,
  UserProfile,
  IStorage,
} from "../types";
import { withErrorHandling } from "../utils/errorHandler";
import {
  hasRequiredProperties,
  isUserProfile,
  safeGetNestedValue,
} from "../utils/safetyUtils";

const STORAGE_KEY = "user_session_token";

interface RetryConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  retryableStatus: [500, 502, 503, 504],
};

export class AuthRepository implements IAuthRepository {
  private apiClient: AxiosInstance;
  private storage: IStorage;

  constructor(
    storage: IStorage,
    baseURL: string = "https://api.astra.example.com"
  ) {
    this.storage = storage;
    this.apiClient = axios.create({
      baseURL,
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });

    this.initializeInterceptors();
  }

  /**
   * Authenticates a user by email and password.
   * Returns an AuthSession with access token and optional refresh token.
   */
  login = withErrorHandling(
    async (payload: LoginRequestDTO): Promise<AuthSession> => {
      const response = await this.apiClient.post<
        ApiSuccessResponse<LoginResponseDTO>
      >("/auth/login", payload);

      // Validate the response structure before accessing nested properties
      const responseData = response.data;
      if (
        !hasRequiredProperties<Record<string, unknown>>(responseData, ["data"])
      ) {
        throw new Error("Invalid login response: missing data property");
      }

      const dataPayload = safeGetNestedValue(responseData, "data");
      if (
        !hasRequiredProperties<Record<string, unknown>>(dataPayload, [
          "accessToken",
        ])
      ) {
        throw new Error("Invalid login response: missing accessToken in data");
      }

      const accessToken = safeGetNestedValue<string>(
        dataPayload,
        "accessToken"
      );
      const refreshToken = safeGetNestedValue<string>(
        dataPayload,
        "refreshToken"
      );

      if (!accessToken || typeof accessToken !== "string") {
        throw new Error(
          "Invalid login response: accessToken is not a valid string"
        );
      }

      const session: AuthSession = {
        accessToken,
        refreshToken, // refreshToken can be undefined
      };
      await this.saveSession(session);
      return session;
    }
  );

  register = withErrorHandling(
    async (payload: RegisterRequestDTO): Promise<void> => {
      await this.apiClient.post("/auth/register", payload);
    }
  );

  requestPasswordReset = withErrorHandling(
    async (payload: RequestOtpDTO): Promise<void> => {
      await this.apiClient.post("/auth/otp/request", payload);
    }
  );

  verifyOtp = withErrorHandling(
    async (payload: VerifyOtpDTO): Promise<string> => {
      const { data } = await this.apiClient.post<
        ApiSuccessResponse<{ actionToken: string }>
      >("/auth/otp/verify", payload);
      return data.data.actionToken;
    }
  );

  completeRegistration = withErrorHandling(
    async (payload: CompleteRegistrationDTO): Promise<void> => {
      await this.apiClient.post("/auth/register/complete", payload);
    }
  );

  completePasswordReset = withErrorHandling(
    async (payload: CompletePasswordResetDTO): Promise<void> => {
      await this.apiClient.post("/auth/password/reset/complete", payload);
    }
  );

  async checkSession(): Promise<AuthSession | null> {
    // Step 1: Get the current session
    const session = await this.readSession();
    if (!session) return null;

    // Step 2: Handle expired access token with refresh
    if (this.isTokenExpired(session.accessToken)) {
      return await this.handleExpiredSession(session);
    }

    // Step 3: Validate session with server
    return await this.validateSessionWithServer(session);
  }

  private async handleExpiredSession(
    session: AuthSession
  ): Promise<AuthSession | null> {
    if (!session.refreshToken) {
      // No refresh token, so clear session and return null
      await this.logout();
      return null;
    }

    try {
      // Attempt to refresh the session using the refresh token
      return await this.refresh(session.refreshToken);
    } catch (refreshError: unknown) {
      // If refresh fails, logout and return null
      console.error("Token refresh failed:", refreshError);
      await this.logout();
      return null;
    }
  }

  private async validateSessionWithServer(
    session: AuthSession
  ): Promise<AuthSession | null> {
    try {
      const response = await this.apiClient.get<UserProfile>("/auth/me", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      // Validate the response data before using it
      const userData = response.data;
      if (!isUserProfile(userData)) {
        console.error("Invalid user profile received from server");
        return null;
      }

      const enrichedSession: AuthSession = { ...session, profile: userData };
      await this.saveSession(enrichedSession);
      return enrichedSession;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
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

  private async handle401Error(): Promise<AuthSession | null> {
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
    } catch (refreshError: unknown) {
      // If refresh fails, logout and return null
      console.error("Token refresh after 401 failed:", refreshError);
      await this.logout();
      return null;
    }
  }

  /**
   * Refreshes the access token using a refresh token.
   *
   * IMPORTANT: This method now automatically fetches fresh profile data from the server
   * to prevent carrying stale user information. If the profile fetch fails, it falls back
   * to the previously stored profile.
   *
   * Why profile is refreshed:
   * - User's role/permissions might have changed
   * - Account might be suspended or deleted
   * - Email or other user data might be outdated
   * - Without refresh, authorization decisions could be based on stale data
   *
   * Throws error if:
   * - Refresh token is invalid/expired
   * - No current session exists
   * - API returns invalid response
   *
   * Returns: AuthSession with new accessToken and fresh profile data
   */
  refresh = withErrorHandling(
    async (refreshToken: string): Promise<AuthSession> => {
      const response = await this.apiClient.post<
        ApiSuccessResponse<RefreshResponseData>
      >("/auth/refresh-token", { refreshToken } as RefreshRequestDTO);

      // Validate the response structure before accessing nested properties
      const responseData = response.data;
      if (
        !hasRequiredProperties<Record<string, unknown>>(responseData, ["data"])
      ) {
        throw new Error("Invalid refresh response: missing data property");
      }

      const dataPayload = safeGetNestedValue(responseData, "data");
      if (
        !hasRequiredProperties<Record<string, unknown>>(dataPayload, [
          "accessToken",
        ])
      ) {
        throw new Error(
          "Invalid refresh response: missing accessToken in data"
        );
      }

      const newAccessToken = safeGetNestedValue<string>(
        dataPayload,
        "accessToken"
      );
      if (!newAccessToken || typeof newAccessToken !== "string") {
        throw new Error(
          "Invalid refresh response: accessToken is not a valid string"
        );
      }

      // Get the current session to preserve other data
      const currentSession = await this.readSession();
      if (!currentSession) {
        throw new Error("No current session found during refresh");
      }

      // Fetch fresh profile data using the new access token to avoid stale user data
      let freshProfile: UserProfile | undefined;
      try {
        const profileResponse = await this.apiClient.get<UserProfile>(
          "/auth/me",
          {
            headers: { Authorization: `Bearer ${newAccessToken}` },
          }
        );

        const userData = profileResponse.data;
        if (isUserProfile(userData)) {
          freshProfile = userData;
        }
      } catch (profileError: unknown) {
        // Log profile fetch error but don't fail the refresh
        // The session can still be valid even if profile fetch fails
        console.warn(
          "Profile refresh failed during token refresh:",
          profileError
        );
        // Keep the existing profile as fallback
        freshProfile = currentSession.profile;
      }

      // Create new session with fresh access token, keep refresh token, and use fresh/fallback profile
      const refreshedSession: AuthSession = {
        accessToken: newAccessToken,
        refreshToken: currentSession.refreshToken,
        profile: freshProfile, // Use freshly fetched profile instead of stale one
      };

      await this.saveSession(refreshedSession);
      return refreshedSession;
    }
  );

  async logout(): Promise<void> {
    await this.storage.removeItem(STORAGE_KEY);
  }

  /**
   * Refreshes the user profile data without requiring a token refresh.
   * Useful when user profile might have been updated (e.g., role change, account suspension).
   * Returns the updated session or null if profile fetch fails or no valid session exists.
   */
  async refreshProfile(): Promise<AuthSession | null> {
    const session = await this.readSession();
    if (!session) return null;

    try {
      const response = await this.apiClient.get<UserProfile>("/auth/me", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      const userData = response.data;
      if (!isUserProfile(userData)) {
        return null;
      }

      // Update session with fresh profile
      const updatedSession: AuthSession = {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        profile: userData,
      };

      await this.saveSession(updatedSession);
      return updatedSession;
    } catch {
      // Return null on profile fetch failure
      return null;
    }
  }

  // --- Internals ---

  private async saveSession(session: AuthSession): Promise<void> {
    await this.storage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  private async readSession(): Promise<AuthSession | null> {
    const raw = await this.storage.getItem(STORAGE_KEY);
    if (!raw) return null;

    // Try to parse as JSON first
    try {
      const parsed: unknown = JSON.parse(raw);
      return this.processParsedSession(parsed);
    } catch (error) {
      console.error("Error parsing session token:", error);
      // Fall back to legacy string token storage
      if (typeof raw === "string" && raw.startsWith("{") === false) {
        return { accessToken: raw };
      }
    }

    return null;
  }

  private processParsedSession(parsed: unknown): AuthSession | null {
    // SECURITY: Explicitly reject arrays and primitives
    // Even though hasRequiredProperties checks this, defense in depth
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return null;
    }

    // Use hasRequiredProperties to validate the parsed object
    if (
      hasRequiredProperties<Record<string, unknown>>(parsed, ["accessToken"])
    ) {
      // Now that we know it has accessToken, we can safely cast
      const parsedToken = parsed as {
        accessToken: string;
        refreshToken?: string;
        profile?: UserProfile;
      };

      return {
        accessToken: parsedToken.accessToken,
        refreshToken: this.extractRefreshToken(parsedToken),
        profile: this.extractProfile(parsedToken),
      };
    }

    return null;
  }

  private extractRefreshToken(parsedToken: {
    refreshToken?: string;
  }): string | undefined {
    if (typeof parsedToken.refreshToken === "string") {
      return parsedToken.refreshToken;
    }
    return undefined;
  }

  private extractProfile(parsedToken: {
    profile?: UserProfile;
  }): UserProfile | undefined {
    if (parsedToken.profile && isUserProfile(parsedToken.profile)) {
      return parsedToken.profile;
    }
    return undefined;
  }

  /**
   * Decodes JWT locally to check 'exp' claim.
   * Returns true if expired or invalid format.
   *
   * SECURITY: This uses a "fail-secure" approach:
   * - If token cannot be decoded or validated, assume EXPIRED (return true)
   * - This forces the app to attempt token refresh or re-authentication
   * - Better to reject a valid token than accept an invalid one
   *
   * Why this matters:
   * - Malformed tokens could indicate tampering or corruption
   * - Incomplete decoding could hide validation errors
   * - Failure to parse = better to let server decide via authentication attempt
   */
  private isTokenExpired(token: string): boolean {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return true; // Not a JWT

      // Decode payload (2nd part)
      const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");

      let jsonString: string;
      if (typeof atob === "function") {
        // Browser / RN / Modern Node
        try {
          jsonString = atob(payloadBase64);
        } catch {
          // atob failed (invalid base64), assume expired
          return true;
        }
      } else if (typeof Buffer !== "undefined") {
        // Older Node environments
        try {
          jsonString = Buffer.from(payloadBase64, "base64").toString();
        } catch {
          // Buffer decode failed, assume expired
          return true;
        }
      } else {
        // No decoding method available - SECURITY: assume expired (fail-secure)
        // This forces server validation via refresh attempt
        return true;
      }

      const payload: { exp?: number } = JSON.parse(jsonString);

      // If exp field is missing, we cannot validate locally
      // SECURITY: assume expired to force server validation
      if (!payload.exp || typeof payload.exp !== "number") return true;

      // exp is in seconds, Date.now() is in ms
      const currentTime = Math.floor(Date.now() / 1000);

      return payload.exp < currentTime;
    } catch {
      // Any parsing error = assume expired (fail-secure)
      return true;
    }
  }

  private initializeInterceptors() {
    this.apiClient.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as RetryConfig;
        if (!config) return Promise.reject(error);

        config._retryCount = config._retryCount || 0;

        const shouldRetry =
          config._retryCount < RETRY_CONFIG.maxRetries &&
          (!error.response ||
            RETRY_CONFIG.retryableStatus.includes(error.response.status));

        if (shouldRetry) {
          config._retryCount += 1;
          const delay =
            RETRY_CONFIG.initialDelayMs * Math.pow(2, config._retryCount - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.apiClient(config);
        }
        return Promise.reject(error);
      }
    );
  }
}
