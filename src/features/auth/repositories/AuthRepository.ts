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
  RefreshRequestDTO,
  RefreshResponseData,
  UserProfile,
  IStorage,
} from "../types";
import { withErrorHandling } from "../utils/errorHandler";
import { Mutex } from "../utils/lockUtils";
import { SessionManager } from "../utils/SessionManager";
import {
  LoginResponseSchemaWrapper,
  RefreshResponseSchemaWrapper,
  AuthSessionSchema,
  UserProfileSchema,
} from "../schemas/validationSchemas";

const STORAGE_KEY = "user_session_token";

export class AuthRepository implements IAuthRepository {
  private apiClient: AxiosInstance;
  private storage: IStorage;
  private sessionManager: SessionManager;
  private refreshMutex = new Mutex(); // Prevents concurrent token refresh requests

  constructor(storage: IStorage, baseURL?: string) {
    this.storage = storage;
    this.sessionManager = new SessionManager({ storage });

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
      const session = this.sessionManager.createSession(
        validatedData.data.accessToken,
        validatedData.data.refreshToken
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
        >("/auth/refresh-token", { refreshToken } as RefreshRequestDTO);

        // Validate using direct Zod parsing
        const validatedData = RefreshResponseSchemaWrapper.parse(response.data);
        const newAccessToken = validatedData.data.accessToken;

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
    if (!this.sessionManager.validateProfile(userData)) {
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
    return this.sessionManager.validateProfile(data);
  }

  private initializeInterceptors() {
    // Interceptors were removed - we don't use retry logic currently
    // Can be re-enabled if needed in the future
  }
}
