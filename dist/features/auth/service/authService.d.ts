/**
 * Path: src/features/auth/service/authService.ts
 * Authentication service that manages the auth machine instance
 *
 * This service provides the ONLY public interface to authentication.
 * The XState machine is completely encapsulated - consumers cannot access it directly.
 *
 * All interactions with the auth system go through this service layer.
 */
import { SnapshotFrom } from "xstate";
import { createAuthMachine } from "../machine/authMachine";
import { IAuthRepository, AuthSession, AuthError, LoginRequestDTO, RegisterRequestDTO, RequestOtpDTO, VerifyOtpDTO, CompleteRegistrationDTO, CompletePasswordResetDTO, AuthState } from "../types";
import { AuthContext } from "../machine/authMachine";
type AuthSnapshot = SnapshotFrom<ReturnType<typeof createAuthMachine>>;
/**
 * AuthService - Comprehensive authentication service layer
 *
 * This service abstracts away XState internals and provides a clean API for:
 * - Authentication flows (login, register, password reset)
 * - State management (get current state, subscribe to changes)
 * - State queries (isLoggedIn, isLoading, hasError, etc.)
 * - Event sending (with type-safe helpers)
 */
export declare class AuthService {
    private actor;
    private repository;
    private stateListeners;
    private activeTimeouts;
    constructor(repository: IAuthRepository);
    /**
     * Helper method to safely clean up a timeout
     * Clears the timeout and removes it from the active timeouts set
     */
    private cleanupTimeout;
    /**
     * ===========================
     * State Query Methods
     * ===========================
     * Check the current state without needing to access the machine
     */
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
    getError(): AuthError | null;
    /**
     * Get the current session
     */
    getSession(): AuthSession | null;
    /**
     * Get the current authentication state value
     * (e.g., 'authorized', 'unauthorized', { unauthorized: { login: 'idle' } })
     */
    getState(): AuthState;
    /**
     * Check if in a specific state
     *
     * @param pattern - The state pattern to match.
     * Common patterns are provided in AuthState type, but XState accepts complex nested patterns.
     */
    matches(pattern: AuthState | string): boolean;
    /**
     * Get all current context data
     */
    getContext(): AuthContext;
    /**
     * ===========================
     * Subscription Methods
     * ===========================
     * For reactive UI updates
     */
    /**
     * Subscribe to state changes
     * Returns unsubscribe function
     */
    subscribe(callback: (state: AuthSnapshot) => void): () => void;
    /**
     * ===========================
     * Authentication Flow Methods
     * ===========================
     * High-level methods for performing auth operations
     */
    /**
     * Check and restore session on app start
     *
     * Timeout protects against state machine getting stuck during session recovery.
     * If recovery doesn't complete within timeout, rejects with timeout error.
     */
    checkSession(): Promise<AuthSession | null>;
    /**
     * Login with email and password
     *
     * Timeout protects against state machine getting stuck during login.
     * If login doesn't complete within timeout, rejects with timeout error
     * and cleans up subscription to prevent memory leak.
     */
    login(payload: LoginRequestDTO): Promise<AuthSession>;
    /**
     * Register a new user
     *
     * Timeout protects against state machine getting stuck during registration.
     * If registration doesn't complete within timeout, rejects with timeout error
     * and cleans up subscription to prevent memory leak.
     */
    register(payload: RegisterRequestDTO): Promise<void>;
    /**
     * Request password reset (sends OTP to email)
     *
     * Timeout protects against state machine getting stuck during OTP request.
     * If request doesn't complete within timeout, rejects with timeout error
     * and cleans up subscription to prevent memory leak.
     */
    requestPasswordReset(payload: RequestOtpDTO): Promise<void>;
    /**
     * Verify OTP code (returns action token for next step)
     *
     * Timeout protects against state machine getting stuck during OTP verification.
     * If verification doesn't complete within timeout, rejects with timeout error
     * and cleans up subscription to prevent memory leak.
     */
    verifyOtp(payload: VerifyOtpDTO): Promise<string>;
    /**
     * Complete password reset with new password
     *
     * Timeout protects against state machine getting stuck during password reset.
     * If reset doesn't complete within timeout, rejects with timeout error
     * and cleans up subscription to prevent memory leak.
     */
    completePasswordReset(payload: CompletePasswordResetDTO): Promise<void>;
    /**
     * Complete registration with action token and password
     *
     * Timeout protects against state machine getting stuck during registration completion.
     * If completion doesn't complete within timeout, rejects with timeout error
     * and cleans up subscription to prevent memory leak.
     */
    completeRegistration(payload: CompleteRegistrationDTO): Promise<void>;
    /**
     * Refresh the session using the refresh token
     *
     * Timeout protects against state machine getting stuck during token refresh.
     * If refresh doesn't complete within timeout, rejects with timeout error
     * and cleans up subscription to prevent memory leak.
     */
    refresh(): Promise<AuthSession | null>;
    /**
     * Logout the current user
     *
     * Timeout protects against state machine getting stuck during logout.
     * If logout doesn't complete within timeout, rejects with timeout error
     * and cleans up subscription to prevent memory leak.
     */
    logout(): Promise<void>;
    /**
     * ===========================
     * Navigation Methods
     * ===========================
     * For transitioning between auth flows
     */
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
     * Cancel current operation and return to previous state
     */
    cancel(): void;
    /**
     * ===========================
     * Private Methods
     * ===========================
     */
    /**
     * Internal method to send events to the machine
     * This is private - use high-level methods instead
     */
    private _send;
    /**
     * Stop the service when no longer needed
     */
    stop(): void;
}
export {};
