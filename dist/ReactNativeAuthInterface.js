"use strict";
/**
 * React Native Authentication Interface
 * Provides a simple interface to access auth functions from React Native
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactNativeAuthInterface = void 0;
const ReactNativeStorage_1 = require("./features/auth/adapters/ReactNativeStorage");
const authService_1 = require("./features/auth/service/authService");
const AuthRepository_1 = require("./features/auth/repositories/AuthRepository");
class ReactNativeAuthInterface {
    constructor(apiBaseURL) {
        // Initialize the AuthRepository with React Native storage
        const authRepository = new AuthRepository_1.AuthRepository(ReactNativeStorage_1.ReactNativeStorage, apiBaseURL);
        // Initialize auth service with the repository
        this.authService = new authService_1.AuthService(authRepository);
    }
    /**
     * Login with email and password
     */
    async login(payload) {
        // We'll need to wait for the login result using a promise
        return new Promise((resolve, reject) => {
            // Subscribe to state changes to detect when login is complete
            const subscription = this.authService.subscribe((state) => {
                if (state.matches('authorized')) {
                    const session = state.context.session;
                    if (session) {
                        resolve(session);
                        subscription.unsubscribe(); // Unsubscribe after successful login
                    }
                }
                else if (state.context.error) {
                    reject(new Error(state.context.error.message));
                    subscription.unsubscribe(); // Unsubscribe after error
                }
            });
            // Send the login event
            this.authService.send({ type: 'LOGIN', payload });
        });
    }
    /**
     * Register a new user
     */
    async register(payload) {
        return new Promise((resolve, reject) => {
            const subscription = this.authService.subscribe((state) => {
                if (state.matches('authorized')) {
                    resolve();
                    subscription.unsubscribe();
                }
                else if (state.context.error) {
                    reject(new Error(state.context.error.message));
                    subscription.unsubscribe();
                }
            });
            // Start registration process
            this.authService.send({ type: 'REGISTER', payload });
        });
    }
    /**
     * Request password reset (sends OTP)
     */
    async requestPasswordReset(payload) {
        return new Promise((resolve, reject) => {
            const subscription = this.authService.subscribe((state) => {
                if (state.matches({ unauthorized: { forgotPassword: 'verifyOtp' } })) {
                    resolve();
                    subscription.unsubscribe();
                }
                else if (state.context.error) {
                    reject(new Error(state.context.error.message));
                    subscription.unsubscribe();
                }
            });
            this.authService.send({ type: 'FORGOT_PASSWORD', payload });
        });
    }
    /**
     * Verify OTP code
     */
    async verifyOtp(payload) {
        // For OTP verification we'll return a promise that resolves with the action token
        return new Promise((resolve, reject) => {
            // Note: We'll need to track the action token in the context or return it somehow
            // This requires updating the authMachine to store action tokens in context
            const subscription = this.authService.subscribe((state) => {
                // Check for action token in registration or password reset context
                const registrationToken = state.context.registration?.actionToken;
                const resetToken = state.context.passwordReset?.actionToken;
                const token = registrationToken || resetToken;
                if (token) {
                    resolve(token);
                    subscription.unsubscribe();
                }
                else if (state.context.error) {
                    reject(new Error(state.context.error.message));
                    subscription.unsubscribe();
                }
            });
            this.authService.send({ type: 'VERIFY_OTP', payload });
        });
    }
    /**
     * Complete password reset
     */
    async completePasswordReset(payload) {
        return new Promise((resolve, reject) => {
            const subscription = this.authService.subscribe((state) => {
                if (state.matches('authorized')) {
                    resolve();
                    subscription.unsubscribe();
                }
                else if (state.context.error) {
                    reject(new Error(state.context.error.message));
                    subscription.unsubscribe();
                }
            });
            this.authService.send({ type: 'RESET_PASSWORD', payload });
        });
    }
    /**
     * Complete registration with action token and new password
     */
    async completeRegistration(payload) {
        return new Promise((resolve, reject) => {
            const subscription = this.authService.subscribe((state) => {
                if (state.matches('authorized')) {
                    resolve();
                    subscription.unsubscribe();
                }
                else if (state.context.error) {
                    reject(new Error(state.context.error.message));
                    subscription.unsubscribe();
                }
            });
            // Complete registration happens automatically after OTP verification in the registration flow
            // We'll send a custom event to handle this specific use case directly
            this.authService.send({ type: 'COMPLETE_REGISTRATION', payload });
        });
    }
    /**
     * Check current session (validates and refreshes if needed)
     */
    async checkSession() {
        // Wait for the checkingSession state to resolve
        return new Promise((resolve) => {
            const subscription = this.authService.subscribe((state) => {
                if (state.matches('checkingSession') && !state.hasTag('loading')) {
                    // When checking session is done, return the current session
                    resolve(state.context.session);
                    subscription.unsubscribe();
                }
                else if (state.matches('authorized') || state.matches('unauthorized')) {
                    // If we reach a final auth state, return the session
                    resolve(state.context.session);
                    subscription.unsubscribe();
                }
            });
        });
    }
    /**
     * Logout the current user
     */
    async logout() {
        return new Promise((resolve, reject) => {
            const subscription = this.authService.subscribe((state) => {
                if (state.matches('unauthorized')) {
                    resolve();
                    subscription.unsubscribe();
                }
                else if (state.context.error) {
                    reject(new Error(state.context.error.message));
                    subscription.unsubscribe();
                }
            });
            this.authService.send({ type: 'LOGOUT' });
        });
    }
    /**
     * Refresh session using refresh token
     */
    async refresh() {
        return new Promise((resolve, reject) => {
            const subscription = this.authService.subscribe((state) => {
                if (state.matches('authorized')) {
                    const session = state.context.session;
                    resolve(session);
                    subscription.unsubscribe();
                }
                else if (state.context.error) {
                    reject(new Error(state.context.error.message));
                    subscription.unsubscribe();
                }
            });
            this.authService.send({ type: 'REFRESH' });
        });
    }
    /**
     * Change user password
     */
    async changePassword(_payload) {
        // This method would need to be added to the repository interface
        await Promise.resolve();
        void _payload;
        throw new Error("Method not implemented");
    }
    /**
     * Delete user account
     */
    async deleteAccount(_payload) {
        // This method would need to be added to the repository interface
        await Promise.resolve();
        void _payload;
        throw new Error("Method not implemented");
    }
    /**
     * Get the current session without validation
     */
    getCurrentSession() {
        // Read the session directly from the auth service context
        return this.authService.getSession();
    }
    /**
     * Get the current auth state
     */
    getAuthState() {
        return this.authService.getAuthState();
    }
}
exports.ReactNativeAuthInterface = ReactNativeAuthInterface;
