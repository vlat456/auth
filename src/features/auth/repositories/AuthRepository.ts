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
import { handleApiError, withErrorHandling } from "../utils/errorHandler";

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

  login = withErrorHandling(async (payload: LoginRequestDTO): Promise<AuthSession> => {
    const { data } = await this.apiClient.post<
      ApiSuccessResponse<LoginResponseDTO>
    >("/auth/login", payload);
    const session: AuthSession = {
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
    };
    await this.saveSession(session);
    return session;
  });

  register = withErrorHandling(async (payload: RegisterRequestDTO): Promise<void> => {
    await this.apiClient.post("/auth/register", payload);
  });

  requestPasswordReset = withErrorHandling(async (payload: RequestOtpDTO): Promise<void> => {
    await this.apiClient.post("/auth/otp/request", payload);
  });

  verifyOtp = withErrorHandling(async (payload: VerifyOtpDTO): Promise<string> => {
    const { data } = await this.apiClient.post<
      ApiSuccessResponse<{ actionToken: string }>
    >("/auth/otp/verify", payload);
    return data.data.actionToken;
  });

  completeRegistration = withErrorHandling(async (payload: CompleteRegistrationDTO): Promise<void> => {
    await this.apiClient.post("/auth/register/complete", payload);
  });

  completePasswordReset = withErrorHandling(async (payload: CompletePasswordResetDTO): Promise<void> => {
    await this.apiClient.post("/auth/password/reset/complete", payload);
  });

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

  private async handleExpiredSession(session: AuthSession): Promise<AuthSession | null> {
    if (!session.refreshToken) {
      // No refresh token, so clear session and return null
      await this.logout();
      return null;
    }

    try {
      // Attempt to refresh the session using the refresh token
      return await this.refresh(session.refreshToken);
    } catch (refreshError) {
      // If refresh fails, logout and return null
      await this.logout();
      return null;
    }
  }

  private async validateSessionWithServer(session: AuthSession): Promise<AuthSession | null> {
    try {
      const { data } = await this.apiClient.get<UserProfile>("/auth/me", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      const enrichedSession: AuthSession = { ...session, profile: data };
      await this.saveSession(enrichedSession);
      return enrichedSession;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const response = error.response;
        if (response && response.status === 401) {
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
    if (!session || !session.refreshToken) {
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
    } catch (refreshError) {
      // If refresh fails, logout and return null
      await this.logout();
      return null;
    }
  }

  refresh = withErrorHandling(async (refreshToken: string): Promise<AuthSession> => {
    const { data } = await this.apiClient.post<
      ApiSuccessResponse<RefreshResponseData>
    >("/auth/refresh-token", { refreshToken } as RefreshRequestDTO);

    // Get the current session to preserve other data
    const currentSession = await this.readSession();
    if (!currentSession) {
      throw new Error("No current session found during refresh");
    }

    // Create new session with fresh access token but keep existing refresh token and profile
    const refreshedSession: AuthSession = {
      accessToken: data.data.accessToken,
      refreshToken: currentSession.refreshToken, // Keep the existing refresh token
      profile: currentSession.profile // Keep the existing profile
    };

    await this.saveSession(refreshedSession);
    return refreshedSession;
  });

  async logout(): Promise<void> {
    await this.storage.removeItem(STORAGE_KEY);
  }

  // --- Internals ---

  private async saveSession(session: AuthSession): Promise<void> {
    await this.storage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  private async readSession(): Promise<AuthSession | null> {
    const raw = await this.storage.getItem(STORAGE_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.accessToken === "string") {
        let refreshToken: string | undefined;
        if (typeof parsed.refreshToken === "string") {
          refreshToken = parsed.refreshToken;
        }

        return {
          accessToken: parsed.accessToken,
          refreshToken,
          profile: parsed.profile,
        };
      }
    } catch {
      // Fall back to legacy string token storage
      if (typeof raw === "string" && raw.startsWith("{") === false) {
        return { accessToken: raw };
      }
    }

    return null;
  }

  /**
   * Decodes JWT locally to check 'exp' claim.
   * Returns true if expired or invalid format.
   */
  private isTokenExpired(token: string): boolean {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return true; // Not a JWT

      // Decode payload (2nd part)
      const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");

      let jsonString;
      if (typeof atob === "function") {
        // Browser / RN / Modern Node
        jsonString = atob(payloadBase64);
      } else if (typeof Buffer !== "undefined") {
        // Older Node environments (just in case)
        jsonString = Buffer.from(payloadBase64, "base64").toString();
      } else {
        // Fallback: assume not expired if we can't decode (safe fail-open to server)
        return false;
      }

      const payload = JSON.parse(jsonString);

      if (!payload.exp) return false; // No expiration field, let server decide

      // exp is in seconds, Date.now() is in ms
      const currentTime = Math.floor(Date.now() / 1000);

      return payload.exp < currentTime;
    } catch (e) {
      return true; // Malformed token
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
