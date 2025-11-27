/**
 * React Native Authentication Interface
 *
 * This is the public API for authentication in React Native apps.
 * All interactions go through AuthService - the machine is completely hidden.
 */

import { ReactNativeStorage } from "./features/auth/adapters/ReactNativeStorage";
import {
  LoginRequestDTO,
  RegisterRequestDTO,
  RequestOtpDTO,
  VerifyOtpDTO,
  CompleteRegistrationDTO,
  CompletePasswordResetDTO,
  AuthSession,
  ChangePasswordRequestDTO,
  DeleteAccountRequestDTO,
  AuthState,
} from "./features/auth/types";
import { AuthService } from "./features/auth/service/authService";
import { AuthRepository } from "./features/auth/repositories/AuthRepository";

export class ReactNativeAuthInterface {
  private authService: AuthService;

  constructor(apiBaseURL?: string) {
    // Initialize the AuthRepository with React Native storage
    const authRepository = new AuthRepository(ReactNativeStorage, apiBaseURL);

    // Initialize auth service with the repository
    this.authService = new AuthService(authRepository);
  }

  /**
   * Check and restore session on app startup
   */
  async checkSession(): Promise<AuthSession | null> {
    return this.authService.checkSession();
  }

  /**
   * Login with email and password
   */
  async login(payload: LoginRequestDTO): Promise<AuthSession> {
    return this.authService.login(payload);
  }

  /**
   * Register a new user
   */
  async register(payload: RegisterRequestDTO): Promise<void> {
    return this.authService.register(payload);
  }

  /**
   * Request password reset (sends OTP to email)
   */
  async requestPasswordReset(payload: RequestOtpDTO): Promise<void> {
    return this.authService.requestPasswordReset(payload);
  }

  /**
   * Verify OTP code
   */
  async verifyOtp(payload: VerifyOtpDTO): Promise<string> {
    return this.authService.verifyOtp(payload);
  }

  /**
   * Complete password reset with new password
   */
  async completePasswordReset(
    payload: CompletePasswordResetDTO,
  ): Promise<void> {
    return this.authService.completePasswordReset(payload);
  }

  /**
   * Complete registration with action token and password
   */
  async completeRegistration(payload: CompleteRegistrationDTO): Promise<void> {
    return this.authService.completeRegistration(payload);
  }

  /**
   * Refresh session using refresh token
   */
  async refresh(): Promise<AuthSession | null> {
    return this.authService.refresh();
  }

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    return this.authService.logout();
  }

  /**
   * Change user password
   */
  async changePassword(_payload: ChangePasswordRequestDTO): Promise<void> {
    // This method would need to be added to the repository interface
    await Promise.resolve();
    void _payload;
    throw new Error("Method not implemented");
  }

  /**
   * Delete user account
   */
  async deleteAccount(_payload: DeleteAccountRequestDTO): Promise<void> {
    // This method would need to be added to the repository interface
    await Promise.resolve();
    void _payload;
    throw new Error("Method not implemented");
  }

  /**
   * Get the current session without waiting for validation
   */
  getCurrentSession(): AuthSession | null {
    return this.authService.getSession();
  }

  /**
   * Check if user is currently logged in
   */
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  /**
   * Check if currently processing a request
   */
  isLoading(): boolean {
    return this.authService.isLoading();
  }

  /**
   * Check if there's a current error
   */
  hasError(): boolean {
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
  getAuthState(): AuthState {
    return this.authService.getState();
  }

  /**
   * Subscribe to auth state changes
   * Returns unsubscribe function
   */
  subscribe(callback: (state: AuthState) => void) {
    return this.authService.subscribe((snapshot) => {
      callback(snapshot.value as AuthState);
    });
  }

  /**
   * Navigate to login flow
   */
  goToLogin(): void {
    this.authService.goToLogin();
  }

  /**
   * Navigate to registration flow
   */
  goToRegister(): void {
    this.authService.goToRegister();
  }

  /**
   * Navigate to password reset flow
   */
  goToForgotPassword(): void {
    this.authService.goToForgotPassword();
  }

  /**
   * Cancel current operation
   */
  cancel(): void {
    this.authService.cancel();
  }
}
