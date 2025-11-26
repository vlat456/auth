/**
 * Path: src/features/auth/machine/authMachine.ts
 * Version: 0.2.0
 */
import { AuthSession, AuthError, LoginRequestDTO, RegisterRequestDTO, RequestOtpDTO, VerifyOtpDTO, CompleteRegistrationDTO, CompletePasswordResetDTO, IAuthRepository } from "../types";
/**
 * Registration flow context - isolated to prevent state pollution
 * Automatically cleared when entering other flows
 */
export type RegistrationFlowContext = {
    email: string;
    actionToken?: string;
    pendingCredentials?: LoginRequestDTO;
};
/**
 * Password reset flow context - isolated to prevent state pollution
 * Automatically cleared when entering other flows
 */
export type PasswordResetFlowContext = {
    email: string;
    actionToken?: string;
    pendingCredentials?: LoginRequestDTO;
};
/**
 * Restructured context with clear ownership by flow type
 * - session: Shared auth state
 * - error: Shared error state
 * - registration: Only valid during registration flow
 * - passwordReset: Only valid during password reset flow
 *
 * Benefits of this structure:
 * 1. Clear separation - each flow owns its data
 * 2. Automatic cleanup - switching flows clears old data
 * 3. Type safety - context.registration?.email prevents cross-flow contamination
 * 4. No shared state pollution - email can't persist after logout
 * 5. Easier debugging - clear data ownership semantics
 */
export type AuthContext = {
    session: AuthSession | null;
    error: AuthError | null;
    registration?: RegistrationFlowContext;
    passwordReset?: PasswordResetFlowContext;
};
export type AuthEvent = {
    type: "CHECK_SESSION";
} | {
    type: "LOGIN";
    payload: LoginRequestDTO;
} | {
    type: "REGISTER";
    payload: RegisterRequestDTO;
} | {
    type: "FORGOT_PASSWORD";
    payload: RequestOtpDTO;
} | {
    type: "VERIFY_OTP";
    payload: {
        otp: string;
    };
} | {
    type: "RESET_PASSWORD";
    payload: {
        newPassword: string;
    };
} | {
    type: "COMPLETE_REGISTRATION";
    payload: CompleteRegistrationDTO;
} | {
    type: "REFRESH";
} | {
    type: "LOGOUT";
} | {
    type: "CANCEL";
} | {
    type: "GO_TO_REGISTER";
} | {
    type: "GO_TO_LOGIN";
} | {
    type: "GO_TO_FORGOT_PASSWORD";
};
type DoneActorEvent<T = void> = {
    type: `xstate.done.actor.${string}`;
    output: T;
    actorId?: string;
};
type ErrorActorEvent = {
    type: `xstate.error.actor.${string}`;
    error: Error | unknown;
    actorId?: string;
};
type SystemEvents = DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string> | ErrorActorEvent;
export type EventWithSystem = AuthEvent | SystemEvents;
export declare const createAuthMachine: (authRepository: IAuthRepository) => import("xstate").StateMachine<AuthContext, {
    type: "CHECK_SESSION";
} | {
    type: "LOGIN";
    payload: LoginRequestDTO;
} | {
    type: "REGISTER";
    payload: RegisterRequestDTO;
} | {
    type: "FORGOT_PASSWORD";
    payload: RequestOtpDTO;
} | {
    type: "VERIFY_OTP";
    payload: {
        otp: string;
    };
} | {
    type: "RESET_PASSWORD";
    payload: {
        newPassword: string;
    };
} | {
    type: "COMPLETE_REGISTRATION";
    payload: CompleteRegistrationDTO;
} | {
    type: "REFRESH";
} | {
    type: "LOGOUT";
} | {
    type: "CANCEL";
} | {
    type: "GO_TO_REGISTER";
} | {
    type: "GO_TO_LOGIN";
} | {
    type: "GO_TO_FORGOT_PASSWORD";
} | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, {
    [x: string]: import("xstate").ActorRefFromLogic<import("xstate").PromiseActorLogic<AuthSession, {
        refreshToken: string;
    }, import("xstate").EventObject>> | import("xstate").ActorRefFromLogic<import("xstate").PromiseActorLogic<AuthSession | null, import("xstate").NonReducibleUnknown, import("xstate").EventObject>> | import("xstate").ActorRefFromLogic<import("xstate").PromiseActorLogic<AuthSession | null, {
        session?: AuthSession;
    }, import("xstate").EventObject>> | import("xstate").ActorRefFromLogic<import("xstate").PromiseActorLogic<AuthSession, LoginRequestDTO, import("xstate").EventObject>> | import("xstate").ActorRefFromLogic<import("xstate").PromiseActorLogic<void, RegisterRequestDTO, import("xstate").EventObject>> | import("xstate").ActorRefFromLogic<import("xstate").PromiseActorLogic<void, RequestOtpDTO, import("xstate").EventObject>> | import("xstate").ActorRefFromLogic<import("xstate").PromiseActorLogic<string, VerifyOtpDTO, import("xstate").EventObject>> | import("xstate").ActorRefFromLogic<import("xstate").PromiseActorLogic<void, CompleteRegistrationDTO, import("xstate").EventObject>> | import("xstate").ActorRefFromLogic<import("xstate").PromiseActorLogic<void, CompletePasswordResetDTO, import("xstate").EventObject>> | import("xstate").ActorRefFromLogic<import("xstate").PromiseActorLogic<void, import("xstate").NonReducibleUnknown, import("xstate").EventObject>> | import("xstate").ActorRefFromLogic<import("xstate").PromiseActorLogic<AuthSession | null, {
        session: AuthSession;
    }, import("xstate").EventObject>> | undefined;
}, import("xstate").Values<{
    refreshToken: {
        src: "refreshToken";
        logic: import("xstate").PromiseActorLogic<AuthSession, {
            refreshToken: string;
        }, import("xstate").EventObject>;
        id: string | undefined;
    };
    checkSession: {
        src: "checkSession";
        logic: import("xstate").PromiseActorLogic<AuthSession | null, import("xstate").NonReducibleUnknown, import("xstate").EventObject>;
        id: string | undefined;
    };
    validateAndRefreshSessionIfNeeded: {
        src: "validateAndRefreshSessionIfNeeded";
        logic: import("xstate").PromiseActorLogic<AuthSession | null, {
            session?: AuthSession;
        }, import("xstate").EventObject>;
        id: string | undefined;
    };
    loginUser: {
        src: "loginUser";
        logic: import("xstate").PromiseActorLogic<AuthSession, LoginRequestDTO, import("xstate").EventObject>;
        id: string | undefined;
    };
    registerUser: {
        src: "registerUser";
        logic: import("xstate").PromiseActorLogic<void, RegisterRequestDTO, import("xstate").EventObject>;
        id: string | undefined;
    };
    requestPasswordReset: {
        src: "requestPasswordReset";
        logic: import("xstate").PromiseActorLogic<void, RequestOtpDTO, import("xstate").EventObject>;
        id: string | undefined;
    };
    verifyOtp: {
        src: "verifyOtp";
        logic: import("xstate").PromiseActorLogic<string, VerifyOtpDTO, import("xstate").EventObject>;
        id: string | undefined;
    };
    completeRegistration: {
        src: "completeRegistration";
        logic: import("xstate").PromiseActorLogic<void, CompleteRegistrationDTO, import("xstate").EventObject>;
        id: string | undefined;
    };
    completePasswordReset: {
        src: "completePasswordReset";
        logic: import("xstate").PromiseActorLogic<void, CompletePasswordResetDTO, import("xstate").EventObject>;
        id: string | undefined;
    };
    logoutUser: {
        src: "logoutUser";
        logic: import("xstate").PromiseActorLogic<void, import("xstate").NonReducibleUnknown, import("xstate").EventObject>;
        id: string | undefined;
    };
    validateSessionWithServer: {
        src: "validateSessionWithServer";
        logic: import("xstate").PromiseActorLogic<AuthSession | null, {
            session: AuthSession;
        }, import("xstate").EventObject>;
        id: string | undefined;
    };
}>, import("xstate").Values<{
    setSession: {
        type: "setSession";
        params: import("xstate").NonReducibleUnknown;
    };
    setError: {
        type: "setError";
        params: import("xstate").NonReducibleUnknown;
    };
    clearError: {
        type: "clearError";
        params: import("xstate").NonReducibleUnknown;
    };
    clearSession: {
        type: "clearSession";
        params: import("xstate").NonReducibleUnknown;
    };
    setRegistrationEmail: {
        type: "setRegistrationEmail";
        params: import("xstate").NonReducibleUnknown;
    };
    setPasswordResetEmail: {
        type: "setPasswordResetEmail";
        params: import("xstate").NonReducibleUnknown;
    };
    clearRegistrationContext: {
        type: "clearRegistrationContext";
        params: import("xstate").NonReducibleUnknown;
    };
    clearPasswordResetContext: {
        type: "clearPasswordResetContext";
        params: import("xstate").NonReducibleUnknown;
    };
    setRegistrationActionToken: {
        type: "setRegistrationActionToken";
        params: import("xstate").NonReducibleUnknown;
    };
    setPasswordResetActionToken: {
        type: "setPasswordResetActionToken";
        params: import("xstate").NonReducibleUnknown;
    };
    setRegistrationPendingPassword: {
        type: "setRegistrationPendingPassword";
        params: import("xstate").NonReducibleUnknown;
    };
    setPasswordResetPendingPassword: {
        type: "setPasswordResetPendingPassword";
        params: import("xstate").NonReducibleUnknown;
    };
}>, never, never, "checkingSession" | "validatingSession" | "fetchingProfileAfterValidation" | "refreshingToken" | "authorized" | "fetchingProfileAfterRefresh" | "loggingOut" | {
    unauthorized: "completeRegistrationProcess" | "loggingInAfterCompletion" | {
        login: "idle" | "submitting";
    } | {
        register: "verifyOtp" | "submitting" | "form" | "verifyingOtp" | "completingRegistration" | "loggingIn";
    } | {
        forgotPassword: "verifyOtp" | "idle" | "submitting" | "verifyingOtp" | "resetPassword" | "resettingPassword" | "loggingInAfterReset";
    };
}, string, import("xstate").NonReducibleUnknown, import("xstate").NonReducibleUnknown, import("xstate").EventObject, import("xstate").MetaObject, {
    readonly id: "auth";
    readonly context: AuthContext;
    readonly initial: "checkingSession";
    readonly states: {
        readonly checkingSession: {
            readonly invoke: {
                readonly src: "checkSession";
                readonly onDone: readonly [{
                    readonly guard: ({ event }: import("xstate/dist/declarations/src/guards").GuardArgs<AuthContext, import("xstate").DoneActorEvent<AuthSession | null, string>>) => boolean;
                    readonly target: "validatingSession";
                    readonly actions: import("xstate").ActionFunction<AuthContext, import("xstate").DoneActorEvent<AuthSession | null, string>, {
                        type: "CHECK_SESSION";
                    } | {
                        type: "LOGIN";
                        payload: LoginRequestDTO;
                    } | {
                        type: "REGISTER";
                        payload: RegisterRequestDTO;
                    } | {
                        type: "FORGOT_PASSWORD";
                        payload: RequestOtpDTO;
                    } | {
                        type: "VERIFY_OTP";
                        payload: {
                            otp: string;
                        };
                    } | {
                        type: "RESET_PASSWORD";
                        payload: {
                            newPassword: string;
                        };
                    } | {
                        type: "COMPLETE_REGISTRATION";
                        payload: CompleteRegistrationDTO;
                    } | {
                        type: "REFRESH";
                    } | {
                        type: "LOGOUT";
                    } | {
                        type: "CANCEL";
                    } | {
                        type: "GO_TO_REGISTER";
                    } | {
                        type: "GO_TO_LOGIN";
                    } | {
                        type: "GO_TO_FORGOT_PASSWORD";
                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, undefined, import("xstate").Values<{
                        refreshToken: {
                            src: "refreshToken";
                            logic: import("xstate").PromiseActorLogic<AuthSession, {
                                refreshToken: string;
                            }, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        checkSession: {
                            src: "checkSession";
                            logic: import("xstate").PromiseActorLogic<AuthSession | null, import("xstate").NonReducibleUnknown, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        validateAndRefreshSessionIfNeeded: {
                            src: "validateAndRefreshSessionIfNeeded";
                            logic: import("xstate").PromiseActorLogic<AuthSession | null, {
                                session?: AuthSession;
                            }, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        loginUser: {
                            src: "loginUser";
                            logic: import("xstate").PromiseActorLogic<AuthSession, LoginRequestDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        registerUser: {
                            src: "registerUser";
                            logic: import("xstate").PromiseActorLogic<void, RegisterRequestDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        requestPasswordReset: {
                            src: "requestPasswordReset";
                            logic: import("xstate").PromiseActorLogic<void, RequestOtpDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        verifyOtp: {
                            src: "verifyOtp";
                            logic: import("xstate").PromiseActorLogic<string, VerifyOtpDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        completeRegistration: {
                            src: "completeRegistration";
                            logic: import("xstate").PromiseActorLogic<void, CompleteRegistrationDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        completePasswordReset: {
                            src: "completePasswordReset";
                            logic: import("xstate").PromiseActorLogic<void, CompletePasswordResetDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        logoutUser: {
                            src: "logoutUser";
                            logic: import("xstate").PromiseActorLogic<void, import("xstate").NonReducibleUnknown, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        validateSessionWithServer: {
                            src: "validateSessionWithServer";
                            logic: import("xstate").PromiseActorLogic<AuthSession | null, {
                                session: AuthSession;
                            }, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                    }>, never, never, never, never>;
                }, {
                    readonly target: "unauthorized";
                }];
                readonly onError: {
                    readonly target: "unauthorized";
                };
            };
        };
        readonly validatingSession: {
            readonly on: {
                readonly COMPLETE_REGISTRATION: "#auth.unauthorized.completeRegistrationProcess";
            };
            readonly invoke: {
                readonly src: "validateSessionWithServer";
                readonly input: ({ context }: {
                    context: AuthContext;
                    event: {
                        type: "CHECK_SESSION";
                    } | {
                        type: "LOGIN";
                        payload: LoginRequestDTO;
                    } | {
                        type: "REGISTER";
                        payload: RegisterRequestDTO;
                    } | {
                        type: "FORGOT_PASSWORD";
                        payload: RequestOtpDTO;
                    } | {
                        type: "VERIFY_OTP";
                        payload: {
                            otp: string;
                        };
                    } | {
                        type: "RESET_PASSWORD";
                        payload: {
                            newPassword: string;
                        };
                    } | {
                        type: "COMPLETE_REGISTRATION";
                        payload: CompleteRegistrationDTO;
                    } | {
                        type: "REFRESH";
                    } | {
                        type: "LOGOUT";
                    } | {
                        type: "CANCEL";
                    } | {
                        type: "GO_TO_REGISTER";
                    } | {
                        type: "GO_TO_LOGIN";
                    } | {
                        type: "GO_TO_FORGOT_PASSWORD";
                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>;
                    self: import("xstate").ActorRef<import("xstate").MachineSnapshot<AuthContext, {
                        type: "CHECK_SESSION";
                    } | {
                        type: "LOGIN";
                        payload: LoginRequestDTO;
                    } | {
                        type: "REGISTER";
                        payload: RegisterRequestDTO;
                    } | {
                        type: "FORGOT_PASSWORD";
                        payload: RequestOtpDTO;
                    } | {
                        type: "VERIFY_OTP";
                        payload: {
                            otp: string;
                        };
                    } | {
                        type: "RESET_PASSWORD";
                        payload: {
                            newPassword: string;
                        };
                    } | {
                        type: "COMPLETE_REGISTRATION";
                        payload: CompleteRegistrationDTO;
                    } | {
                        type: "REFRESH";
                    } | {
                        type: "LOGOUT";
                    } | {
                        type: "CANCEL";
                    } | {
                        type: "GO_TO_REGISTER";
                    } | {
                        type: "GO_TO_LOGIN";
                    } | {
                        type: "GO_TO_FORGOT_PASSWORD";
                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, Record<string, import("xstate").AnyActorRef>, import("xstate").StateValue, string, unknown, any, any>, {
                        type: "CHECK_SESSION";
                    } | {
                        type: "LOGIN";
                        payload: LoginRequestDTO;
                    } | {
                        type: "REGISTER";
                        payload: RegisterRequestDTO;
                    } | {
                        type: "FORGOT_PASSWORD";
                        payload: RequestOtpDTO;
                    } | {
                        type: "VERIFY_OTP";
                        payload: {
                            otp: string;
                        };
                    } | {
                        type: "RESET_PASSWORD";
                        payload: {
                            newPassword: string;
                        };
                    } | {
                        type: "COMPLETE_REGISTRATION";
                        payload: CompleteRegistrationDTO;
                    } | {
                        type: "REFRESH";
                    } | {
                        type: "LOGOUT";
                    } | {
                        type: "CANCEL";
                    } | {
                        type: "GO_TO_REGISTER";
                    } | {
                        type: "GO_TO_LOGIN";
                    } | {
                        type: "GO_TO_FORGOT_PASSWORD";
                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, import("xstate").AnyEventObject>;
                }) => {
                    session: AuthSession;
                };
                readonly onDone: {
                    readonly target: "fetchingProfileAfterValidation";
                };
                readonly onError: {
                    readonly target: "refreshingToken";
                };
            };
        };
        readonly fetchingProfileAfterValidation: {
            readonly invoke: {
                readonly src: "validateSessionWithServer";
                readonly input: ({ context }: {
                    context: AuthContext;
                    event: {
                        type: "CHECK_SESSION";
                    } | {
                        type: "LOGIN";
                        payload: LoginRequestDTO;
                    } | {
                        type: "REGISTER";
                        payload: RegisterRequestDTO;
                    } | {
                        type: "FORGOT_PASSWORD";
                        payload: RequestOtpDTO;
                    } | {
                        type: "VERIFY_OTP";
                        payload: {
                            otp: string;
                        };
                    } | {
                        type: "RESET_PASSWORD";
                        payload: {
                            newPassword: string;
                        };
                    } | {
                        type: "COMPLETE_REGISTRATION";
                        payload: CompleteRegistrationDTO;
                    } | {
                        type: "REFRESH";
                    } | {
                        type: "LOGOUT";
                    } | {
                        type: "CANCEL";
                    } | {
                        type: "GO_TO_REGISTER";
                    } | {
                        type: "GO_TO_LOGIN";
                    } | {
                        type: "GO_TO_FORGOT_PASSWORD";
                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>;
                    self: import("xstate").ActorRef<import("xstate").MachineSnapshot<AuthContext, {
                        type: "CHECK_SESSION";
                    } | {
                        type: "LOGIN";
                        payload: LoginRequestDTO;
                    } | {
                        type: "REGISTER";
                        payload: RegisterRequestDTO;
                    } | {
                        type: "FORGOT_PASSWORD";
                        payload: RequestOtpDTO;
                    } | {
                        type: "VERIFY_OTP";
                        payload: {
                            otp: string;
                        };
                    } | {
                        type: "RESET_PASSWORD";
                        payload: {
                            newPassword: string;
                        };
                    } | {
                        type: "COMPLETE_REGISTRATION";
                        payload: CompleteRegistrationDTO;
                    } | {
                        type: "REFRESH";
                    } | {
                        type: "LOGOUT";
                    } | {
                        type: "CANCEL";
                    } | {
                        type: "GO_TO_REGISTER";
                    } | {
                        type: "GO_TO_LOGIN";
                    } | {
                        type: "GO_TO_FORGOT_PASSWORD";
                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, Record<string, import("xstate").AnyActorRef>, import("xstate").StateValue, string, unknown, any, any>, {
                        type: "CHECK_SESSION";
                    } | {
                        type: "LOGIN";
                        payload: LoginRequestDTO;
                    } | {
                        type: "REGISTER";
                        payload: RegisterRequestDTO;
                    } | {
                        type: "FORGOT_PASSWORD";
                        payload: RequestOtpDTO;
                    } | {
                        type: "VERIFY_OTP";
                        payload: {
                            otp: string;
                        };
                    } | {
                        type: "RESET_PASSWORD";
                        payload: {
                            newPassword: string;
                        };
                    } | {
                        type: "COMPLETE_REGISTRATION";
                        payload: CompleteRegistrationDTO;
                    } | {
                        type: "REFRESH";
                    } | {
                        type: "LOGOUT";
                    } | {
                        type: "CANCEL";
                    } | {
                        type: "GO_TO_REGISTER";
                    } | {
                        type: "GO_TO_LOGIN";
                    } | {
                        type: "GO_TO_FORGOT_PASSWORD";
                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, import("xstate").AnyEventObject>;
                }) => {
                    session: AuthSession;
                };
                readonly onDone: {
                    readonly target: "authorized";
                    readonly actions: readonly [import("xstate").ActionFunction<AuthContext, import("xstate").DoneActorEvent<AuthSession | null, string>, {
                        type: "CHECK_SESSION";
                    } | {
                        type: "LOGIN";
                        payload: LoginRequestDTO;
                    } | {
                        type: "REGISTER";
                        payload: RegisterRequestDTO;
                    } | {
                        type: "FORGOT_PASSWORD";
                        payload: RequestOtpDTO;
                    } | {
                        type: "VERIFY_OTP";
                        payload: {
                            otp: string;
                        };
                    } | {
                        type: "RESET_PASSWORD";
                        payload: {
                            newPassword: string;
                        };
                    } | {
                        type: "COMPLETE_REGISTRATION";
                        payload: CompleteRegistrationDTO;
                    } | {
                        type: "REFRESH";
                    } | {
                        type: "LOGOUT";
                    } | {
                        type: "CANCEL";
                    } | {
                        type: "GO_TO_REGISTER";
                    } | {
                        type: "GO_TO_LOGIN";
                    } | {
                        type: "GO_TO_FORGOT_PASSWORD";
                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, undefined, import("xstate").Values<{
                        refreshToken: {
                            src: "refreshToken";
                            logic: import("xstate").PromiseActorLogic<AuthSession, {
                                refreshToken: string;
                            }, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        checkSession: {
                            src: "checkSession";
                            logic: import("xstate").PromiseActorLogic<AuthSession | null, import("xstate").NonReducibleUnknown, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        validateAndRefreshSessionIfNeeded: {
                            src: "validateAndRefreshSessionIfNeeded";
                            logic: import("xstate").PromiseActorLogic<AuthSession | null, {
                                session?: AuthSession;
                            }, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        loginUser: {
                            src: "loginUser";
                            logic: import("xstate").PromiseActorLogic<AuthSession, LoginRequestDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        registerUser: {
                            src: "registerUser";
                            logic: import("xstate").PromiseActorLogic<void, RegisterRequestDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        requestPasswordReset: {
                            src: "requestPasswordReset";
                            logic: import("xstate").PromiseActorLogic<void, RequestOtpDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        verifyOtp: {
                            src: "verifyOtp";
                            logic: import("xstate").PromiseActorLogic<string, VerifyOtpDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        completeRegistration: {
                            src: "completeRegistration";
                            logic: import("xstate").PromiseActorLogic<void, CompleteRegistrationDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        completePasswordReset: {
                            src: "completePasswordReset";
                            logic: import("xstate").PromiseActorLogic<void, CompletePasswordResetDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        logoutUser: {
                            src: "logoutUser";
                            logic: import("xstate").PromiseActorLogic<void, import("xstate").NonReducibleUnknown, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        validateSessionWithServer: {
                            src: "validateSessionWithServer";
                            logic: import("xstate").PromiseActorLogic<AuthSession | null, {
                                session: AuthSession;
                            }, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                    }>, never, never, never, never>];
                };
                readonly onError: {
                    readonly target: "authorized";
                    readonly actions: readonly [import("xstate").ActionFunction<AuthContext, import("xstate").ErrorActorEvent<unknown, string>, {
                        type: "CHECK_SESSION";
                    } | {
                        type: "LOGIN";
                        payload: LoginRequestDTO;
                    } | {
                        type: "REGISTER";
                        payload: RegisterRequestDTO;
                    } | {
                        type: "FORGOT_PASSWORD";
                        payload: RequestOtpDTO;
                    } | {
                        type: "VERIFY_OTP";
                        payload: {
                            otp: string;
                        };
                    } | {
                        type: "RESET_PASSWORD";
                        payload: {
                            newPassword: string;
                        };
                    } | {
                        type: "COMPLETE_REGISTRATION";
                        payload: CompleteRegistrationDTO;
                    } | {
                        type: "REFRESH";
                    } | {
                        type: "LOGOUT";
                    } | {
                        type: "CANCEL";
                    } | {
                        type: "GO_TO_REGISTER";
                    } | {
                        type: "GO_TO_LOGIN";
                    } | {
                        type: "GO_TO_FORGOT_PASSWORD";
                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, undefined, import("xstate").Values<{
                        refreshToken: {
                            src: "refreshToken";
                            logic: import("xstate").PromiseActorLogic<AuthSession, {
                                refreshToken: string;
                            }, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        checkSession: {
                            src: "checkSession";
                            logic: import("xstate").PromiseActorLogic<AuthSession | null, import("xstate").NonReducibleUnknown, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        validateAndRefreshSessionIfNeeded: {
                            src: "validateAndRefreshSessionIfNeeded";
                            logic: import("xstate").PromiseActorLogic<AuthSession | null, {
                                session?: AuthSession;
                            }, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        loginUser: {
                            src: "loginUser";
                            logic: import("xstate").PromiseActorLogic<AuthSession, LoginRequestDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        registerUser: {
                            src: "registerUser";
                            logic: import("xstate").PromiseActorLogic<void, RegisterRequestDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        requestPasswordReset: {
                            src: "requestPasswordReset";
                            logic: import("xstate").PromiseActorLogic<void, RequestOtpDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        verifyOtp: {
                            src: "verifyOtp";
                            logic: import("xstate").PromiseActorLogic<string, VerifyOtpDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        completeRegistration: {
                            src: "completeRegistration";
                            logic: import("xstate").PromiseActorLogic<void, CompleteRegistrationDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        completePasswordReset: {
                            src: "completePasswordReset";
                            logic: import("xstate").PromiseActorLogic<void, CompletePasswordResetDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        logoutUser: {
                            src: "logoutUser";
                            logic: import("xstate").PromiseActorLogic<void, import("xstate").NonReducibleUnknown, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        validateSessionWithServer: {
                            src: "validateSessionWithServer";
                            logic: import("xstate").PromiseActorLogic<AuthSession | null, {
                                session: AuthSession;
                            }, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                    }>, never, never, never, never>];
                };
            };
        };
        readonly refreshingToken: {
            readonly on: {
                readonly COMPLETE_REGISTRATION: "#auth.unauthorized.completeRegistrationProcess";
            };
            readonly invoke: {
                readonly id: "refresh-token";
                readonly src: "refreshToken";
                readonly input: ({ context }: {
                    context: AuthContext;
                    event: {
                        type: "CHECK_SESSION";
                    } | {
                        type: "LOGIN";
                        payload: LoginRequestDTO;
                    } | {
                        type: "REGISTER";
                        payload: RegisterRequestDTO;
                    } | {
                        type: "FORGOT_PASSWORD";
                        payload: RequestOtpDTO;
                    } | {
                        type: "VERIFY_OTP";
                        payload: {
                            otp: string;
                        };
                    } | {
                        type: "RESET_PASSWORD";
                        payload: {
                            newPassword: string;
                        };
                    } | {
                        type: "COMPLETE_REGISTRATION";
                        payload: CompleteRegistrationDTO;
                    } | {
                        type: "REFRESH";
                    } | {
                        type: "LOGOUT";
                    } | {
                        type: "CANCEL";
                    } | {
                        type: "GO_TO_REGISTER";
                    } | {
                        type: "GO_TO_LOGIN";
                    } | {
                        type: "GO_TO_FORGOT_PASSWORD";
                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>;
                    self: import("xstate").ActorRef<import("xstate").MachineSnapshot<AuthContext, {
                        type: "CHECK_SESSION";
                    } | {
                        type: "LOGIN";
                        payload: LoginRequestDTO;
                    } | {
                        type: "REGISTER";
                        payload: RegisterRequestDTO;
                    } | {
                        type: "FORGOT_PASSWORD";
                        payload: RequestOtpDTO;
                    } | {
                        type: "VERIFY_OTP";
                        payload: {
                            otp: string;
                        };
                    } | {
                        type: "RESET_PASSWORD";
                        payload: {
                            newPassword: string;
                        };
                    } | {
                        type: "COMPLETE_REGISTRATION";
                        payload: CompleteRegistrationDTO;
                    } | {
                        type: "REFRESH";
                    } | {
                        type: "LOGOUT";
                    } | {
                        type: "CANCEL";
                    } | {
                        type: "GO_TO_REGISTER";
                    } | {
                        type: "GO_TO_LOGIN";
                    } | {
                        type: "GO_TO_FORGOT_PASSWORD";
                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, Record<string, import("xstate").AnyActorRef>, import("xstate").StateValue, string, unknown, any, any>, {
                        type: "CHECK_SESSION";
                    } | {
                        type: "LOGIN";
                        payload: LoginRequestDTO;
                    } | {
                        type: "REGISTER";
                        payload: RegisterRequestDTO;
                    } | {
                        type: "FORGOT_PASSWORD";
                        payload: RequestOtpDTO;
                    } | {
                        type: "VERIFY_OTP";
                        payload: {
                            otp: string;
                        };
                    } | {
                        type: "RESET_PASSWORD";
                        payload: {
                            newPassword: string;
                        };
                    } | {
                        type: "COMPLETE_REGISTRATION";
                        payload: CompleteRegistrationDTO;
                    } | {
                        type: "REFRESH";
                    } | {
                        type: "LOGOUT";
                    } | {
                        type: "CANCEL";
                    } | {
                        type: "GO_TO_REGISTER";
                    } | {
                        type: "GO_TO_LOGIN";
                    } | {
                        type: "GO_TO_FORGOT_PASSWORD";
                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, import("xstate").AnyEventObject>;
                }) => {
                    refreshToken: string;
                };
                readonly onDone: {
                    readonly target: "fetchingProfileAfterRefresh";
                    readonly actions: readonly [import("xstate").ActionFunction<AuthContext, import("xstate").DoneActorEvent<AuthSession, string>, {
                        type: "CHECK_SESSION";
                    } | {
                        type: "LOGIN";
                        payload: LoginRequestDTO;
                    } | {
                        type: "REGISTER";
                        payload: RegisterRequestDTO;
                    } | {
                        type: "FORGOT_PASSWORD";
                        payload: RequestOtpDTO;
                    } | {
                        type: "VERIFY_OTP";
                        payload: {
                            otp: string;
                        };
                    } | {
                        type: "RESET_PASSWORD";
                        payload: {
                            newPassword: string;
                        };
                    } | {
                        type: "COMPLETE_REGISTRATION";
                        payload: CompleteRegistrationDTO;
                    } | {
                        type: "REFRESH";
                    } | {
                        type: "LOGOUT";
                    } | {
                        type: "CANCEL";
                    } | {
                        type: "GO_TO_REGISTER";
                    } | {
                        type: "GO_TO_LOGIN";
                    } | {
                        type: "GO_TO_FORGOT_PASSWORD";
                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, undefined, import("xstate").Values<{
                        refreshToken: {
                            src: "refreshToken";
                            logic: import("xstate").PromiseActorLogic<AuthSession, {
                                refreshToken: string;
                            }, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        checkSession: {
                            src: "checkSession";
                            logic: import("xstate").PromiseActorLogic<AuthSession | null, import("xstate").NonReducibleUnknown, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        validateAndRefreshSessionIfNeeded: {
                            src: "validateAndRefreshSessionIfNeeded";
                            logic: import("xstate").PromiseActorLogic<AuthSession | null, {
                                session?: AuthSession;
                            }, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        loginUser: {
                            src: "loginUser";
                            logic: import("xstate").PromiseActorLogic<AuthSession, LoginRequestDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        registerUser: {
                            src: "registerUser";
                            logic: import("xstate").PromiseActorLogic<void, RegisterRequestDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        requestPasswordReset: {
                            src: "requestPasswordReset";
                            logic: import("xstate").PromiseActorLogic<void, RequestOtpDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        verifyOtp: {
                            src: "verifyOtp";
                            logic: import("xstate").PromiseActorLogic<string, VerifyOtpDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        completeRegistration: {
                            src: "completeRegistration";
                            logic: import("xstate").PromiseActorLogic<void, CompleteRegistrationDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        completePasswordReset: {
                            src: "completePasswordReset";
                            logic: import("xstate").PromiseActorLogic<void, CompletePasswordResetDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        logoutUser: {
                            src: "logoutUser";
                            logic: import("xstate").PromiseActorLogic<void, import("xstate").NonReducibleUnknown, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        validateSessionWithServer: {
                            src: "validateSessionWithServer";
                            logic: import("xstate").PromiseActorLogic<AuthSession | null, {
                                session: AuthSession;
                            }, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                    }>, never, never, never, never>];
                };
                readonly onError: {
                    readonly target: "unauthorized";
                    readonly actions: readonly [import("xstate").ActionFunction<AuthContext, import("xstate").ErrorActorEvent<unknown, string>, {
                        type: "CHECK_SESSION";
                    } | {
                        type: "LOGIN";
                        payload: LoginRequestDTO;
                    } | {
                        type: "REGISTER";
                        payload: RegisterRequestDTO;
                    } | {
                        type: "FORGOT_PASSWORD";
                        payload: RequestOtpDTO;
                    } | {
                        type: "VERIFY_OTP";
                        payload: {
                            otp: string;
                        };
                    } | {
                        type: "RESET_PASSWORD";
                        payload: {
                            newPassword: string;
                        };
                    } | {
                        type: "COMPLETE_REGISTRATION";
                        payload: CompleteRegistrationDTO;
                    } | {
                        type: "REFRESH";
                    } | {
                        type: "LOGOUT";
                    } | {
                        type: "CANCEL";
                    } | {
                        type: "GO_TO_REGISTER";
                    } | {
                        type: "GO_TO_LOGIN";
                    } | {
                        type: "GO_TO_FORGOT_PASSWORD";
                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, undefined, import("xstate").Values<{
                        refreshToken: {
                            src: "refreshToken";
                            logic: import("xstate").PromiseActorLogic<AuthSession, {
                                refreshToken: string;
                            }, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        checkSession: {
                            src: "checkSession";
                            logic: import("xstate").PromiseActorLogic<AuthSession | null, import("xstate").NonReducibleUnknown, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        validateAndRefreshSessionIfNeeded: {
                            src: "validateAndRefreshSessionIfNeeded";
                            logic: import("xstate").PromiseActorLogic<AuthSession | null, {
                                session?: AuthSession;
                            }, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        loginUser: {
                            src: "loginUser";
                            logic: import("xstate").PromiseActorLogic<AuthSession, LoginRequestDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        registerUser: {
                            src: "registerUser";
                            logic: import("xstate").PromiseActorLogic<void, RegisterRequestDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        requestPasswordReset: {
                            src: "requestPasswordReset";
                            logic: import("xstate").PromiseActorLogic<void, RequestOtpDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        verifyOtp: {
                            src: "verifyOtp";
                            logic: import("xstate").PromiseActorLogic<string, VerifyOtpDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        completeRegistration: {
                            src: "completeRegistration";
                            logic: import("xstate").PromiseActorLogic<void, CompleteRegistrationDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        completePasswordReset: {
                            src: "completePasswordReset";
                            logic: import("xstate").PromiseActorLogic<void, CompletePasswordResetDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        logoutUser: {
                            src: "logoutUser";
                            logic: import("xstate").PromiseActorLogic<void, import("xstate").NonReducibleUnknown, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        validateSessionWithServer: {
                            src: "validateSessionWithServer";
                            logic: import("xstate").PromiseActorLogic<AuthSession | null, {
                                session: AuthSession;
                            }, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                    }>, never, never, never, never>];
                };
            };
        };
        readonly fetchingProfileAfterRefresh: {
            readonly invoke: {
                readonly src: "validateSessionWithServer";
                readonly input: ({ context }: {
                    context: AuthContext;
                    event: {
                        type: "CHECK_SESSION";
                    } | {
                        type: "LOGIN";
                        payload: LoginRequestDTO;
                    } | {
                        type: "REGISTER";
                        payload: RegisterRequestDTO;
                    } | {
                        type: "FORGOT_PASSWORD";
                        payload: RequestOtpDTO;
                    } | {
                        type: "VERIFY_OTP";
                        payload: {
                            otp: string;
                        };
                    } | {
                        type: "RESET_PASSWORD";
                        payload: {
                            newPassword: string;
                        };
                    } | {
                        type: "COMPLETE_REGISTRATION";
                        payload: CompleteRegistrationDTO;
                    } | {
                        type: "REFRESH";
                    } | {
                        type: "LOGOUT";
                    } | {
                        type: "CANCEL";
                    } | {
                        type: "GO_TO_REGISTER";
                    } | {
                        type: "GO_TO_LOGIN";
                    } | {
                        type: "GO_TO_FORGOT_PASSWORD";
                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>;
                    self: import("xstate").ActorRef<import("xstate").MachineSnapshot<AuthContext, {
                        type: "CHECK_SESSION";
                    } | {
                        type: "LOGIN";
                        payload: LoginRequestDTO;
                    } | {
                        type: "REGISTER";
                        payload: RegisterRequestDTO;
                    } | {
                        type: "FORGOT_PASSWORD";
                        payload: RequestOtpDTO;
                    } | {
                        type: "VERIFY_OTP";
                        payload: {
                            otp: string;
                        };
                    } | {
                        type: "RESET_PASSWORD";
                        payload: {
                            newPassword: string;
                        };
                    } | {
                        type: "COMPLETE_REGISTRATION";
                        payload: CompleteRegistrationDTO;
                    } | {
                        type: "REFRESH";
                    } | {
                        type: "LOGOUT";
                    } | {
                        type: "CANCEL";
                    } | {
                        type: "GO_TO_REGISTER";
                    } | {
                        type: "GO_TO_LOGIN";
                    } | {
                        type: "GO_TO_FORGOT_PASSWORD";
                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, Record<string, import("xstate").AnyActorRef>, import("xstate").StateValue, string, unknown, any, any>, {
                        type: "CHECK_SESSION";
                    } | {
                        type: "LOGIN";
                        payload: LoginRequestDTO;
                    } | {
                        type: "REGISTER";
                        payload: RegisterRequestDTO;
                    } | {
                        type: "FORGOT_PASSWORD";
                        payload: RequestOtpDTO;
                    } | {
                        type: "VERIFY_OTP";
                        payload: {
                            otp: string;
                        };
                    } | {
                        type: "RESET_PASSWORD";
                        payload: {
                            newPassword: string;
                        };
                    } | {
                        type: "COMPLETE_REGISTRATION";
                        payload: CompleteRegistrationDTO;
                    } | {
                        type: "REFRESH";
                    } | {
                        type: "LOGOUT";
                    } | {
                        type: "CANCEL";
                    } | {
                        type: "GO_TO_REGISTER";
                    } | {
                        type: "GO_TO_LOGIN";
                    } | {
                        type: "GO_TO_FORGOT_PASSWORD";
                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, import("xstate").AnyEventObject>;
                }) => {
                    session: AuthSession;
                };
                readonly onDone: {
                    readonly target: "authorized";
                    readonly actions: readonly [import("xstate").ActionFunction<AuthContext, import("xstate").DoneActorEvent<AuthSession | null, string>, {
                        type: "CHECK_SESSION";
                    } | {
                        type: "LOGIN";
                        payload: LoginRequestDTO;
                    } | {
                        type: "REGISTER";
                        payload: RegisterRequestDTO;
                    } | {
                        type: "FORGOT_PASSWORD";
                        payload: RequestOtpDTO;
                    } | {
                        type: "VERIFY_OTP";
                        payload: {
                            otp: string;
                        };
                    } | {
                        type: "RESET_PASSWORD";
                        payload: {
                            newPassword: string;
                        };
                    } | {
                        type: "COMPLETE_REGISTRATION";
                        payload: CompleteRegistrationDTO;
                    } | {
                        type: "REFRESH";
                    } | {
                        type: "LOGOUT";
                    } | {
                        type: "CANCEL";
                    } | {
                        type: "GO_TO_REGISTER";
                    } | {
                        type: "GO_TO_LOGIN";
                    } | {
                        type: "GO_TO_FORGOT_PASSWORD";
                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, undefined, import("xstate").Values<{
                        refreshToken: {
                            src: "refreshToken";
                            logic: import("xstate").PromiseActorLogic<AuthSession, {
                                refreshToken: string;
                            }, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        checkSession: {
                            src: "checkSession";
                            logic: import("xstate").PromiseActorLogic<AuthSession | null, import("xstate").NonReducibleUnknown, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        validateAndRefreshSessionIfNeeded: {
                            src: "validateAndRefreshSessionIfNeeded";
                            logic: import("xstate").PromiseActorLogic<AuthSession | null, {
                                session?: AuthSession;
                            }, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        loginUser: {
                            src: "loginUser";
                            logic: import("xstate").PromiseActorLogic<AuthSession, LoginRequestDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        registerUser: {
                            src: "registerUser";
                            logic: import("xstate").PromiseActorLogic<void, RegisterRequestDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        requestPasswordReset: {
                            src: "requestPasswordReset";
                            logic: import("xstate").PromiseActorLogic<void, RequestOtpDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        verifyOtp: {
                            src: "verifyOtp";
                            logic: import("xstate").PromiseActorLogic<string, VerifyOtpDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        completeRegistration: {
                            src: "completeRegistration";
                            logic: import("xstate").PromiseActorLogic<void, CompleteRegistrationDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        completePasswordReset: {
                            src: "completePasswordReset";
                            logic: import("xstate").PromiseActorLogic<void, CompletePasswordResetDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        logoutUser: {
                            src: "logoutUser";
                            logic: import("xstate").PromiseActorLogic<void, import("xstate").NonReducibleUnknown, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        validateSessionWithServer: {
                            src: "validateSessionWithServer";
                            logic: import("xstate").PromiseActorLogic<AuthSession | null, {
                                session: AuthSession;
                            }, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                    }>, never, never, never, never>];
                };
                readonly onError: {
                    readonly target: "authorized";
                    readonly actions: readonly [import("xstate").ActionFunction<AuthContext, import("xstate").ErrorActorEvent<unknown, string>, {
                        type: "CHECK_SESSION";
                    } | {
                        type: "LOGIN";
                        payload: LoginRequestDTO;
                    } | {
                        type: "REGISTER";
                        payload: RegisterRequestDTO;
                    } | {
                        type: "FORGOT_PASSWORD";
                        payload: RequestOtpDTO;
                    } | {
                        type: "VERIFY_OTP";
                        payload: {
                            otp: string;
                        };
                    } | {
                        type: "RESET_PASSWORD";
                        payload: {
                            newPassword: string;
                        };
                    } | {
                        type: "COMPLETE_REGISTRATION";
                        payload: CompleteRegistrationDTO;
                    } | {
                        type: "REFRESH";
                    } | {
                        type: "LOGOUT";
                    } | {
                        type: "CANCEL";
                    } | {
                        type: "GO_TO_REGISTER";
                    } | {
                        type: "GO_TO_LOGIN";
                    } | {
                        type: "GO_TO_FORGOT_PASSWORD";
                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, undefined, import("xstate").Values<{
                        refreshToken: {
                            src: "refreshToken";
                            logic: import("xstate").PromiseActorLogic<AuthSession, {
                                refreshToken: string;
                            }, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        checkSession: {
                            src: "checkSession";
                            logic: import("xstate").PromiseActorLogic<AuthSession | null, import("xstate").NonReducibleUnknown, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        validateAndRefreshSessionIfNeeded: {
                            src: "validateAndRefreshSessionIfNeeded";
                            logic: import("xstate").PromiseActorLogic<AuthSession | null, {
                                session?: AuthSession;
                            }, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        loginUser: {
                            src: "loginUser";
                            logic: import("xstate").PromiseActorLogic<AuthSession, LoginRequestDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        registerUser: {
                            src: "registerUser";
                            logic: import("xstate").PromiseActorLogic<void, RegisterRequestDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        requestPasswordReset: {
                            src: "requestPasswordReset";
                            logic: import("xstate").PromiseActorLogic<void, RequestOtpDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        verifyOtp: {
                            src: "verifyOtp";
                            logic: import("xstate").PromiseActorLogic<string, VerifyOtpDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        completeRegistration: {
                            src: "completeRegistration";
                            logic: import("xstate").PromiseActorLogic<void, CompleteRegistrationDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        completePasswordReset: {
                            src: "completePasswordReset";
                            logic: import("xstate").PromiseActorLogic<void, CompletePasswordResetDTO, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        logoutUser: {
                            src: "logoutUser";
                            logic: import("xstate").PromiseActorLogic<void, import("xstate").NonReducibleUnknown, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                        validateSessionWithServer: {
                            src: "validateSessionWithServer";
                            logic: import("xstate").PromiseActorLogic<AuthSession | null, {
                                session: AuthSession;
                            }, import("xstate").EventObject>;
                            id: string | undefined;
                        };
                    }>, never, never, never, never>];
                };
            };
        };
        readonly unauthorized: {
            readonly initial: "login";
            readonly on: {
                readonly COMPLETE_REGISTRATION: ".completeRegistrationProcess";
            };
            readonly states: {
                readonly login: {
                    readonly initial: "idle";
                    readonly on: {
                        readonly GO_TO_REGISTER: "#auth.unauthorized.register";
                        readonly GO_TO_FORGOT_PASSWORD: "#auth.unauthorized.forgotPassword";
                    };
                    readonly states: {
                        readonly idle: {
                            readonly on: {
                                readonly LOGIN: {
                                    readonly target: "submitting";
                                    readonly actions: "clearError";
                                };
                            };
                        };
                        readonly submitting: {
                            readonly on: {
                                readonly CANCEL: "idle";
                            };
                            readonly invoke: {
                                readonly src: "loginUser";
                                readonly input: ({ event }: {
                                    context: AuthContext;
                                    event: {
                                        type: "CHECK_SESSION";
                                    } | {
                                        type: "LOGIN";
                                        payload: LoginRequestDTO;
                                    } | {
                                        type: "REGISTER";
                                        payload: RegisterRequestDTO;
                                    } | {
                                        type: "FORGOT_PASSWORD";
                                        payload: RequestOtpDTO;
                                    } | {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    } | {
                                        type: "RESET_PASSWORD";
                                        payload: {
                                            newPassword: string;
                                        };
                                    } | {
                                        type: "COMPLETE_REGISTRATION";
                                        payload: CompleteRegistrationDTO;
                                    } | {
                                        type: "REFRESH";
                                    } | {
                                        type: "LOGOUT";
                                    } | {
                                        type: "CANCEL";
                                    } | {
                                        type: "GO_TO_REGISTER";
                                    } | {
                                        type: "GO_TO_LOGIN";
                                    } | {
                                        type: "GO_TO_FORGOT_PASSWORD";
                                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>;
                                    self: import("xstate").ActorRef<import("xstate").MachineSnapshot<AuthContext, {
                                        type: "CHECK_SESSION";
                                    } | {
                                        type: "LOGIN";
                                        payload: LoginRequestDTO;
                                    } | {
                                        type: "REGISTER";
                                        payload: RegisterRequestDTO;
                                    } | {
                                        type: "FORGOT_PASSWORD";
                                        payload: RequestOtpDTO;
                                    } | {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    } | {
                                        type: "RESET_PASSWORD";
                                        payload: {
                                            newPassword: string;
                                        };
                                    } | {
                                        type: "COMPLETE_REGISTRATION";
                                        payload: CompleteRegistrationDTO;
                                    } | {
                                        type: "REFRESH";
                                    } | {
                                        type: "LOGOUT";
                                    } | {
                                        type: "CANCEL";
                                    } | {
                                        type: "GO_TO_REGISTER";
                                    } | {
                                        type: "GO_TO_LOGIN";
                                    } | {
                                        type: "GO_TO_FORGOT_PASSWORD";
                                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, Record<string, import("xstate").AnyActorRef>, import("xstate").StateValue, string, unknown, any, any>, {
                                        type: "CHECK_SESSION";
                                    } | {
                                        type: "LOGIN";
                                        payload: LoginRequestDTO;
                                    } | {
                                        type: "REGISTER";
                                        payload: RegisterRequestDTO;
                                    } | {
                                        type: "FORGOT_PASSWORD";
                                        payload: RequestOtpDTO;
                                    } | {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    } | {
                                        type: "RESET_PASSWORD";
                                        payload: {
                                            newPassword: string;
                                        };
                                    } | {
                                        type: "COMPLETE_REGISTRATION";
                                        payload: CompleteRegistrationDTO;
                                    } | {
                                        type: "REFRESH";
                                    } | {
                                        type: "LOGOUT";
                                    } | {
                                        type: "CANCEL";
                                    } | {
                                        type: "GO_TO_REGISTER";
                                    } | {
                                        type: "GO_TO_LOGIN";
                                    } | {
                                        type: "GO_TO_FORGOT_PASSWORD";
                                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, import("xstate").AnyEventObject>;
                                }) => LoginRequestDTO;
                                readonly onDone: {
                                    readonly target: "#auth.authorized";
                                    readonly actions: readonly ["setSession"];
                                };
                                readonly onError: {
                                    readonly target: "idle";
                                    readonly actions: "setError";
                                };
                            };
                        };
                    };
                };
                readonly completeRegistrationProcess: {
                    readonly invoke: {
                        readonly src: "completeRegistration";
                        readonly input: ({ event }: {
                            context: AuthContext;
                            event: {
                                type: "CHECK_SESSION";
                            } | {
                                type: "LOGIN";
                                payload: LoginRequestDTO;
                            } | {
                                type: "REGISTER";
                                payload: RegisterRequestDTO;
                            } | {
                                type: "FORGOT_PASSWORD";
                                payload: RequestOtpDTO;
                            } | {
                                type: "VERIFY_OTP";
                                payload: {
                                    otp: string;
                                };
                            } | {
                                type: "RESET_PASSWORD";
                                payload: {
                                    newPassword: string;
                                };
                            } | {
                                type: "COMPLETE_REGISTRATION";
                                payload: CompleteRegistrationDTO;
                            } | {
                                type: "REFRESH";
                            } | {
                                type: "LOGOUT";
                            } | {
                                type: "CANCEL";
                            } | {
                                type: "GO_TO_REGISTER";
                            } | {
                                type: "GO_TO_LOGIN";
                            } | {
                                type: "GO_TO_FORGOT_PASSWORD";
                            } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>;
                            self: import("xstate").ActorRef<import("xstate").MachineSnapshot<AuthContext, {
                                type: "CHECK_SESSION";
                            } | {
                                type: "LOGIN";
                                payload: LoginRequestDTO;
                            } | {
                                type: "REGISTER";
                                payload: RegisterRequestDTO;
                            } | {
                                type: "FORGOT_PASSWORD";
                                payload: RequestOtpDTO;
                            } | {
                                type: "VERIFY_OTP";
                                payload: {
                                    otp: string;
                                };
                            } | {
                                type: "RESET_PASSWORD";
                                payload: {
                                    newPassword: string;
                                };
                            } | {
                                type: "COMPLETE_REGISTRATION";
                                payload: CompleteRegistrationDTO;
                            } | {
                                type: "REFRESH";
                            } | {
                                type: "LOGOUT";
                            } | {
                                type: "CANCEL";
                            } | {
                                type: "GO_TO_REGISTER";
                            } | {
                                type: "GO_TO_LOGIN";
                            } | {
                                type: "GO_TO_FORGOT_PASSWORD";
                            } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, Record<string, import("xstate").AnyActorRef>, import("xstate").StateValue, string, unknown, any, any>, {
                                type: "CHECK_SESSION";
                            } | {
                                type: "LOGIN";
                                payload: LoginRequestDTO;
                            } | {
                                type: "REGISTER";
                                payload: RegisterRequestDTO;
                            } | {
                                type: "FORGOT_PASSWORD";
                                payload: RequestOtpDTO;
                            } | {
                                type: "VERIFY_OTP";
                                payload: {
                                    otp: string;
                                };
                            } | {
                                type: "RESET_PASSWORD";
                                payload: {
                                    newPassword: string;
                                };
                            } | {
                                type: "COMPLETE_REGISTRATION";
                                payload: CompleteRegistrationDTO;
                            } | {
                                type: "REFRESH";
                            } | {
                                type: "LOGOUT";
                            } | {
                                type: "CANCEL";
                            } | {
                                type: "GO_TO_REGISTER";
                            } | {
                                type: "GO_TO_LOGIN";
                            } | {
                                type: "GO_TO_FORGOT_PASSWORD";
                            } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, import("xstate").AnyEventObject>;
                        }) => CompleteRegistrationDTO;
                        readonly onDone: {
                            readonly target: "loggingInAfterCompletion";
                        };
                        readonly onError: {
                            readonly target: "login";
                            readonly actions: "setError";
                        };
                    };
                };
                readonly loggingInAfterCompletion: {
                    readonly invoke: {
                        readonly src: "loginUser";
                        readonly input: ({ context }: {
                            context: AuthContext;
                            event: {
                                type: "CHECK_SESSION";
                            } | {
                                type: "LOGIN";
                                payload: LoginRequestDTO;
                            } | {
                                type: "REGISTER";
                                payload: RegisterRequestDTO;
                            } | {
                                type: "FORGOT_PASSWORD";
                                payload: RequestOtpDTO;
                            } | {
                                type: "VERIFY_OTP";
                                payload: {
                                    otp: string;
                                };
                            } | {
                                type: "RESET_PASSWORD";
                                payload: {
                                    newPassword: string;
                                };
                            } | {
                                type: "COMPLETE_REGISTRATION";
                                payload: CompleteRegistrationDTO;
                            } | {
                                type: "REFRESH";
                            } | {
                                type: "LOGOUT";
                            } | {
                                type: "CANCEL";
                            } | {
                                type: "GO_TO_REGISTER";
                            } | {
                                type: "GO_TO_LOGIN";
                            } | {
                                type: "GO_TO_FORGOT_PASSWORD";
                            } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>;
                            self: import("xstate").ActorRef<import("xstate").MachineSnapshot<AuthContext, {
                                type: "CHECK_SESSION";
                            } | {
                                type: "LOGIN";
                                payload: LoginRequestDTO;
                            } | {
                                type: "REGISTER";
                                payload: RegisterRequestDTO;
                            } | {
                                type: "FORGOT_PASSWORD";
                                payload: RequestOtpDTO;
                            } | {
                                type: "VERIFY_OTP";
                                payload: {
                                    otp: string;
                                };
                            } | {
                                type: "RESET_PASSWORD";
                                payload: {
                                    newPassword: string;
                                };
                            } | {
                                type: "COMPLETE_REGISTRATION";
                                payload: CompleteRegistrationDTO;
                            } | {
                                type: "REFRESH";
                            } | {
                                type: "LOGOUT";
                            } | {
                                type: "CANCEL";
                            } | {
                                type: "GO_TO_REGISTER";
                            } | {
                                type: "GO_TO_LOGIN";
                            } | {
                                type: "GO_TO_FORGOT_PASSWORD";
                            } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, Record<string, import("xstate").AnyActorRef>, import("xstate").StateValue, string, unknown, any, any>, {
                                type: "CHECK_SESSION";
                            } | {
                                type: "LOGIN";
                                payload: LoginRequestDTO;
                            } | {
                                type: "REGISTER";
                                payload: RegisterRequestDTO;
                            } | {
                                type: "FORGOT_PASSWORD";
                                payload: RequestOtpDTO;
                            } | {
                                type: "VERIFY_OTP";
                                payload: {
                                    otp: string;
                                };
                            } | {
                                type: "RESET_PASSWORD";
                                payload: {
                                    newPassword: string;
                                };
                            } | {
                                type: "COMPLETE_REGISTRATION";
                                payload: CompleteRegistrationDTO;
                            } | {
                                type: "REFRESH";
                            } | {
                                type: "LOGOUT";
                            } | {
                                type: "CANCEL";
                            } | {
                                type: "GO_TO_REGISTER";
                            } | {
                                type: "GO_TO_LOGIN";
                            } | {
                                type: "GO_TO_FORGOT_PASSWORD";
                            } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, import("xstate").AnyEventObject>;
                        }) => LoginRequestDTO;
                        readonly onDone: {
                            readonly target: "#auth.authorized";
                            readonly actions: readonly ["setSession", "clearRegistrationContext"];
                        };
                        readonly onError: {
                            readonly target: "login";
                            readonly actions: readonly ["setError", "clearRegistrationContext"];
                        };
                    };
                };
                readonly register: {
                    readonly initial: "form";
                    readonly on: {
                        readonly GO_TO_LOGIN: {
                            readonly target: "#auth.unauthorized.login";
                            readonly actions: readonly ["clearRegistrationContext", "clearError"];
                        };
                    };
                    readonly states: {
                        readonly form: {
                            readonly on: {
                                readonly REGISTER: {
                                    readonly target: "submitting";
                                    readonly actions: readonly ["clearError", "setRegistrationEmail"];
                                };
                            };
                        };
                        readonly submitting: {
                            readonly on: {
                                readonly CANCEL: {
                                    readonly target: "form";
                                    readonly actions: "clearRegistrationContext";
                                };
                            };
                            readonly invoke: {
                                readonly src: "registerUser";
                                readonly input: ({ event }: {
                                    context: AuthContext;
                                    event: {
                                        type: "CHECK_SESSION";
                                    } | {
                                        type: "LOGIN";
                                        payload: LoginRequestDTO;
                                    } | {
                                        type: "REGISTER";
                                        payload: RegisterRequestDTO;
                                    } | {
                                        type: "FORGOT_PASSWORD";
                                        payload: RequestOtpDTO;
                                    } | {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    } | {
                                        type: "RESET_PASSWORD";
                                        payload: {
                                            newPassword: string;
                                        };
                                    } | {
                                        type: "COMPLETE_REGISTRATION";
                                        payload: CompleteRegistrationDTO;
                                    } | {
                                        type: "REFRESH";
                                    } | {
                                        type: "LOGOUT";
                                    } | {
                                        type: "CANCEL";
                                    } | {
                                        type: "GO_TO_REGISTER";
                                    } | {
                                        type: "GO_TO_LOGIN";
                                    } | {
                                        type: "GO_TO_FORGOT_PASSWORD";
                                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>;
                                    self: import("xstate").ActorRef<import("xstate").MachineSnapshot<AuthContext, {
                                        type: "CHECK_SESSION";
                                    } | {
                                        type: "LOGIN";
                                        payload: LoginRequestDTO;
                                    } | {
                                        type: "REGISTER";
                                        payload: RegisterRequestDTO;
                                    } | {
                                        type: "FORGOT_PASSWORD";
                                        payload: RequestOtpDTO;
                                    } | {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    } | {
                                        type: "RESET_PASSWORD";
                                        payload: {
                                            newPassword: string;
                                        };
                                    } | {
                                        type: "COMPLETE_REGISTRATION";
                                        payload: CompleteRegistrationDTO;
                                    } | {
                                        type: "REFRESH";
                                    } | {
                                        type: "LOGOUT";
                                    } | {
                                        type: "CANCEL";
                                    } | {
                                        type: "GO_TO_REGISTER";
                                    } | {
                                        type: "GO_TO_LOGIN";
                                    } | {
                                        type: "GO_TO_FORGOT_PASSWORD";
                                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, Record<string, import("xstate").AnyActorRef>, import("xstate").StateValue, string, unknown, any, any>, {
                                        type: "CHECK_SESSION";
                                    } | {
                                        type: "LOGIN";
                                        payload: LoginRequestDTO;
                                    } | {
                                        type: "REGISTER";
                                        payload: RegisterRequestDTO;
                                    } | {
                                        type: "FORGOT_PASSWORD";
                                        payload: RequestOtpDTO;
                                    } | {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    } | {
                                        type: "RESET_PASSWORD";
                                        payload: {
                                            newPassword: string;
                                        };
                                    } | {
                                        type: "COMPLETE_REGISTRATION";
                                        payload: CompleteRegistrationDTO;
                                    } | {
                                        type: "REFRESH";
                                    } | {
                                        type: "LOGOUT";
                                    } | {
                                        type: "CANCEL";
                                    } | {
                                        type: "GO_TO_REGISTER";
                                    } | {
                                        type: "GO_TO_LOGIN";
                                    } | {
                                        type: "GO_TO_FORGOT_PASSWORD";
                                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, import("xstate").AnyEventObject>;
                                }) => RegisterRequestDTO;
                                readonly onDone: "verifyOtp";
                                readonly onError: {
                                    readonly target: "form";
                                    readonly actions: "setError";
                                };
                            };
                        };
                        readonly verifyOtp: {
                            readonly on: {
                                readonly VERIFY_OTP: {
                                    readonly guard: ({ context }: import("xstate/dist/declarations/src/guards").GuardArgs<AuthContext, {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    }>) => boolean;
                                    readonly target: "verifyingOtp";
                                };
                                readonly CANCEL: {
                                    readonly target: "form";
                                    readonly actions: "clearRegistrationContext";
                                };
                            };
                        };
                        readonly verifyingOtp: {
                            readonly invoke: {
                                readonly src: "verifyOtp";
                                readonly input: ({ context, event }: {
                                    context: AuthContext;
                                    event: {
                                        type: "CHECK_SESSION";
                                    } | {
                                        type: "LOGIN";
                                        payload: LoginRequestDTO;
                                    } | {
                                        type: "REGISTER";
                                        payload: RegisterRequestDTO;
                                    } | {
                                        type: "FORGOT_PASSWORD";
                                        payload: RequestOtpDTO;
                                    } | {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    } | {
                                        type: "RESET_PASSWORD";
                                        payload: {
                                            newPassword: string;
                                        };
                                    } | {
                                        type: "COMPLETE_REGISTRATION";
                                        payload: CompleteRegistrationDTO;
                                    } | {
                                        type: "REFRESH";
                                    } | {
                                        type: "LOGOUT";
                                    } | {
                                        type: "CANCEL";
                                    } | {
                                        type: "GO_TO_REGISTER";
                                    } | {
                                        type: "GO_TO_LOGIN";
                                    } | {
                                        type: "GO_TO_FORGOT_PASSWORD";
                                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>;
                                    self: import("xstate").ActorRef<import("xstate").MachineSnapshot<AuthContext, {
                                        type: "CHECK_SESSION";
                                    } | {
                                        type: "LOGIN";
                                        payload: LoginRequestDTO;
                                    } | {
                                        type: "REGISTER";
                                        payload: RegisterRequestDTO;
                                    } | {
                                        type: "FORGOT_PASSWORD";
                                        payload: RequestOtpDTO;
                                    } | {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    } | {
                                        type: "RESET_PASSWORD";
                                        payload: {
                                            newPassword: string;
                                        };
                                    } | {
                                        type: "COMPLETE_REGISTRATION";
                                        payload: CompleteRegistrationDTO;
                                    } | {
                                        type: "REFRESH";
                                    } | {
                                        type: "LOGOUT";
                                    } | {
                                        type: "CANCEL";
                                    } | {
                                        type: "GO_TO_REGISTER";
                                    } | {
                                        type: "GO_TO_LOGIN";
                                    } | {
                                        type: "GO_TO_FORGOT_PASSWORD";
                                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, Record<string, import("xstate").AnyActorRef>, import("xstate").StateValue, string, unknown, any, any>, {
                                        type: "CHECK_SESSION";
                                    } | {
                                        type: "LOGIN";
                                        payload: LoginRequestDTO;
                                    } | {
                                        type: "REGISTER";
                                        payload: RegisterRequestDTO;
                                    } | {
                                        type: "FORGOT_PASSWORD";
                                        payload: RequestOtpDTO;
                                    } | {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    } | {
                                        type: "RESET_PASSWORD";
                                        payload: {
                                            newPassword: string;
                                        };
                                    } | {
                                        type: "COMPLETE_REGISTRATION";
                                        payload: CompleteRegistrationDTO;
                                    } | {
                                        type: "REFRESH";
                                    } | {
                                        type: "LOGOUT";
                                    } | {
                                        type: "CANCEL";
                                    } | {
                                        type: "GO_TO_REGISTER";
                                    } | {
                                        type: "GO_TO_LOGIN";
                                    } | {
                                        type: "GO_TO_FORGOT_PASSWORD";
                                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, import("xstate").AnyEventObject>;
                                }) => {
                                    email: string;
                                    otp: string;
                                };
                                readonly onDone: {
                                    readonly target: "completingRegistration";
                                    readonly actions: "setRegistrationActionToken";
                                };
                                readonly onError: {
                                    readonly target: "verifyOtp";
                                    readonly actions: "setError";
                                };
                            };
                        };
                        readonly completingRegistration: {
                            readonly invoke: {
                                readonly src: "completeRegistration";
                                readonly input: ({ context }: {
                                    context: AuthContext;
                                    event: {
                                        type: "CHECK_SESSION";
                                    } | {
                                        type: "LOGIN";
                                        payload: LoginRequestDTO;
                                    } | {
                                        type: "REGISTER";
                                        payload: RegisterRequestDTO;
                                    } | {
                                        type: "FORGOT_PASSWORD";
                                        payload: RequestOtpDTO;
                                    } | {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    } | {
                                        type: "RESET_PASSWORD";
                                        payload: {
                                            newPassword: string;
                                        };
                                    } | {
                                        type: "COMPLETE_REGISTRATION";
                                        payload: CompleteRegistrationDTO;
                                    } | {
                                        type: "REFRESH";
                                    } | {
                                        type: "LOGOUT";
                                    } | {
                                        type: "CANCEL";
                                    } | {
                                        type: "GO_TO_REGISTER";
                                    } | {
                                        type: "GO_TO_LOGIN";
                                    } | {
                                        type: "GO_TO_FORGOT_PASSWORD";
                                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>;
                                    self: import("xstate").ActorRef<import("xstate").MachineSnapshot<AuthContext, {
                                        type: "CHECK_SESSION";
                                    } | {
                                        type: "LOGIN";
                                        payload: LoginRequestDTO;
                                    } | {
                                        type: "REGISTER";
                                        payload: RegisterRequestDTO;
                                    } | {
                                        type: "FORGOT_PASSWORD";
                                        payload: RequestOtpDTO;
                                    } | {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    } | {
                                        type: "RESET_PASSWORD";
                                        payload: {
                                            newPassword: string;
                                        };
                                    } | {
                                        type: "COMPLETE_REGISTRATION";
                                        payload: CompleteRegistrationDTO;
                                    } | {
                                        type: "REFRESH";
                                    } | {
                                        type: "LOGOUT";
                                    } | {
                                        type: "CANCEL";
                                    } | {
                                        type: "GO_TO_REGISTER";
                                    } | {
                                        type: "GO_TO_LOGIN";
                                    } | {
                                        type: "GO_TO_FORGOT_PASSWORD";
                                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, Record<string, import("xstate").AnyActorRef>, import("xstate").StateValue, string, unknown, any, any>, {
                                        type: "CHECK_SESSION";
                                    } | {
                                        type: "LOGIN";
                                        payload: LoginRequestDTO;
                                    } | {
                                        type: "REGISTER";
                                        payload: RegisterRequestDTO;
                                    } | {
                                        type: "FORGOT_PASSWORD";
                                        payload: RequestOtpDTO;
                                    } | {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    } | {
                                        type: "RESET_PASSWORD";
                                        payload: {
                                            newPassword: string;
                                        };
                                    } | {
                                        type: "COMPLETE_REGISTRATION";
                                        payload: CompleteRegistrationDTO;
                                    } | {
                                        type: "REFRESH";
                                    } | {
                                        type: "LOGOUT";
                                    } | {
                                        type: "CANCEL";
                                    } | {
                                        type: "GO_TO_REGISTER";
                                    } | {
                                        type: "GO_TO_LOGIN";
                                    } | {
                                        type: "GO_TO_FORGOT_PASSWORD";
                                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, import("xstate").AnyEventObject>;
                                }) => {
                                    actionToken: string;
                                    newPassword: string;
                                };
                                readonly onDone: "loggingIn";
                                readonly onError: {
                                    readonly target: "verifyOtp";
                                    readonly actions: "setError";
                                };
                            };
                        };
                        readonly loggingIn: {
                            readonly invoke: {
                                readonly src: "loginUser";
                                readonly input: ({ context }: {
                                    context: AuthContext;
                                    event: {
                                        type: "CHECK_SESSION";
                                    } | {
                                        type: "LOGIN";
                                        payload: LoginRequestDTO;
                                    } | {
                                        type: "REGISTER";
                                        payload: RegisterRequestDTO;
                                    } | {
                                        type: "FORGOT_PASSWORD";
                                        payload: RequestOtpDTO;
                                    } | {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    } | {
                                        type: "RESET_PASSWORD";
                                        payload: {
                                            newPassword: string;
                                        };
                                    } | {
                                        type: "COMPLETE_REGISTRATION";
                                        payload: CompleteRegistrationDTO;
                                    } | {
                                        type: "REFRESH";
                                    } | {
                                        type: "LOGOUT";
                                    } | {
                                        type: "CANCEL";
                                    } | {
                                        type: "GO_TO_REGISTER";
                                    } | {
                                        type: "GO_TO_LOGIN";
                                    } | {
                                        type: "GO_TO_FORGOT_PASSWORD";
                                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>;
                                    self: import("xstate").ActorRef<import("xstate").MachineSnapshot<AuthContext, {
                                        type: "CHECK_SESSION";
                                    } | {
                                        type: "LOGIN";
                                        payload: LoginRequestDTO;
                                    } | {
                                        type: "REGISTER";
                                        payload: RegisterRequestDTO;
                                    } | {
                                        type: "FORGOT_PASSWORD";
                                        payload: RequestOtpDTO;
                                    } | {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    } | {
                                        type: "RESET_PASSWORD";
                                        payload: {
                                            newPassword: string;
                                        };
                                    } | {
                                        type: "COMPLETE_REGISTRATION";
                                        payload: CompleteRegistrationDTO;
                                    } | {
                                        type: "REFRESH";
                                    } | {
                                        type: "LOGOUT";
                                    } | {
                                        type: "CANCEL";
                                    } | {
                                        type: "GO_TO_REGISTER";
                                    } | {
                                        type: "GO_TO_LOGIN";
                                    } | {
                                        type: "GO_TO_FORGOT_PASSWORD";
                                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, Record<string, import("xstate").AnyActorRef>, import("xstate").StateValue, string, unknown, any, any>, {
                                        type: "CHECK_SESSION";
                                    } | {
                                        type: "LOGIN";
                                        payload: LoginRequestDTO;
                                    } | {
                                        type: "REGISTER";
                                        payload: RegisterRequestDTO;
                                    } | {
                                        type: "FORGOT_PASSWORD";
                                        payload: RequestOtpDTO;
                                    } | {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    } | {
                                        type: "RESET_PASSWORD";
                                        payload: {
                                            newPassword: string;
                                        };
                                    } | {
                                        type: "COMPLETE_REGISTRATION";
                                        payload: CompleteRegistrationDTO;
                                    } | {
                                        type: "REFRESH";
                                    } | {
                                        type: "LOGOUT";
                                    } | {
                                        type: "CANCEL";
                                    } | {
                                        type: "GO_TO_REGISTER";
                                    } | {
                                        type: "GO_TO_LOGIN";
                                    } | {
                                        type: "GO_TO_FORGOT_PASSWORD";
                                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, import("xstate").AnyEventObject>;
                                }) => LoginRequestDTO;
                                readonly onDone: {
                                    readonly target: "#auth.authorized";
                                    readonly actions: readonly ["setSession", "clearRegistrationContext"];
                                };
                                readonly onError: {
                                    readonly target: "#auth.unauthorized.login";
                                    readonly actions: readonly ["setError", "clearRegistrationContext"];
                                };
                            };
                        };
                    };
                };
                readonly forgotPassword: {
                    readonly initial: "idle";
                    readonly on: {
                        readonly GO_TO_LOGIN: {
                            readonly target: "#auth.unauthorized.login";
                            readonly actions: readonly ["clearPasswordResetContext", "clearError"];
                        };
                    };
                    readonly states: {
                        readonly idle: {
                            readonly on: {
                                readonly FORGOT_PASSWORD: {
                                    readonly target: "submitting";
                                    readonly actions: readonly ["setPasswordResetEmail", "clearError"];
                                };
                            };
                        };
                        readonly submitting: {
                            readonly on: {
                                readonly CANCEL: "idle";
                            };
                            readonly invoke: {
                                readonly src: "requestPasswordReset";
                                readonly input: ({ event }: {
                                    context: AuthContext;
                                    event: {
                                        type: "CHECK_SESSION";
                                    } | {
                                        type: "LOGIN";
                                        payload: LoginRequestDTO;
                                    } | {
                                        type: "REGISTER";
                                        payload: RegisterRequestDTO;
                                    } | {
                                        type: "FORGOT_PASSWORD";
                                        payload: RequestOtpDTO;
                                    } | {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    } | {
                                        type: "RESET_PASSWORD";
                                        payload: {
                                            newPassword: string;
                                        };
                                    } | {
                                        type: "COMPLETE_REGISTRATION";
                                        payload: CompleteRegistrationDTO;
                                    } | {
                                        type: "REFRESH";
                                    } | {
                                        type: "LOGOUT";
                                    } | {
                                        type: "CANCEL";
                                    } | {
                                        type: "GO_TO_REGISTER";
                                    } | {
                                        type: "GO_TO_LOGIN";
                                    } | {
                                        type: "GO_TO_FORGOT_PASSWORD";
                                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>;
                                    self: import("xstate").ActorRef<import("xstate").MachineSnapshot<AuthContext, {
                                        type: "CHECK_SESSION";
                                    } | {
                                        type: "LOGIN";
                                        payload: LoginRequestDTO;
                                    } | {
                                        type: "REGISTER";
                                        payload: RegisterRequestDTO;
                                    } | {
                                        type: "FORGOT_PASSWORD";
                                        payload: RequestOtpDTO;
                                    } | {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    } | {
                                        type: "RESET_PASSWORD";
                                        payload: {
                                            newPassword: string;
                                        };
                                    } | {
                                        type: "COMPLETE_REGISTRATION";
                                        payload: CompleteRegistrationDTO;
                                    } | {
                                        type: "REFRESH";
                                    } | {
                                        type: "LOGOUT";
                                    } | {
                                        type: "CANCEL";
                                    } | {
                                        type: "GO_TO_REGISTER";
                                    } | {
                                        type: "GO_TO_LOGIN";
                                    } | {
                                        type: "GO_TO_FORGOT_PASSWORD";
                                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, Record<string, import("xstate").AnyActorRef>, import("xstate").StateValue, string, unknown, any, any>, {
                                        type: "CHECK_SESSION";
                                    } | {
                                        type: "LOGIN";
                                        payload: LoginRequestDTO;
                                    } | {
                                        type: "REGISTER";
                                        payload: RegisterRequestDTO;
                                    } | {
                                        type: "FORGOT_PASSWORD";
                                        payload: RequestOtpDTO;
                                    } | {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    } | {
                                        type: "RESET_PASSWORD";
                                        payload: {
                                            newPassword: string;
                                        };
                                    } | {
                                        type: "COMPLETE_REGISTRATION";
                                        payload: CompleteRegistrationDTO;
                                    } | {
                                        type: "REFRESH";
                                    } | {
                                        type: "LOGOUT";
                                    } | {
                                        type: "CANCEL";
                                    } | {
                                        type: "GO_TO_REGISTER";
                                    } | {
                                        type: "GO_TO_LOGIN";
                                    } | {
                                        type: "GO_TO_FORGOT_PASSWORD";
                                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, import("xstate").AnyEventObject>;
                                }) => RequestOtpDTO;
                                readonly onDone: "verifyOtp";
                                readonly onError: {
                                    readonly target: "idle";
                                    readonly actions: "setError";
                                };
                            };
                        };
                        readonly verifyOtp: {
                            readonly on: {
                                readonly VERIFY_OTP: {
                                    readonly guard: ({ context }: import("xstate/dist/declarations/src/guards").GuardArgs<AuthContext, {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    }>) => boolean;
                                    readonly target: "verifyingOtp";
                                };
                                readonly CANCEL: {
                                    readonly target: "idle";
                                    readonly actions: "clearPasswordResetContext";
                                };
                            };
                        };
                        readonly verifyingOtp: {
                            readonly invoke: {
                                readonly src: "verifyOtp";
                                readonly input: ({ context, event }: {
                                    context: AuthContext;
                                    event: {
                                        type: "CHECK_SESSION";
                                    } | {
                                        type: "LOGIN";
                                        payload: LoginRequestDTO;
                                    } | {
                                        type: "REGISTER";
                                        payload: RegisterRequestDTO;
                                    } | {
                                        type: "FORGOT_PASSWORD";
                                        payload: RequestOtpDTO;
                                    } | {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    } | {
                                        type: "RESET_PASSWORD";
                                        payload: {
                                            newPassword: string;
                                        };
                                    } | {
                                        type: "COMPLETE_REGISTRATION";
                                        payload: CompleteRegistrationDTO;
                                    } | {
                                        type: "REFRESH";
                                    } | {
                                        type: "LOGOUT";
                                    } | {
                                        type: "CANCEL";
                                    } | {
                                        type: "GO_TO_REGISTER";
                                    } | {
                                        type: "GO_TO_LOGIN";
                                    } | {
                                        type: "GO_TO_FORGOT_PASSWORD";
                                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>;
                                    self: import("xstate").ActorRef<import("xstate").MachineSnapshot<AuthContext, {
                                        type: "CHECK_SESSION";
                                    } | {
                                        type: "LOGIN";
                                        payload: LoginRequestDTO;
                                    } | {
                                        type: "REGISTER";
                                        payload: RegisterRequestDTO;
                                    } | {
                                        type: "FORGOT_PASSWORD";
                                        payload: RequestOtpDTO;
                                    } | {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    } | {
                                        type: "RESET_PASSWORD";
                                        payload: {
                                            newPassword: string;
                                        };
                                    } | {
                                        type: "COMPLETE_REGISTRATION";
                                        payload: CompleteRegistrationDTO;
                                    } | {
                                        type: "REFRESH";
                                    } | {
                                        type: "LOGOUT";
                                    } | {
                                        type: "CANCEL";
                                    } | {
                                        type: "GO_TO_REGISTER";
                                    } | {
                                        type: "GO_TO_LOGIN";
                                    } | {
                                        type: "GO_TO_FORGOT_PASSWORD";
                                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, Record<string, import("xstate").AnyActorRef>, import("xstate").StateValue, string, unknown, any, any>, {
                                        type: "CHECK_SESSION";
                                    } | {
                                        type: "LOGIN";
                                        payload: LoginRequestDTO;
                                    } | {
                                        type: "REGISTER";
                                        payload: RegisterRequestDTO;
                                    } | {
                                        type: "FORGOT_PASSWORD";
                                        payload: RequestOtpDTO;
                                    } | {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    } | {
                                        type: "RESET_PASSWORD";
                                        payload: {
                                            newPassword: string;
                                        };
                                    } | {
                                        type: "COMPLETE_REGISTRATION";
                                        payload: CompleteRegistrationDTO;
                                    } | {
                                        type: "REFRESH";
                                    } | {
                                        type: "LOGOUT";
                                    } | {
                                        type: "CANCEL";
                                    } | {
                                        type: "GO_TO_REGISTER";
                                    } | {
                                        type: "GO_TO_LOGIN";
                                    } | {
                                        type: "GO_TO_FORGOT_PASSWORD";
                                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, import("xstate").AnyEventObject>;
                                }) => {
                                    email: string;
                                    otp: string;
                                };
                                readonly onDone: {
                                    readonly target: "resetPassword";
                                    readonly actions: "setPasswordResetActionToken";
                                };
                                readonly onError: {
                                    readonly target: "verifyOtp";
                                    readonly actions: "setError";
                                };
                            };
                        };
                        readonly resetPassword: {
                            readonly on: {
                                readonly RESET_PASSWORD: {
                                    readonly guard: ({ context }: import("xstate/dist/declarations/src/guards").GuardArgs<AuthContext, {
                                        type: "RESET_PASSWORD";
                                        payload: {
                                            newPassword: string;
                                        };
                                    }>) => boolean;
                                    readonly target: "resettingPassword";
                                    readonly actions: "setPasswordResetPendingPassword";
                                };
                            };
                        };
                        readonly resettingPassword: {
                            readonly invoke: {
                                readonly src: "completePasswordReset";
                                readonly input: ({ context }: {
                                    context: AuthContext;
                                    event: {
                                        type: "CHECK_SESSION";
                                    } | {
                                        type: "LOGIN";
                                        payload: LoginRequestDTO;
                                    } | {
                                        type: "REGISTER";
                                        payload: RegisterRequestDTO;
                                    } | {
                                        type: "FORGOT_PASSWORD";
                                        payload: RequestOtpDTO;
                                    } | {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    } | {
                                        type: "RESET_PASSWORD";
                                        payload: {
                                            newPassword: string;
                                        };
                                    } | {
                                        type: "COMPLETE_REGISTRATION";
                                        payload: CompleteRegistrationDTO;
                                    } | {
                                        type: "REFRESH";
                                    } | {
                                        type: "LOGOUT";
                                    } | {
                                        type: "CANCEL";
                                    } | {
                                        type: "GO_TO_REGISTER";
                                    } | {
                                        type: "GO_TO_LOGIN";
                                    } | {
                                        type: "GO_TO_FORGOT_PASSWORD";
                                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>;
                                    self: import("xstate").ActorRef<import("xstate").MachineSnapshot<AuthContext, {
                                        type: "CHECK_SESSION";
                                    } | {
                                        type: "LOGIN";
                                        payload: LoginRequestDTO;
                                    } | {
                                        type: "REGISTER";
                                        payload: RegisterRequestDTO;
                                    } | {
                                        type: "FORGOT_PASSWORD";
                                        payload: RequestOtpDTO;
                                    } | {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    } | {
                                        type: "RESET_PASSWORD";
                                        payload: {
                                            newPassword: string;
                                        };
                                    } | {
                                        type: "COMPLETE_REGISTRATION";
                                        payload: CompleteRegistrationDTO;
                                    } | {
                                        type: "REFRESH";
                                    } | {
                                        type: "LOGOUT";
                                    } | {
                                        type: "CANCEL";
                                    } | {
                                        type: "GO_TO_REGISTER";
                                    } | {
                                        type: "GO_TO_LOGIN";
                                    } | {
                                        type: "GO_TO_FORGOT_PASSWORD";
                                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, Record<string, import("xstate").AnyActorRef>, import("xstate").StateValue, string, unknown, any, any>, {
                                        type: "CHECK_SESSION";
                                    } | {
                                        type: "LOGIN";
                                        payload: LoginRequestDTO;
                                    } | {
                                        type: "REGISTER";
                                        payload: RegisterRequestDTO;
                                    } | {
                                        type: "FORGOT_PASSWORD";
                                        payload: RequestOtpDTO;
                                    } | {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    } | {
                                        type: "RESET_PASSWORD";
                                        payload: {
                                            newPassword: string;
                                        };
                                    } | {
                                        type: "COMPLETE_REGISTRATION";
                                        payload: CompleteRegistrationDTO;
                                    } | {
                                        type: "REFRESH";
                                    } | {
                                        type: "LOGOUT";
                                    } | {
                                        type: "CANCEL";
                                    } | {
                                        type: "GO_TO_REGISTER";
                                    } | {
                                        type: "GO_TO_LOGIN";
                                    } | {
                                        type: "GO_TO_FORGOT_PASSWORD";
                                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, import("xstate").AnyEventObject>;
                                }) => {
                                    actionToken: string;
                                    newPassword: string;
                                };
                                readonly onDone: "loggingInAfterReset";
                                readonly onError: {
                                    readonly target: "resetPassword";
                                    readonly actions: "setError";
                                };
                            };
                        };
                        readonly loggingInAfterReset: {
                            readonly invoke: {
                                readonly src: "loginUser";
                                readonly input: ({ context }: {
                                    context: AuthContext;
                                    event: {
                                        type: "CHECK_SESSION";
                                    } | {
                                        type: "LOGIN";
                                        payload: LoginRequestDTO;
                                    } | {
                                        type: "REGISTER";
                                        payload: RegisterRequestDTO;
                                    } | {
                                        type: "FORGOT_PASSWORD";
                                        payload: RequestOtpDTO;
                                    } | {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    } | {
                                        type: "RESET_PASSWORD";
                                        payload: {
                                            newPassword: string;
                                        };
                                    } | {
                                        type: "COMPLETE_REGISTRATION";
                                        payload: CompleteRegistrationDTO;
                                    } | {
                                        type: "REFRESH";
                                    } | {
                                        type: "LOGOUT";
                                    } | {
                                        type: "CANCEL";
                                    } | {
                                        type: "GO_TO_REGISTER";
                                    } | {
                                        type: "GO_TO_LOGIN";
                                    } | {
                                        type: "GO_TO_FORGOT_PASSWORD";
                                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>;
                                    self: import("xstate").ActorRef<import("xstate").MachineSnapshot<AuthContext, {
                                        type: "CHECK_SESSION";
                                    } | {
                                        type: "LOGIN";
                                        payload: LoginRequestDTO;
                                    } | {
                                        type: "REGISTER";
                                        payload: RegisterRequestDTO;
                                    } | {
                                        type: "FORGOT_PASSWORD";
                                        payload: RequestOtpDTO;
                                    } | {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    } | {
                                        type: "RESET_PASSWORD";
                                        payload: {
                                            newPassword: string;
                                        };
                                    } | {
                                        type: "COMPLETE_REGISTRATION";
                                        payload: CompleteRegistrationDTO;
                                    } | {
                                        type: "REFRESH";
                                    } | {
                                        type: "LOGOUT";
                                    } | {
                                        type: "CANCEL";
                                    } | {
                                        type: "GO_TO_REGISTER";
                                    } | {
                                        type: "GO_TO_LOGIN";
                                    } | {
                                        type: "GO_TO_FORGOT_PASSWORD";
                                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, Record<string, import("xstate").AnyActorRef>, import("xstate").StateValue, string, unknown, any, any>, {
                                        type: "CHECK_SESSION";
                                    } | {
                                        type: "LOGIN";
                                        payload: LoginRequestDTO;
                                    } | {
                                        type: "REGISTER";
                                        payload: RegisterRequestDTO;
                                    } | {
                                        type: "FORGOT_PASSWORD";
                                        payload: RequestOtpDTO;
                                    } | {
                                        type: "VERIFY_OTP";
                                        payload: {
                                            otp: string;
                                        };
                                    } | {
                                        type: "RESET_PASSWORD";
                                        payload: {
                                            newPassword: string;
                                        };
                                    } | {
                                        type: "COMPLETE_REGISTRATION";
                                        payload: CompleteRegistrationDTO;
                                    } | {
                                        type: "REFRESH";
                                    } | {
                                        type: "LOGOUT";
                                    } | {
                                        type: "CANCEL";
                                    } | {
                                        type: "GO_TO_REGISTER";
                                    } | {
                                        type: "GO_TO_LOGIN";
                                    } | {
                                        type: "GO_TO_FORGOT_PASSWORD";
                                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, import("xstate").AnyEventObject>;
                                }) => LoginRequestDTO;
                                readonly onDone: {
                                    readonly target: "#auth.authorized";
                                    readonly actions: readonly ["setSession", "clearPasswordResetContext"];
                                };
                                readonly onError: {
                                    readonly target: "#auth.unauthorized.login";
                                    readonly actions: readonly ["setError", "clearPasswordResetContext"];
                                };
                            };
                        };
                    };
                };
            };
        };
        readonly authorized: {
            readonly on: {
                readonly LOGOUT: {
                    readonly target: "loggingOut";
                };
                readonly REFRESH: {
                    readonly target: "refreshingToken";
                };
                readonly COMPLETE_REGISTRATION: "#auth.unauthorized.completeRegistrationProcess";
            };
            readonly invoke: {
                readonly src: "validateAndRefreshSessionIfNeeded";
                readonly input: ({ context }: {
                    context: AuthContext;
                    event: {
                        type: "CHECK_SESSION";
                    } | {
                        type: "LOGIN";
                        payload: LoginRequestDTO;
                    } | {
                        type: "REGISTER";
                        payload: RegisterRequestDTO;
                    } | {
                        type: "FORGOT_PASSWORD";
                        payload: RequestOtpDTO;
                    } | {
                        type: "VERIFY_OTP";
                        payload: {
                            otp: string;
                        };
                    } | {
                        type: "RESET_PASSWORD";
                        payload: {
                            newPassword: string;
                        };
                    } | {
                        type: "COMPLETE_REGISTRATION";
                        payload: CompleteRegistrationDTO;
                    } | {
                        type: "REFRESH";
                    } | {
                        type: "LOGOUT";
                    } | {
                        type: "CANCEL";
                    } | {
                        type: "GO_TO_REGISTER";
                    } | {
                        type: "GO_TO_LOGIN";
                    } | {
                        type: "GO_TO_FORGOT_PASSWORD";
                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>;
                    self: import("xstate").ActorRef<import("xstate").MachineSnapshot<AuthContext, {
                        type: "CHECK_SESSION";
                    } | {
                        type: "LOGIN";
                        payload: LoginRequestDTO;
                    } | {
                        type: "REGISTER";
                        payload: RegisterRequestDTO;
                    } | {
                        type: "FORGOT_PASSWORD";
                        payload: RequestOtpDTO;
                    } | {
                        type: "VERIFY_OTP";
                        payload: {
                            otp: string;
                        };
                    } | {
                        type: "RESET_PASSWORD";
                        payload: {
                            newPassword: string;
                        };
                    } | {
                        type: "COMPLETE_REGISTRATION";
                        payload: CompleteRegistrationDTO;
                    } | {
                        type: "REFRESH";
                    } | {
                        type: "LOGOUT";
                    } | {
                        type: "CANCEL";
                    } | {
                        type: "GO_TO_REGISTER";
                    } | {
                        type: "GO_TO_LOGIN";
                    } | {
                        type: "GO_TO_FORGOT_PASSWORD";
                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, Record<string, import("xstate").AnyActorRef>, import("xstate").StateValue, string, unknown, any, any>, {
                        type: "CHECK_SESSION";
                    } | {
                        type: "LOGIN";
                        payload: LoginRequestDTO;
                    } | {
                        type: "REGISTER";
                        payload: RegisterRequestDTO;
                    } | {
                        type: "FORGOT_PASSWORD";
                        payload: RequestOtpDTO;
                    } | {
                        type: "VERIFY_OTP";
                        payload: {
                            otp: string;
                        };
                    } | {
                        type: "RESET_PASSWORD";
                        payload: {
                            newPassword: string;
                        };
                    } | {
                        type: "COMPLETE_REGISTRATION";
                        payload: CompleteRegistrationDTO;
                    } | {
                        type: "REFRESH";
                    } | {
                        type: "LOGOUT";
                    } | {
                        type: "CANCEL";
                    } | {
                        type: "GO_TO_REGISTER";
                    } | {
                        type: "GO_TO_LOGIN";
                    } | {
                        type: "GO_TO_FORGOT_PASSWORD";
                    } | ErrorActorEvent | DoneActorEvent<AuthSession | null> | DoneActorEvent<AuthSession> | DoneActorEvent<void> | DoneActorEvent<string>, import("xstate").AnyEventObject>;
                }) => {
                    session: AuthSession | undefined;
                };
            };
        };
        readonly loggingOut: {
            readonly invoke: {
                readonly src: "logoutUser";
                readonly onDone: {
                    readonly target: "unauthorized";
                    readonly actions: readonly ["clearSession", "clearError"];
                };
                readonly onError: {
                    readonly target: "authorized";
                    readonly actions: "setError";
                };
            };
        };
    };
}>;
export {};
