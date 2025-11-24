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
  UserProfile,
  IStorage,
} from "../types";

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

  async login(payload: LoginRequestDTO): Promise<AuthSession> {
    try {
      const { data } = await this.apiClient.post<
        ApiSuccessResponse<LoginResponseDTO>
      >("/auth/login", payload);
      const session: AuthSession = {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      };
      await this.saveSession(session);
      return session;
    } catch (error) {
      this.handleError(error);
    }
  }

  async register(payload: RegisterRequestDTO): Promise<void> {
    try {
      await this.apiClient.post("/auth/register", payload);
    } catch (error) {
      this.handleError(error);
    }
  }

  async requestPasswordReset(payload: RequestOtpDTO): Promise<void> {
    try {
      await this.apiClient.post("/auth/otp/request", payload);
    } catch (error) {
      this.handleError(error);
    }
  }

  async verifyOtp(payload: VerifyOtpDTO): Promise<string> {
    try {
      const { data } = await this.apiClient.post<
        ApiSuccessResponse<{ actionToken: string }>
      >("/auth/otp/verify", payload);
      return data.data.actionToken;
    } catch (error) {
      this.handleError(error);
    }
  }

  async completeRegistration(
    payload: CompleteRegistrationDTO
  ): Promise<void> {
    try {
      await this.apiClient.post("/auth/register/complete", payload);
    } catch (error) {
      this.handleError(error);
    }
  }

  async completePasswordReset(
    payload: CompletePasswordResetDTO
  ): Promise<void> {
    try {
      await this.apiClient.post("/auth/password/reset/complete", payload);
    } catch (error) {
      this.handleError(error);
    }
  }

  async checkSession(): Promise<AuthSession | null> {
    try {
      const session = await this.readSession();
      if (!session) return null;

      if (this.isTokenExpired(session.accessToken)) {
        await this.logout();
        return null;
      }

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
          await this.logout();
        }
      }
      return null;
    }
  }

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

  private handleError(error: any): never {
    if (axios.isAxiosError(error)) {
      const response = error.response;
      const responseData = response ? response.data : undefined;
      if (
        responseData &&
        typeof responseData === "object" &&
        typeof (responseData as any).message === "string" &&
        (responseData as any).message
      ) {
        throw new Error((responseData as any).message);
      }

      if (typeof error.message === "string" && error.message) {
        throw new Error(error.message);
      }

      throw new Error("An unexpected error occurred");
    }

    throw new Error("An unexpected error occurred");
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
