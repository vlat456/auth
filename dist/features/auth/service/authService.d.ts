/**
 * Path: src/features/auth/service/authService.ts
 * Authentication service that manages the auth machine instance
 */
import { SnapshotFrom } from 'xstate';
import { createAuthMachine } from '../machine/authMachine';
import { IAuthRepository } from '../types';
import { AuthEvent } from '../machine/authMachine';
export declare class AuthService {
    private authService;
    private repository;
    constructor(repository: IAuthRepository);
    getSnapshot(): SnapshotFrom<ReturnType<typeof createAuthMachine>>;
    subscribe(callback: (state: SnapshotFrom<ReturnType<typeof createAuthMachine>>) => void): import("xstate").Subscription;
    send(event: AuthEvent): void;
    getSession(): import("../types").AuthSession | null;
    getAuthState(): "checkingSession" | "validatingSession" | "fetchingProfileAfterValidation" | "refreshingToken" | "authorized" | "fetchingProfileAfterRefresh" | "loggingOut" | {
        unauthorized: "completeRegistrationProcess" | "loggingInAfterCompletion" | {
            login: "idle" | "submitting";
        } | {
            register: "verifyOtp" | "submitting" | "form" | "verifyingOtp" | "completingRegistration" | "loggingIn";
        } | {
            forgotPassword: "verifyOtp" | "idle" | "submitting" | "verifyingOtp" | "resetPassword" | "resettingPassword" | "loggingInAfterReset";
        };
    };
    stop(): void;
}
