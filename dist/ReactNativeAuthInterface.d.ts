/**
 * React Native Authentication Interface
 * Provides a simple interface to access auth functions from React Native
 */
import { LoginRequestDTO, RegisterRequestDTO, RequestOtpDTO, VerifyOtpDTO, CompleteRegistrationDTO, CompletePasswordResetDTO, AuthSession, ChangePasswordRequestDTO, DeleteAccountRequestDTO } from './features/auth/types';
export declare class ReactNativeAuthInterface {
    private authRepository;
    constructor(apiBaseURL?: string);
    /**
     * Login with email and password
     */
    login(payload: LoginRequestDTO): Promise<AuthSession>;
    /**
     * Register a new user
     */
    register(payload: RegisterRequestDTO): Promise<void>;
    /**
     * Request password reset (sends OTP)
     */
    requestPasswordReset(payload: RequestOtpDTO): Promise<void>;
    /**
     * Verify OTP code
     */
    verifyOtp(payload: VerifyOtpDTO): Promise<string>;
    /**
     * Complete password reset
     */
    completePasswordReset(payload: CompletePasswordResetDTO): Promise<void>;
    /**
     * Complete registration with action token and new password
     */
    completeRegistration(payload: CompleteRegistrationDTO): Promise<void>;
    /**
     * Check current session (validates and refreshes if needed)
     */
    checkSession(): Promise<AuthSession | null>;
    /**
     * Logout the current user
     */
    logout(): Promise<void>;
    /**
     * Refresh session using refresh token
     */
    refresh(refreshToken: string): Promise<AuthSession>;
    /**
     * Change user password
     */
    changePassword(payload: ChangePasswordRequestDTO): Promise<void>;
    /**
     * Delete user account
     */
    deleteAccount(payload: DeleteAccountRequestDTO): Promise<void>;
    /**
     * Get the current session without validation
     */
    getCurrentSession(): Promise<AuthSession | null>;
}
