/**
 * Path: src/features/auth/repositories/AuthRepository.ts
 * A stateless API layer that only makes direct calls to the backend
 */
import { IAuthRepository, LoginRequestDTO, RegisterRequestDTO, RequestOtpDTO, VerifyOtpDTO, CompletePasswordResetDTO, CompleteRegistrationDTO, AuthSession, IStorage } from "../types";
export declare class AuthRepository implements IAuthRepository {
    private apiClient;
    private storage;
    constructor(storage: IStorage, baseURL?: string);
    /**
     * Authenticates a user by email and password.
     */
    login: (payload: LoginRequestDTO) => Promise<AuthSession>;
    register: (payload: RegisterRequestDTO) => Promise<void>;
    requestPasswordReset: (payload: RequestOtpDTO) => Promise<void>;
    verifyOtp: (payload: VerifyOtpDTO) => Promise<string>;
    completeRegistration: (payload: CompleteRegistrationDTO) => Promise<void>;
    completePasswordReset: (payload: CompletePasswordResetDTO) => Promise<void>;
    /**
     * Checks current session by reading from storage
     * (state management is handled by the auth machine)
     */
    checkSession: () => Promise<AuthSession | null>;
    /**
     * Refreshes the access token using a refresh token.
     * NOTE: This method only refreshes the token, without fetching updated user profile.
     * Profile updates should be handled separately by the calling component/state machine.
     */
    refresh: (refreshToken: string) => Promise<AuthSession>;
    /**
     * Refreshes the user profile data without requiring a token refresh.
     */
    refreshProfile: () => Promise<AuthSession | null>;
    logout: () => Promise<void>;
    private saveSession;
    private readSession;
    private processParsedSession;
    private isUserProfile;
    private initializeInterceptors;
}
