/**
 * Path: src/features/auth/service/authService.ts
 * Authentication service that manages the auth machine instance
 *
 * This service provides the ONLY public interface to authentication.
 * The XState machine is completely encapsulated - consumers cannot access it directly.
 *
 * All interactions with the auth system go through this service layer.
 */

import { createActor, ActorRefFrom, SnapshotFrom } from "xstate";
import { createAuthMachine } from "../machine/authMachine";
import {
  IAuthRepository,
  AuthSession,
  AuthError,
  LoginRequestDTO,
  RegisterRequestDTO,
  RequestOtpDTO,
  VerifyOtpDTO,
  CompleteRegistrationDTO,
  CompletePasswordResetDTO,
  AuthState,
} from "../types";
import { AuthContext, AuthEvent } from "../machine/authMachine";
import {
  AUTH_OPERATION_TIMEOUT_MS,
  SESSION_CHECK_TIMEOUT_MS,
} from "../utils/authConstants";

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
export class AuthService {
  private actor: ActorRefFrom<ReturnType<typeof createAuthMachine>>;
  private repository: IAuthRepository;
  private stateListeners: Set<(state: AuthSnapshot) => void> = new Set();
  private activeTimeouts: Set<NodeJS.Timeout> = new Set();

  constructor(repository: IAuthRepository) {
    this.repository = repository;
    const machine = createAuthMachine(this.repository);
    this.actor = createActor(machine);

    // Subscribe to internal changes to notify listeners
    this.actor.subscribe((state) => {
      this.stateListeners.forEach((listener) => listener(state));
    });

    this.actor.start();
  }

  /**
   * Helper method to safely clean up a timeout
   * Clears the timeout and removes it from the active timeouts set
   */
  private cleanupTimeout(timeoutId: NodeJS.Timeout): void {
    clearTimeout(timeoutId);
    this.activeTimeouts.delete(timeoutId);
  }

  /**
   * Generic helper to execute an auth operation with timeout protection
   *
   * @param event The event to send to the auth machine
   * @param successCondition Function to determine if a state represents success
   * @param errorCondition Function to determine if a state represents an error that should cause rejection
   * @param timeoutMs Timeout duration in milliseconds
   * @param timeoutMessage Message for timeout error
   * @param getResult Optional function to extract result from successful state (default: session)
   * @returns Promise that resolves with the result or rejects with an error
   */
  private executeWithTimeout<T>(
    event: AuthEvent,
    successCondition: (state: AuthSnapshot) => boolean,
    errorCondition: (state: AuthSnapshot) => boolean,
    timeoutMs: number,
    timeoutMessage: string,
    getResult?: (state: AuthSnapshot) => T
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout;
      let completed = false;

      const cleanup = () => {
        this.cleanupTimeout(timeoutId);
        completed = true;
        unsubscribe();
      };

      const unsubscribe = this.subscribe((state) => {
        if (completed) return;

        if (successCondition(state)) {
          cleanup();
          resolve(getResult ? getResult(state) : state.context.session as T);
        } else if (errorCondition(state)) {
          cleanup();
          reject(new Error(state.context.error!.message));
        }
      });

      // Set timeout to prevent indefinite hanging
      timeoutId = setTimeout(() => {
        if (!completed) {
          cleanup();
          // Reset machine to a safe state on timeout
          this._send({ type: "CANCEL" });
          reject(new Error(timeoutMessage));
        }
      }, timeoutMs);

      // Store the timeout ID for cleanup
      this.activeTimeouts.add(timeoutId);

      this._send(event);
    });
  }

  /**
   * ===========================
   * State Query Methods
   * ===========================
   * Check the current state without needing to access the machine
   */

  /**
   * Check if user is currently logged in
   */
  isLoggedIn(): boolean {
    return this.actor.getSnapshot().matches("authorized");
  }

  /**
   * Check if currently processing a request
   */
  isLoading(): boolean {
    const state = this.actor.getSnapshot();
    return state.hasTag("loading");
  }

  /**
   * Check if there's a current error
   */
  hasError(): boolean {
    return this.actor.getSnapshot().context.error !== null;
  }

  /**
   * Get the current error, if any
   */
  getError(): AuthError | null {
    return this.actor.getSnapshot().context.error;
  }

  /**
   * Get the current session
   */
  getSession(): AuthSession | null {
    return this.actor.getSnapshot().context.session;
  }

  /**
   * Get the current authentication state value
   * (e.g., 'authorized', 'unauthorized', { unauthorized: { login: 'idle' } })
   */
  getState(): AuthState {
    return this.actor.getSnapshot().value as AuthState;
  }

  /**
   * Check if in a specific state
   *
   * @param pattern - The state pattern to match.
   * Common patterns are provided in AuthState type, but XState accepts complex nested patterns.
   */
  matches(pattern: AuthState | string): boolean {
    // XState's matches function is flexible with complex nested patterns
    // The type is restrictive for common usage but allows escape hatch with string
    return this.actor.getSnapshot().matches(pattern as any);
  }

  /**
   * Get all current context data
   */
  getContext(): AuthContext {
    return this.actor.getSnapshot().context;
  }

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
  subscribe(callback: (state: AuthSnapshot) => void) {
    this.stateListeners.add(callback);
    return () => {
      this.stateListeners.delete(callback);
    };
  }

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
  checkSession(): Promise<AuthSession | null> {
    return this.executeWithTimeout<AuthSession | null>(
      { type: "CHECK_SESSION" },
      (state) => state.matches("authorized") || state.matches("unauthorized"), // Success when in stable state
      () => false, // No error state for checkSession - will just return null if unauthorized
      SESSION_CHECK_TIMEOUT_MS,
      `Session check timeout - state machine did not complete within ${SESSION_CHECK_TIMEOUT_MS}ms`,
      (state) => state.context.session
    );
  }

  /**
   * Login with email and password
   *
   * Timeout protects against state machine getting stuck during login.
   * If login doesn't complete within timeout, rejects with timeout error
   * and cleans up subscription to prevent memory leak.
   */
  login(payload: LoginRequestDTO): Promise<AuthSession> {
    return this.executeWithTimeout<AuthSession>(
      { type: "LOGIN", payload },
      (state) => state.matches("authorized"), // Success when authorized
      (state) => state.context.error !== null && state.matches({ unauthorized: { login: "idle" } }), // Error when login is back to idle with error
      AUTH_OPERATION_TIMEOUT_MS,
      `Login timeout - state machine did not complete within ${AUTH_OPERATION_TIMEOUT_MS}ms`
    );
  }

  /**
   * Register a new user
   *
   * Timeout protects against state machine getting stuck during registration.
   * If registration doesn't complete within timeout, rejects with timeout error
   * and cleans up subscription to prevent memory leak.
   */
  register(payload: RegisterRequestDTO): Promise<void> {
    return this.executeWithTimeout<void>(
      { type: "REGISTER", payload },
      (state) => state.matches("authorized"), // Success when authorized
      (state) => state.context.error !== null && state.matches({ unauthorized: { register: "form" } }), // Error when register is back to form with error
      AUTH_OPERATION_TIMEOUT_MS,
      `Register timeout - state machine did not complete within ${AUTH_OPERATION_TIMEOUT_MS}ms`,
      () => undefined // Register returns void
    );
  }

  /**
   * Request password reset (sends OTP to email)
   *
   * Timeout protects against state machine getting stuck during OTP request.
   * If request doesn't complete within timeout, rejects with timeout error
   * and cleans up subscription to prevent memory leak.
   */
  requestPasswordReset(payload: RequestOtpDTO): Promise<void> {
    return this.executeWithTimeout<void>(
      { type: "FORGOT_PASSWORD", payload },
      (state) => state.matches({ unauthorized: { forgotPassword: "verifyOtp" } }), // Success when in verifyOtp state
      (state) => state.context.error !== null && state.matches({ unauthorized: { forgotPassword: "idle" } }), // Error when forgotPassword is back to idle with error
      AUTH_OPERATION_TIMEOUT_MS,
      `Password reset request timeout - state machine did not complete within ${AUTH_OPERATION_TIMEOUT_MS}ms`,
      () => undefined // Request password reset returns void
    );
  }

  /**
   * Verify OTP code (returns action token for next step)
   *
   * Timeout protects against state machine getting stuck during OTP verification.
   * If verification doesn't complete within timeout, rejects with timeout error
   * and cleans up subscription to prevent memory leak.
   */
  verifyOtp(payload: VerifyOtpDTO): Promise<string> {
    return this.executeWithTimeout<string>(
      { type: "VERIFY_OTP", payload },
      (state) => {
        const token = state.context.passwordReset?.actionToken || state.context.registration?.actionToken;
        return !!(token && !state.hasTag("loading")); // Ensure return is boolean
      }, // Success when action token is available and not loading
      (state) => state.context.error !== null && !state.matches("authorized"), // Error when there's an error and not authorized
      AUTH_OPERATION_TIMEOUT_MS,
      `OTP verification timeout - state machine did not complete within ${AUTH_OPERATION_TIMEOUT_MS}ms`,
      (state) => {
        // Extract the action token from context
        return state.context.passwordReset?.actionToken || state.context.registration?.actionToken || "";
      }
    );
  }

  /**
   * Complete password reset with new password
   *
   * Timeout protects against state machine getting stuck during password reset.
   * If reset doesn't complete within timeout, rejects with timeout error
   * and cleans up subscription to prevent memory leak.
   */
  completePasswordReset(payload: CompletePasswordResetDTO): Promise<void> {
    return this.executeWithTimeout<void>(
      { type: "RESET_PASSWORD", payload },
      (state) => state.matches("authorized"), // Success when authorized
      (state) => state.context.error !== null && state.matches({ unauthorized: { forgotPassword: "resettingPassword" } }), // Error during resettingPassword
      AUTH_OPERATION_TIMEOUT_MS,
      `Complete password reset timeout - state machine did not complete within ${AUTH_OPERATION_TIMEOUT_MS}ms`,
      () => undefined // Complete password reset returns void
    );
  }

  /**
   * Complete registration with action token and password
   *
   * Timeout protects against state machine getting stuck during registration completion.
   * If completion doesn't complete within timeout, rejects with timeout error
   * and cleans up subscription to prevent memory leak.
   */
  completeRegistration(payload: CompleteRegistrationDTO): Promise<void> {
    return this.executeWithTimeout<void>(
      { type: "COMPLETE_REGISTRATION", payload },
      (state) => state.matches("authorized"), // Success when authorized
      (state) => state.context.error !== null, // Any error state
      AUTH_OPERATION_TIMEOUT_MS,
      `Complete registration timeout - state machine did not complete within ${AUTH_OPERATION_TIMEOUT_MS}ms`,
      () => undefined // Complete registration returns void
    );
  }

  /**
   * Refresh the session using the refresh token
   *
   * Timeout protects against state machine getting stuck during token refresh.
   * If refresh doesn't complete within timeout, rejects with timeout error
   * and cleans up subscription to prevent memory leak.
   */
  refresh(): Promise<AuthSession | null> {
    return this.executeWithTimeout<AuthSession | null>(
      { type: "REFRESH" },
      (state) => state.matches("authorized"), // Success when authorized
      (state) => state.context.error !== null, // Any error state
      AUTH_OPERATION_TIMEOUT_MS,
      `Refresh timeout - state machine did not complete within ${AUTH_OPERATION_TIMEOUT_MS}ms`,
      (state) => state.context.session
    );
  }

  /**
   * Logout the current user
   *
   * Timeout protects against state machine getting stuck during logout.
   * If logout doesn't complete within timeout, rejects with timeout error
   * and cleans up subscription to prevent memory leak.
   */
  logout(): Promise<void> {
    return this.executeWithTimeout<void>(
      { type: "LOGOUT" },
      (state) => state.matches("unauthorized"), // Success when unauthorized
      (state) => state.context.error !== null, // Any error state
      AUTH_OPERATION_TIMEOUT_MS,
      `Logout timeout - state machine did not complete within ${AUTH_OPERATION_TIMEOUT_MS}ms`,
      () => undefined // Logout returns void
    );
  }

  /**
   * ===========================
   * Navigation Methods
   * ===========================
   * For transitioning between auth flows
   */

  /**
   * Navigate to login flow
   */
  goToLogin(): void {
    this._send({ type: "GO_TO_LOGIN" });
  }

  /**
   * Navigate to registration flow
   */
  goToRegister(): void {
    this._send({ type: "GO_TO_REGISTER" });
  }

  /**
   * Navigate to password reset flow
   */
  goToForgotPassword(): void {
    this._send({ type: "GO_TO_FORGOT_PASSWORD" });
  }

  /**
   * Cancel current operation and return to previous state
   */
  cancel(): void {
    this._send({ type: "CANCEL" });
  }

  /**
   * ===========================
   * Private Methods
   * ===========================
   */

  /**
   * Internal method to send events to the machine
   * This is private - use high-level methods instead
   */
  private _send(event: AuthEvent): void {
    this.actor.send(event);
  }

  /**
   * Stop the service when no longer needed
   */
  stop(): void {
    // Clear all active timeouts to prevent them from firing after service is stopped
    for (const timeoutId of this.activeTimeouts) {
      this.cleanupTimeout(timeoutId);
    }

    this.actor.stop();
    this.stateListeners.clear();
  }
}
