/**
 * Path: src/features/auth/repositories/AuthRepository.ts
 * A stateless API layer that only makes direct calls to the backend
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
  LoginResponseSchemaWrapper,
  RefreshResponseSchemaWrapper,
  AuthSessionSchema,
  UserProfileSchema,
} from "../schemas/validationSchemas";

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

  constructor(storage: IStorage, baseURL?: string) {
    this.storage = storage;

    const finalBaseURL = baseURL || "https://api.astra.example.com";

    this.apiClient = axios.create({
      baseURL: finalBaseURL,
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });

    this.initializeInterceptors();
  }

  /**
   * Authenticates a user by email and password.
   */
  login = withErrorHandling(
    async (payload: LoginRequestDTO): Promise<AuthSession> => {
      const response = await this.apiClient.post<
        ApiSuccessResponse<LoginResponseDTO>
      >("/auth/login", payload);

      // Validate using direct Zod parsing
      const validatedData = LoginResponseSchemaWrapper.parse(response.data);
      const session: AuthSession = {
        accessToken: validatedData.data.accessToken,
        refreshToken: validatedData.data.refreshToken,
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

  /**
   * Checks current session by reading from storage
   * (state management is handled by the auth machine)
   */
  checkSession = withErrorHandling(async (): Promise<AuthSession | null> => {
    return await this.readSession();
  });

  /**
   * Refreshes the access token using a refresh token.
   * NOTE: This method only refreshes the token, without fetching updated user profile.
   * Profile updates should be handled separately by the calling component/state machine.
   */
  refresh = withErrorHandling(
    async (refreshToken: string): Promise<AuthSession> => {
      const response = await this.apiClient.post<
        ApiSuccessResponse<RefreshResponseData>
      >("/auth/refresh-token", { refreshToken } as RefreshRequestDTO);

      // Validate using direct Zod parsing
      const validatedData = RefreshResponseSchemaWrapper.parse(response.data);
      const newAccessToken = validatedData.data.accessToken;

      // Get the current session to preserve other data
      const currentSession = await this.readSession();
      if (!currentSession) {
        throw new Error("No current session found during refresh");
      }

      // Create new session with fresh access token, keep refresh token, and preserve profile
      // Profile updates should be handled separately by the calling component/state machine
      const refreshedSession: AuthSession = {
        accessToken: newAccessToken,
        refreshToken: currentSession.refreshToken,
        profile: currentSession.profile, // Preserve the existing profile
      };

      await this.saveSession(refreshedSession);
      return refreshedSession;
    }
  );

  /**
   * Refreshes the user profile data without requiring a token refresh.
   */
  refreshProfile = withErrorHandling(async (): Promise<AuthSession | null> => {
    const session = await this.readSession();
    if (!session) return null;

    const response = await this.apiClient.get<UserProfile>("/auth/me", {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });

    const userData = response.data;
    if (!this.isUserProfile(userData)) {
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
  });

  logout = withErrorHandling(async (): Promise<void> => {
    await this.storage.removeItem(STORAGE_KEY);
  });

  // --- Internals ---

  private async saveSession(session: AuthSession): Promise<void> {
    // Clear any previous session data to ensure session regeneration
    await this.storage.removeItem(STORAGE_KEY);
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
    // Use Zod to validate the parsed session object
    try {
      return AuthSessionSchema.parse(parsed) as AuthSession;
    } catch {
      // For backward compatibility with old stored data that might have empty tokens,
      // we'll try a more permissive validation but only for the case where access token exists
      if (typeof parsed === "object" && parsed !== null) {
        const parsedObj = parsed as Record<string, unknown>;
        if (
          "accessToken" in parsedObj &&
          typeof parsedObj.accessToken === "string"
        ) {
          // Return a session with just the access token, setting others to undefined if missing
          return {
            accessToken: parsedObj.accessToken,
            refreshToken:
              typeof parsedObj.refreshToken === "string"
                ? parsedObj.refreshToken
                : undefined,
            profile: this.isUserProfile(parsedObj.profile)
              ? parsedObj.profile
              : undefined,
          };
        }
      }
      return null;
    }
  }

  private isUserProfile(data: unknown): data is UserProfile {
    return UserProfileSchema.safeParse(data).success;
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
