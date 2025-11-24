"use strict";
/**
 * React Native Authentication Interface
 * Provides a simple interface to access auth functions from React Native
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactNativeAuthInterface = void 0;
const AuthRepository_1 = require("./features/auth/repositories/AuthRepository");
const ReactNativeStorage_1 = require("./features/auth/adapters/ReactNativeStorage");
class ReactNativeAuthInterface {
    constructor(apiBaseURL) {
        // Initialize the AuthRepository with React Native storage
        this.authRepository = new AuthRepository_1.AuthRepository(ReactNativeStorage_1.ReactNativeStorage, apiBaseURL);
    }
    /**
     * Login with email and password
     */
    async login(payload) {
        return await this.authRepository.login(payload);
    }
    /**
     * Register a new user
     */
    async register(payload) {
        return await this.authRepository.register(payload);
    }
    /**
     * Request password reset (sends OTP)
     */
    async requestPasswordReset(payload) {
        return await this.authRepository.requestPasswordReset(payload);
    }
    /**
     * Verify OTP code
     */
    async verifyOtp(payload) {
        return await this.authRepository.verifyOtp(payload);
    }
    /**
     * Complete password reset
     */
    async completePasswordReset(payload) {
        return await this.authRepository.completePasswordReset(payload);
    }
    /**
     * Complete registration with action token and new password
     */
    async completeRegistration(payload) {
        return await this.authRepository.completeRegistration(payload);
    }
    /**
     * Check current session (validates and refreshes if needed)
     */
    async checkSession() {
        return await this.authRepository.checkSession();
    }
    /**
     * Logout the current user
     */
    async logout() {
        return await this.authRepository.logout();
    }
    /**
     * Refresh session using refresh token
     */
    async refresh(refreshToken) {
        return await this.authRepository.refresh(refreshToken);
    }
    /**
     * Change user password
     */
    async changePassword(payload) {
        // This method would need to be added to the repository interface
        throw new Error('Method not implemented');
    }
    /**
     * Delete user account
     */
    async deleteAccount(payload) {
        // This method would need to be added to the repository interface
        throw new Error('Method not implemented');
    }
    /**
     * Get the current session without validation
     */
    async getCurrentSession() {
        // This would require direct access to storage, which isn't exposed
        // So we'll use the checkSession method which will return current if valid
        return await this.checkSession();
    }
}
exports.ReactNativeAuthInterface = ReactNativeAuthInterface;
