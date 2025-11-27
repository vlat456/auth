"use strict";
/**
 * Path: src/features/auth/service/authService.ts
 * Authentication service that manages the auth machine instance
 *
 * This service provides the ONLY public interface to authentication.
 * The XState machine is completely encapsulated - consumers cannot access it directly.
 *
 * All interactions with the auth system go through this service layer.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const xstate_1 = require("xstate");
const authMachine_1 = require("../machine/authMachine");
const authConstants_1 = require("../utils/authConstants");
/**
 * AuthService - Comprehensive authentication service layer
 *
 * This service abstracts away XState internals and provides a clean API for:
 * - Authentication flows (login, register, password reset)
 * - State management (get current state, subscribe to changes)
 * - State queries (isLoggedIn, isLoading, hasError, etc.)
 * - Event sending (with type-safe helpers)
 */
class AuthService {
    constructor(repository) {
        this.stateListeners = new Set();
        this.activeTimeouts = new Set();
        this.repository = repository;
        const machine = (0, authMachine_1.createAuthMachine)(this.repository);
        this.actor = (0, xstate_1.createActor)(machine);
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
    cleanupTimeout(timeoutId) {
        clearTimeout(timeoutId);
        this.activeTimeouts.delete(timeoutId);
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
    isLoggedIn() {
        return this.actor.getSnapshot().matches("authorized");
    }
    /**
     * Check if currently processing a request
     */
    isLoading() {
        const state = this.actor.getSnapshot();
        return state.hasTag("loading");
    }
    /**
     * Check if there's a current error
     */
    hasError() {
        return this.actor.getSnapshot().context.error !== null;
    }
    /**
     * Get the current error, if any
     */
    getError() {
        return this.actor.getSnapshot().context.error;
    }
    /**
     * Get the current session
     */
    getSession() {
        return this.actor.getSnapshot().context.session;
    }
    /**
     * Get the current authentication state value
     * (e.g., 'authorized', 'unauthorized', { unauthorized: { login: 'idle' } })
     */
    getState() {
        return this.actor.getSnapshot().value;
    }
    /**
     * Check if in a specific state
     *
     * @param pattern - The state pattern to match.
     * Common patterns are provided in AuthState type, but XState accepts complex nested patterns.
     */
    matches(pattern) {
        // XState's matches function is flexible with complex nested patterns
        // The type is restrictive for common usage but allows escape hatch with string
        return this.actor.getSnapshot().matches(pattern);
    }
    /**
     * Get all current context data
     */
    getContext() {
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
    subscribe(callback) {
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
    checkSession() {
        return new Promise((resolve, reject) => {
            let timeoutId;
            let completed = false;
            const cleanup = () => {
                this.cleanupTimeout(timeoutId);
                completed = true;
                unsubscribe();
            };
            const unsubscribe = this.subscribe((state) => {
                if (completed)
                    return;
                // Resolve when we reach a stable state (authorized or unauthorized)
                if (state.matches("authorized") || state.matches("unauthorized")) {
                    cleanup();
                    resolve(state.context.session);
                }
            });
            // Set timeout - longer than normal ops since includes storage + network
            timeoutId = setTimeout(() => {
                if (!completed) {
                    cleanup();
                    // Reset machine to login state on timeout
                    this._send({ type: "CANCEL" });
                    reject(new Error(`Session check timeout - state machine did not complete within ${authConstants_1.SESSION_CHECK_TIMEOUT_MS}ms`));
                }
            }, authConstants_1.SESSION_CHECK_TIMEOUT_MS);
            // Store the timeout ID for cleanup
            this.activeTimeouts.add(timeoutId);
            this._send({ type: "CHECK_SESSION" });
        });
    }
    /**
     * Login with email and password
     *
     * Timeout protects against state machine getting stuck during login.
     * If login doesn't complete within timeout, rejects with timeout error
     * and cleans up subscription to prevent memory leak.
     */
    login(payload) {
        return new Promise((resolve, reject) => {
            let timeoutId;
            let completed = false;
            const cleanup = () => {
                this.cleanupTimeout(timeoutId);
                completed = true;
                unsubscribe();
            };
            const unsubscribe = this.subscribe((state) => {
                if (completed)
                    return;
                if (state.matches("authorized")) {
                    cleanup();
                    resolve(state.context.session);
                }
                else if (state.context.error &&
                    state.matches({ unauthorized: { login: "idle" } })) {
                    cleanup();
                    reject(new Error(state.context.error.message));
                }
            });
            // 30 second timeout - prevents indefinite hang if state machine stuck
            timeoutId = setTimeout(() => {
                if (!completed) {
                    cleanup();
                    // Reset machine to login state on timeout
                    this._send({ type: "CANCEL" });
                    reject(new Error(`Login timeout - state machine did not complete within ${authConstants_1.AUTH_OPERATION_TIMEOUT_MS}ms`));
                }
            }, authConstants_1.AUTH_OPERATION_TIMEOUT_MS);
            // Store the timeout ID for cleanup
            this.activeTimeouts.add(timeoutId);
            this._send({ type: "LOGIN", payload });
        });
    }
    /**
     * Register a new user
     *
     * Timeout protects against state machine getting stuck during registration.
     * If registration doesn't complete within timeout, rejects with timeout error
     * and cleans up subscription to prevent memory leak.
     */
    register(payload) {
        return new Promise((resolve, reject) => {
            let timeoutId;
            let completed = false;
            const cleanup = () => {
                this.cleanupTimeout(timeoutId);
                completed = true;
                unsubscribe();
            };
            const unsubscribe = this.subscribe((state) => {
                if (completed)
                    return;
                // Registration complete when we reach authorized
                if (state.matches("authorized")) {
                    cleanup();
                    resolve();
                }
                else if (state.context.error &&
                    state.matches({ unauthorized: { register: "form" } })) {
                    cleanup();
                    reject(new Error(state.context.error.message));
                }
            });
            // 30 second timeout - prevents indefinite hang if state machine stuck
            timeoutId = setTimeout(() => {
                if (!completed) {
                    cleanup();
                    // Reset machine to login state on timeout
                    this._send({ type: "CANCEL" });
                    reject(new Error(`Register timeout - state machine did not complete within ${authConstants_1.AUTH_OPERATION_TIMEOUT_MS}ms`));
                }
            }, authConstants_1.AUTH_OPERATION_TIMEOUT_MS);
            // Store the timeout ID for cleanup
            this.activeTimeouts.add(timeoutId);
            this._send({ type: "REGISTER", payload });
        });
    }
    /**
     * Request password reset (sends OTP to email)
     *
     * Timeout protects against state machine getting stuck during OTP request.
     * If request doesn't complete within timeout, rejects with timeout error
     * and cleans up subscription to prevent memory leak.
     */
    requestPasswordReset(payload) {
        return new Promise((resolve, reject) => {
            let timeoutId;
            let completed = false;
            const cleanup = () => {
                this.cleanupTimeout(timeoutId);
                completed = true;
                unsubscribe();
            };
            const unsubscribe = this.subscribe((state) => {
                if (completed)
                    return;
                if (state.matches({ unauthorized: { forgotPassword: "verifyOtp" } })) {
                    cleanup();
                    resolve();
                }
                else if (state.context.error &&
                    state.matches({ unauthorized: { forgotPassword: "idle" } })) {
                    cleanup();
                    reject(new Error(state.context.error.message));
                }
            });
            // 30 second timeout - prevents indefinite hang if state machine stuck
            timeoutId = setTimeout(() => {
                if (!completed) {
                    cleanup();
                    // Reset machine to login state on timeout
                    this._send({ type: "CANCEL" });
                    reject(new Error(`Password reset request timeout - state machine did not complete within ${authConstants_1.AUTH_OPERATION_TIMEOUT_MS}ms`));
                }
            }, authConstants_1.AUTH_OPERATION_TIMEOUT_MS);
            // Store the timeout ID for cleanup
            this.activeTimeouts.add(timeoutId);
            this._send({ type: "FORGOT_PASSWORD", payload });
        });
    }
    /**
     * Verify OTP code (returns action token for next step)
     *
     * Timeout protects against state machine getting stuck during OTP verification.
     * If verification doesn't complete within timeout, rejects with timeout error
     * and cleans up subscription to prevent memory leak.
     */
    verifyOtp(payload) {
        return new Promise((resolve, reject) => {
            let timeoutId;
            let completed = false;
            const cleanup = () => {
                this.cleanupTimeout(timeoutId);
                completed = true;
                unsubscribe();
            };
            const unsubscribe = this.subscribe((state) => {
                if (completed)
                    return;
                const token = state.context.passwordReset?.actionToken ||
                    state.context.registration?.actionToken;
                if (token && !state.hasTag("loading")) {
                    cleanup();
                    resolve(token);
                }
                else if (state.context.error && !state.matches("authorized")) {
                    cleanup();
                    reject(new Error(state.context.error.message));
                }
            });
            // 30 second timeout - prevents indefinite hang if state machine stuck
            timeoutId = setTimeout(() => {
                if (!completed) {
                    cleanup();
                    // Reset machine to login state on timeout
                    this._send({ type: "CANCEL" });
                    reject(new Error(`OTP verification timeout - state machine did not complete within ${authConstants_1.AUTH_OPERATION_TIMEOUT_MS}ms`));
                }
            }, authConstants_1.AUTH_OPERATION_TIMEOUT_MS);
            // Store the timeout ID for cleanup
            this.activeTimeouts.add(timeoutId);
            this._send({ type: "VERIFY_OTP", payload });
        });
    }
    /**
     * Complete password reset with new password
     *
     * Timeout protects against state machine getting stuck during password reset.
     * If reset doesn't complete within timeout, rejects with timeout error
     * and cleans up subscription to prevent memory leak.
     */
    completePasswordReset(payload) {
        return new Promise((resolve, reject) => {
            let timeoutId;
            let completed = false;
            const cleanup = () => {
                this.cleanupTimeout(timeoutId);
                completed = true;
                unsubscribe();
            };
            const unsubscribe = this.subscribe((state) => {
                if (completed)
                    return;
                if (state.matches("authorized")) {
                    cleanup();
                    resolve();
                }
                else if (state.context.error &&
                    state.matches({
                        unauthorized: {
                            forgotPassword: "resettingPassword",
                        },
                    })) {
                    cleanup();
                    reject(new Error(state.context.error.message));
                }
            });
            // 30 second timeout - prevents indefinite hang if state machine stuck
            timeoutId = setTimeout(() => {
                if (!completed) {
                    cleanup();
                    // Reset machine to login state on timeout
                    this._send({ type: "CANCEL" });
                    reject(new Error(`Complete password reset timeout - state machine did not complete within ${authConstants_1.AUTH_OPERATION_TIMEOUT_MS}ms`));
                }
            }, authConstants_1.AUTH_OPERATION_TIMEOUT_MS);
            // Store the timeout ID for cleanup
            this.activeTimeouts.add(timeoutId);
            this._send({ type: "RESET_PASSWORD", payload });
        });
    }
    /**
     * Complete registration with action token and password
     *
     * Timeout protects against state machine getting stuck during registration completion.
     * If completion doesn't complete within timeout, rejects with timeout error
     * and cleans up subscription to prevent memory leak.
     */
    completeRegistration(payload) {
        return new Promise((resolve, reject) => {
            let timeoutId;
            let completed = false;
            const cleanup = () => {
                this.cleanupTimeout(timeoutId);
                completed = true;
                unsubscribe();
            };
            const unsubscribe = this.subscribe((state) => {
                if (completed)
                    return;
                if (state.matches("authorized")) {
                    cleanup();
                    resolve();
                }
                else if (state.context.error) {
                    cleanup();
                    reject(new Error(state.context.error.message));
                }
            });
            // 30 second timeout - prevents indefinite hang if state machine stuck
            timeoutId = setTimeout(() => {
                if (!completed) {
                    cleanup();
                    // Reset machine to login state on timeout
                    this._send({ type: "CANCEL" });
                    reject(new Error(`Complete registration timeout - state machine did not complete within ${authConstants_1.AUTH_OPERATION_TIMEOUT_MS}ms`));
                }
            }, authConstants_1.AUTH_OPERATION_TIMEOUT_MS);
            // Store the timeout ID for cleanup
            this.activeTimeouts.add(timeoutId);
            this._send({ type: "COMPLETE_REGISTRATION", payload });
        });
    }
    /**
     * Refresh the session using the refresh token
     *
     * Timeout protects against state machine getting stuck during token refresh.
     * If refresh doesn't complete within timeout, rejects with timeout error
     * and cleans up subscription to prevent memory leak.
     */
    refresh() {
        return new Promise((resolve, reject) => {
            let timeoutId;
            let completed = false;
            const cleanup = () => {
                this.cleanupTimeout(timeoutId);
                completed = true;
                unsubscribe();
            };
            const unsubscribe = this.subscribe((state) => {
                if (completed)
                    return;
                if (state.matches("authorized")) {
                    cleanup();
                    resolve(state.context.session);
                }
                else if (state.context.error) {
                    cleanup();
                    reject(new Error(state.context.error.message));
                }
            });
            // 30 second timeout - prevents indefinite hang if state machine stuck
            timeoutId = setTimeout(() => {
                if (!completed) {
                    cleanup();
                    // Reset machine to login state on timeout
                    this._send({ type: "CANCEL" });
                    reject(new Error(`Refresh timeout - state machine did not complete within ${authConstants_1.AUTH_OPERATION_TIMEOUT_MS}ms`));
                }
            }, authConstants_1.AUTH_OPERATION_TIMEOUT_MS);
            // Store the timeout ID for cleanup
            this.activeTimeouts.add(timeoutId);
            this._send({ type: "REFRESH" });
        });
    }
    /**
     * Logout the current user
     *
     * Timeout protects against state machine getting stuck during logout.
     * If logout doesn't complete within timeout, rejects with timeout error
     * and cleans up subscription to prevent memory leak.
     */
    logout() {
        return new Promise((resolve, reject) => {
            let timeoutId;
            let completed = false;
            const cleanup = () => {
                this.cleanupTimeout(timeoutId);
                completed = true;
                unsubscribe();
            };
            const unsubscribe = this.subscribe((state) => {
                if (completed)
                    return;
                if (state.matches("unauthorized")) {
                    cleanup();
                    resolve();
                }
                else if (state.context.error) {
                    cleanup();
                    reject(new Error(state.context.error.message));
                }
            });
            // 30 second timeout - prevents indefinite hang if state machine stuck
            timeoutId = setTimeout(() => {
                if (!completed) {
                    cleanup();
                    // Reset machine to login state on timeout
                    this._send({ type: "CANCEL" });
                    reject(new Error(`Logout timeout - state machine did not complete within ${authConstants_1.AUTH_OPERATION_TIMEOUT_MS}ms`));
                }
            }, authConstants_1.AUTH_OPERATION_TIMEOUT_MS);
            // Store the timeout ID for cleanup
            this.activeTimeouts.add(timeoutId);
            this._send({ type: "LOGOUT" });
        });
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
    goToLogin() {
        this._send({ type: "GO_TO_LOGIN" });
    }
    /**
     * Navigate to registration flow
     */
    goToRegister() {
        this._send({ type: "GO_TO_REGISTER" });
    }
    /**
     * Navigate to password reset flow
     */
    goToForgotPassword() {
        this._send({ type: "GO_TO_FORGOT_PASSWORD" });
    }
    /**
     * Cancel current operation and return to previous state
     */
    cancel() {
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
    _send(event) {
        this.actor.send(event);
    }
    /**
     * Stop the service when no longer needed
     */
    stop() {
        // Clear all active timeouts to prevent them from firing after service is stopped
        for (const timeoutId of this.activeTimeouts) {
            clearTimeout(timeoutId);
        }
        this.activeTimeouts.clear();
        this.actor.stop();
        this.stateListeners.clear();
    }
}
exports.AuthService = AuthService;
