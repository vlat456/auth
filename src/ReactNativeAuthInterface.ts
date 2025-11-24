/**
 * React Native Authentication Interface
 * Provides a simple interface to access auth functions from React Native
 */

import { AuthRepository } from "./features/auth/repositories/AuthRepository";
import { ReactNativeStorage } from "./features/auth/adapters/ReactNativeStorage";
import {
  LoginRequestDTO,
  RegisterRequestDTO,
  RequestOtpDTO,
  VerifyOtpDTO,
  CompleteRegistrationDTO,
  CompletePasswordResetDTO,
  AuthSession,
  IAuthRepository,
  ChangePasswordRequestDTO,
  DeleteAccountRequestDTO,
} from "./features/auth/types";

export class ReactNativeAuthInterface {
  private authRepository: IAuthRepository;

  constructor(apiBaseURL?: string) {
    // Initialize the AuthRepository with React Native storage
    this.authRepository = new AuthRepository(ReactNativeStorage, apiBaseURL);
  }

  /**
   * Login with email and password
   */
  async login(payload: LoginRequestDTO): Promise<AuthSession> {
    return await this.authRepository.login(payload);
  }

  /**
   * Register a new user
   */
  async register(payload: RegisterRequestDTO): Promise<void> {
    return await this.authRepository.register(payload);
  }

  /**
   * Request password reset (sends OTP)
   */
  async requestPasswordReset(payload: RequestOtpDTO): Promise<void> {
    return await this.authRepository.requestPasswordReset(payload);
  }

  /**
   * Verify OTP code
   */
  async verifyOtp(payload: VerifyOtpDTO): Promise<string> {
    return await this.authRepository.verifyOtp(payload);
  }

  /**
   * Complete password reset
   */
  async completePasswordReset(
    payload: CompletePasswordResetDTO
  ): Promise<void> {
    return await this.authRepository.completePasswordReset(payload);
  }

  /**
   * Complete registration with action token and new password
   */
  async completeRegistration(payload: CompleteRegistrationDTO): Promise<void> {
    return await this.authRepository.completeRegistration(payload);
  }

  /**
   * Check current session (validates and refreshes if needed)
   */
  async checkSession(): Promise<AuthSession | null> {
    return await this.authRepository.checkSession();
  }

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    return await this.authRepository.logout();
  }

  /**
   * Refresh session using refresh token
   */
  async refresh(refreshToken: string): Promise<AuthSession> {
    return await this.authRepository.refresh(refreshToken);
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
   * Get the current session without validation
   */
  async getCurrentSession(): Promise<AuthSession | null> {
    // This would require direct access to storage, which isn't exposed
    // So we'll use the checkSession method which will return current if valid
    return await this.checkSession();
  }
}
