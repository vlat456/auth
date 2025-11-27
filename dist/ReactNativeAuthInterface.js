"use strict";
/**
 * React Native Authentication Interface
 *
 * This is the public API for authentication in React Native apps.
 * All interactions go through AuthService - the machine is completely hidden.
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
     * Check and restore session on app startup
     */
    async checkSession() {
        return this.authService.checkSession();
    }
    /**
     * Login with email and password
     */
    async login(payload) {
        return this.authService.login(payload);
    }
    /**
     * Register a new user
     */
    async register(payload) {
        return this.authService.register(payload);
    }
    /**
     * Request password reset (sends OTP to email)
     */
    async requestPasswordReset(payload) {
        return this.authService.requestPasswordReset(payload);
    }
    /**
     * Verify OTP code
     */
    async verifyOtp(payload) {
        return this.authService.verifyOtp(payload);
    }
    /**
     * Complete password reset with new password
     */
    async completePasswordReset(payload) {
        return this.authService.completePasswordReset(payload);
    }
    /**
     * Complete registration with action token and password
     */
    async completeRegistration(payload) {
        return this.authService.completeRegistration(payload);
    }
    /**
     * Refresh session using refresh token
     */
    async refresh() {
        return this.authService.refresh();
    }
    /**
     * Logout the current user
     */
    async logout() {
        return this.authService.logout();
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
     * Get the current session without waiting for validation
     */
    getCurrentSession() {
        return this.authService.getSession();
    }
    /**
     * Check if user is currently logged in
     */
    isLoggedIn() {
        return this.authService.isLoggedIn();
    }
    /**
     * Check if currently processing a request
     */
    isLoading() {
        return this.authService.isLoading();
    }
    /**
     * Check if there's a current error
     */
    hasError() {
        return this.authService.hasError();
    }
    /**
     * Get the current error, if any
     */
    getError() {
        return this.authService.getError();
    }
    /**
     * Get the current auth state value
     */
    getAuthState() {
        return this.authService.getState();
    }
    /**
     * Subscribe to auth state changes
     * Returns unsubscribe function
     */
    subscribe(callback) {
        return this.authService.subscribe((snapshot) => {
            callback(snapshot.value);
        });
    }
    /**
     * Navigate to login flow
     */
    goToLogin() {
        this.authService.goToLogin();
    }
    /**
     * Navigate to registration flow
     */
    goToRegister() {
        this.authService.goToRegister();
    }
    /**
     * Navigate to password reset flow
     */
    goToForgotPassword() {
        this.authService.goToForgotPassword();
    }
    /**
     * Cancel current operation
     */
    cancel() {
        this.authService.cancel();
    }
}
exports.ReactNativeAuthInterface = ReactNativeAuthInterface;
