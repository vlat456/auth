/**
 * Path: src/features/auth/repositories/AuthRepository.ts
 * A stateless API layer that only makes direct calls to the backend
 */

import axios, { AxiosInstance } from "axios";
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
  RefreshResponseData,
  UserProfile,
  IStorage,
} from "../types";
import { withErrorHandling } from "../utils/errorHandler";
import { Mutex } from "../utils/lockUtils";
import { SessionManager } from "../utils/SessionManager";
import { ValidationManager } from "../managers/ValidationManager";

const STORAGE_KEY = "user_session_token";

export class AuthRepository implements IAuthRepository {
  private apiClient: AxiosInstance;
  private storage: IStorage;
  private sessionManager: SessionManager;
  private validationManager: ValidationManager;
  private refreshMutex = new Mutex(); // Prevents concurrent token refresh requests

  constructor(storage: IStorage, baseURL?: string) {
    this.storage = storage;
    this.sessionManager = new SessionManager({ storage });
    this.validationManager = new ValidationManager();

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

      // Validate using ValidationManager
      const validation = this.validationManager.validateLoginResponse(response.data);
      if (!validation.success || !validation.data) {
        throw new Error(`Invalid login response: ${validation.error || 'Validation data is missing'}`);
      }

      const session = this.sessionManager.createSession(
        validation.data.data.accessToken,
        validation.data.data.refreshToken
      );

      await this.sessionManager.saveSession(session);
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
    return await this.sessionManager.readSession();
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
  refresh = withErrorHandling(
    async (refreshToken: string): Promise<AuthSession> => {
      const release = await this.refreshMutex.acquire();
      try {
        const response = await this.apiClient.post<
          ApiSuccessResponse<RefreshResponseData>
        >("/auth/refresh-token", { refreshToken });

        // Validate using ValidationManager
        const validation = this.validationManager.validateRefreshResponse(response.data);
        if (!validation.success || !validation.data) {
          throw new Error(`Invalid refresh response: ${validation.error || 'Validation data is missing'}`);
        }

        const newAccessToken = validation.data.data.accessToken;

        // Get the current session to preserve other data
        const currentSession = await this.sessionManager.readSession();
        if (!currentSession) {
          throw new Error("No current session found during refresh");
        }

        // Create new session with fresh access token, keep refresh token, and preserve profile
        // Profile updates should be handled separately by the calling component/state machine
        const refreshedSession = this.sessionManager.createRefreshedSession(
          currentSession,
          newAccessToken
        );

        await this.sessionManager.saveSession(refreshedSession);
        return refreshedSession;
      } finally {
        release();
      }
    }
  );

  /**
   * Refreshes the user profile data without requiring a token refresh.
   */
  refreshProfile = withErrorHandling(async (): Promise<AuthSession | null> => {
    const session = await this.sessionManager.readSession();
    if (!session) return null;

    const response = await this.apiClient.get<UserProfile>("/auth/me", {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });

    const userData = response.data;
    const validation = this.validationManager.validateUserProfile(userData);
    if (!validation.success) {
      return null;
    }

    // Update session with fresh profile
    const updatedSession = this.sessionManager.updateProfile(session, userData);

    await this.sessionManager.saveSession(updatedSession);
    return updatedSession;
  });

  logout = withErrorHandling(async (): Promise<void> => {
    await this.sessionManager.removeSession();
  });

  // --- Internals ---

  private isUserProfile(data: unknown): data is UserProfile {
    return this.validationManager.validateUserProfile(data).success;
  }

  private initializeInterceptors() {
    // Interceptors were removed - we don't use retry logic currently
    // Can be re-enabled if needed in the future
  }
}
