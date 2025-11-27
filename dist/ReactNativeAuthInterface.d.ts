/**
 * React Native Authentication Interface
 *
 * This is the public API for authentication in React Native apps.
 * All interactions go through AuthService - the machine is completely hidden.
 */
import { LoginRequestDTO, RegisterRequestDTO, RequestOtpDTO, VerifyOtpDTO, CompleteRegistrationDTO, CompletePasswordResetDTO, AuthSession, ChangePasswordRequestDTO, DeleteAccountRequestDTO, AuthState } from "./features/auth/types";
export declare class ReactNativeAuthInterface {
    private authService;
    constructor(apiBaseURL?: string);
    /**
     * Check and restore session on app startup
     */
    checkSession(): Promise<AuthSession | null>;
    /**
     * Login with email and password
     */
    login(payload: LoginRequestDTO): Promise<AuthSession>;
    /**
     * Register a new user
     */
    register(payload: RegisterRequestDTO): Promise<void>;
    /**
     * Request password reset (sends OTP to email)
     */
    requestPasswordReset(payload: RequestOtpDTO): Promise<void>;
    /**
     * Verify OTP code
     */
    verifyOtp(payload: VerifyOtpDTO): Promise<string>;
    /**
     * Complete password reset with new password
     */
    completePasswordReset(payload: CompletePasswordResetDTO): Promise<void>;
    /**
     * Complete registration with action token and password
     */
    completeRegistration(payload: CompleteRegistrationDTO): Promise<void>;
    /**
     * Refresh session using refresh token
     */
    refresh(): Promise<AuthSession | null>;
    /**
     * Logout the current user
     */
    logout(): Promise<void>;
    /**
     * Change user password
     */
    changePassword(_payload: ChangePasswordRequestDTO): Promise<void>;
    /**
     * Delete user account
     */
    deleteAccount(_payload: DeleteAccountRequestDTO): Promise<void>;
    /**
     * Get the current session without waiting for validation
     */
    getCurrentSession(): AuthSession | null;
    /**
     * Check if user is currently logged in
     */
    isLoggedIn(): boolean;
    /**
     * Check if currently processing a request
     */
    isLoading(): boolean;
    /**
     * Check if there's a current error
     */
    hasError(): boolean;
    /**
     * Get the current error, if any
     */
    getError(): import("./features/auth/types").AuthError | null;
    /**
     * Get the current auth state value
     */
    getAuthState(): AuthState;
    /**
     * Subscribe to auth state changes
     * Returns unsubscribe function
     */
    subscribe(callback: (state: AuthState) => void): () => void;
    /**
     * Navigate to login flow
     */
    goToLogin(): void;
    /**
     * Navigate to registration flow
     */
    goToRegister(): void;
    /**
     * Navigate to password reset flow
     */
    goToForgotPassword(): void;
    /**
     * Cancel current operation
     */
    cancel(): void;
}
