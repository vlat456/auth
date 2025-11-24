/**
 * Path: src/features/auth/repositories/AuthRepository.ts
 * Version: 0.2.0
 */
import { IAuthRepository, LoginRequestDTO, RegisterRequestDTO, RequestOtpDTO, VerifyOtpDTO, CompletePasswordResetDTO, CompleteRegistrationDTO, AuthSession, IStorage } from "../types";
export declare class AuthRepository implements IAuthRepository {
    private apiClient;
    private storage;
    constructor(storage: IStorage, baseURL?: string);
    login: (payload: LoginRequestDTO) => Promise<AuthSession>;
    register: (payload: RegisterRequestDTO) => Promise<void>;
    requestPasswordReset: (payload: RequestOtpDTO) => Promise<void>;
    verifyOtp: (payload: VerifyOtpDTO) => Promise<string>;
    completeRegistration: (payload: CompleteRegistrationDTO) => Promise<void>;
    completePasswordReset: (payload: CompletePasswordResetDTO) => Promise<void>;
    checkSession(): Promise<AuthSession | null>;
    private handleExpiredSession;
    private validateSessionWithServer;
    private handle401Error;
    refresh: (refreshToken: string) => Promise<AuthSession>;
    logout(): Promise<void>;
    private saveSession;
    private readSession;
    /**
     * Decodes JWT locally to check 'exp' claim.
     * Returns true if expired or invalid format.
     */
    private isTokenExpired;
    private initializeInterceptors;
}
