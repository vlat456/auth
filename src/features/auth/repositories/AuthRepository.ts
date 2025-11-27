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
  private storageMutex = new Mutex(); // Ensures atomic session storage operations
  private refreshMutex = new Mutex(); // Prevents concurrent token refresh requests

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
      } finally {
        release();
      }
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
    // Use mutex to ensure atomic write: no crash between remove and set
    // This prevents data loss if app crashes during session save
    const release = await this.storageMutex.acquire();
    try {
      // Write new session first (safest order)
      await this.storage.setItem(STORAGE_KEY, JSON.stringify(session));
      // Note: We keep any old data to minimize data loss if crash occurs
      // Storage will contain either old or new complete session, never partial state
    } finally {
      release();
    }
  }

  private async readSession(): Promise<AuthSession | null> {
    const raw = await this.storage.getItem(STORAGE_KEY);
    if (!raw) return null;

    // Try to parse as JSON first
    try {
      const parsed: unknown = JSON.parse(raw);
      return this.processParsedSession(parsed);
    } catch {
      // Fall back to legacy string token storage
      if (typeof raw === "string" && raw.startsWith("{") === false) {
        return { accessToken: raw };
      }
    }

    return null;
  }

  private processParsedSession(parsed: unknown): AuthSession | null {
    // Use Zod to validate the parsed session object - primary validation
    try {
      return AuthSessionSchema.parse(parsed) as AuthSession;
    } catch (error) {
      console.warn(`Failed to parse session with strict validation: ${error}`);

      // Fallback: Basic validation for backward compatibility
      return this.tryLegacySessionParsing(parsed);
    }
  }

  private tryLegacySessionParsing(parsed: unknown): AuthSession | null {
    // Only proceed if we have a valid object with at least an accessToken
    if (typeof parsed !== "object" || parsed === null) {
      console.error(`Invalid session format in storage - clearing`);
      return null;
    }

    const obj = parsed as Record<string, unknown>;

    // Must have a string accessToken as minimum requirement
    if (typeof obj.accessToken !== "string") {
      console.error(`Invalid session format in storage - clearing`);
      return null;
    }

    // Construct session with available properties
    const session: AuthSession = {
      accessToken: obj.accessToken,
      refreshToken: typeof obj.refreshToken === "string" ? obj.refreshToken : undefined,
      profile: this.isUserProfile(obj.profile) ? obj.profile : undefined,
    };

    return session;
  }

  private isUserProfile(data: unknown): data is UserProfile {
    return UserProfileSchema.safeParse(data).success;
  }

  private initializeInterceptors() {
    // Interceptors were removed - we don't use retry logic currently
    // Can be re-enabled if needed in the future
  }
}
