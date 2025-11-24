"use strict";
/**
 * Path: src/features/auth/machine/authMachine.ts
 * Version: 0.2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthMachine = exports.resolveRegistrationPassword = void 0;
const xstate_1 = require("xstate");
const resolveRegistrationPassword = (pending) => {
    if (pending &&
        typeof pending.password === "string" &&
        pending.password.length > 0) {
        return pending.password;
    }
    return "";
};
exports.resolveRegistrationPassword = resolveRegistrationPassword;
const createAuthMachine = (authRepository) => {
    return (0, xstate_1.setup)({
        types: {
            context: {},
            events: {},
        },
        actors: {
            checkSessionParams: (0, xstate_1.fromPromise)(async () => {
                return await authRepository.checkSession();
            }),
            loginUser: (0, xstate_1.fromPromise)(async ({ input }) => {
                return await authRepository.login(input);
            }),
            registerUser: (0, xstate_1.fromPromise)(async ({ input }) => {
                return await authRepository.register(input);
            }),
            requestPasswordReset: (0, xstate_1.fromPromise)(async ({ input }) => {
                return await authRepository.requestPasswordReset(input);
            }),
            verifyOtp: (0, xstate_1.fromPromise)(async ({ input }) => {
                return await authRepository.verifyOtp(input);
            }),
            completeRegistration: (0, xstate_1.fromPromise)(async ({ input }) => {
                return await authRepository.completeRegistration(input);
            }),
            completePasswordReset: (0, xstate_1.fromPromise)(async ({ input }) => {
                return await authRepository.completePasswordReset(input);
            }),
            logoutUser: (0, xstate_1.fromPromise)(async () => {
                return await authRepository.logout();
            }),
        },
        actions: {
            setSession: (0, xstate_1.assign)({
                session: ({ event }) => event.output,
                error: null,
            }),
            setError: (0, xstate_1.assign)({
                error: ({ event }) => ({
                    message: event.error?.message ||
                        "An unexpected error occurred",
                }),
            }),
            clearError: (0, xstate_1.assign)({
                error: null,
            }),
            clearSession: (0, xstate_1.assign)({
                session: null,
            }),
            setEmailFromPayload: (0, xstate_1.assign)({
                email: ({ event }) => event.payload?.email,
            }),
            clearForgotPasswordContext: (0, xstate_1.assign)({
                email: undefined,
                resetActionToken: undefined,
                pendingCredentials: undefined,
            }),
            clearRegistrationContext: (0, xstate_1.assign)({
                email: undefined,
                registrationActionToken: undefined,
                pendingCredentials: undefined,
            }),
            setPendingCredentials: (0, xstate_1.assign)({
                pendingCredentials: ({ event }) => event.payload,
            }),
            clearPendingCredentials: (0, xstate_1.assign)({
                pendingCredentials: undefined,
            }),
            setRegistrationActionToken: (0, xstate_1.assign)({
                registrationActionToken: ({ event }) => event.output,
            }),
            setResetActionToken: (0, xstate_1.assign)({
                resetActionToken: ({ event }) => event.output,
            }),
            setPendingCredentialsFromNewPassword: (0, xstate_1.assign)({
                pendingCredentials: ({ context, event }) => ({
                    email: context.email ?? "",
                    password: event.payload.newPassword,
                }),
            }),
        },
    }).createMachine({
        id: "auth",
        context: {
            session: null,
            error: null,
        },
        initial: "checkingSession",
        states: {
            checkingSession: {
                invoke: {
                    src: "checkSessionParams",
                    onDone: [
                        {
                            guard: ({ event }) => !!event.output,
                            target: "authorized",
                            actions: "setSession",
                        },
                        { target: "unauthorized" },
                    ],
                    onError: {
                        target: "unauthorized",
                    },
                },
            },
            unauthorized: {
                initial: "login",
                states: {
                    login: {
                        initial: "idle",
                        on: {
                            GO_TO_REGISTER: "#auth.unauthorized.register",
                            GO_TO_FORGOT_PASSWORD: "#auth.unauthorized.forgotPassword",
                        },
                        states: {
                            idle: {
                                on: {
                                    LOGIN: {
                                        target: "submitting",
                                        actions: "clearError",
                                    },
                                },
                            },
                            submitting: {
                                on: {
                                    CANCEL: "idle",
                                },
                                invoke: {
                                    src: "loginUser",
                                    input: ({ event }) => event.payload,
                                    onDone: {
                                        target: "#auth.authorized",
                                        actions: ["setSession", "clearPendingCredentials"],
                                    },
                                    onError: {
                                        target: "idle",
                                        actions: "setError",
                                    },
                                },
                            },
                        },
                    },
                    register: {
                        initial: "form",
                        on: {
                            GO_TO_LOGIN: {
                                target: "#auth.unauthorized.login",
                                actions: ["clearRegistrationContext", "clearError"],
                            },
                        },
                        states: {
                            form: {
                                on: {
                                    REGISTER: {
                                        target: "submitting",
                                        actions: [
                                            "clearError",
                                            "setPendingCredentials",
                                            "setEmailFromPayload",
                                        ],
                                    },
                                },
                            },
                            submitting: {
                                on: {
                                    CANCEL: {
                                        target: "form",
                                        actions: "clearRegistrationContext",
                                    },
                                },
                                invoke: {
                                    src: "registerUser",
                                    input: ({ event }) => event.payload,
                                    onDone: "verifyOtp",
                                    onError: {
                                        target: "form",
                                        actions: "setError",
                                    },
                                },
                            },
                            verifyOtp: {
                                on: {
                                    VERIFY_OTP: {
                                        guard: ({ context }) => !!context.email,
                                        target: "verifyingOtp",
                                    },
                                    CANCEL: {
                                        target: "form",
                                        actions: "clearRegistrationContext",
                                    },
                                },
                            },
                            verifyingOtp: {
                                invoke: {
                                    src: "verifyOtp",
                                    input: ({ context, event }) => ({
                                        email: context.email ?? "",
                                        otp: event.payload.otp,
                                    }),
                                    onDone: {
                                        target: "completingRegistration",
                                        actions: "setRegistrationActionToken",
                                    },
                                    onError: {
                                        target: "verifyOtp",
                                        actions: "setError",
                                    },
                                },
                            },
                            completingRegistration: {
                                invoke: {
                                    src: "completeRegistration",
                                    input: ({ context }) => ({
                                        actionToken: context.registrationActionToken ?? "",
                                        newPassword: (0, exports.resolveRegistrationPassword)(context.pendingCredentials),
                                    }),
                                    onDone: "loggingIn",
                                    onError: {
                                        target: "verifyOtp",
                                        actions: "setError",
                                    },
                                },
                            },
                            loggingIn: {
                                invoke: {
                                    src: "loginUser",
                                    input: ({ context }) => context.pendingCredentials ?? { email: "", password: "" },
                                    onDone: {
                                        target: "#auth.authorized",
                                        actions: [
                                            "setSession",
                                            "clearRegistrationContext",
                                            "clearPendingCredentials",
                                        ],
                                    },
                                    onError: {
                                        target: "#auth.unauthorized.login",
                                        actions: [
                                            "setError",
                                            "clearRegistrationContext",
                                            "clearPendingCredentials",
                                        ],
                                    },
                                },
                            },
                        },
                    },
                    forgotPassword: {
                        initial: "idle",
                        on: {
                            GO_TO_LOGIN: {
                                target: "#auth.unauthorized.login",
                                actions: ["clearForgotPasswordContext", "clearError"],
                            },
                        },
                        states: {
                            idle: {
                                on: {
                                    FORGOT_PASSWORD: {
                                        target: "submitting",
                                        actions: ["setEmailFromPayload", "clearError"],
                                    },
                                },
                            },
                            submitting: {
                                on: {
                                    CANCEL: "idle",
                                },
                                invoke: {
                                    src: "requestPasswordReset",
                                    input: ({ event }) => event.payload,
                                    onDone: "verifyOtp",
                                    onError: {
                                        target: "idle",
                                        actions: "setError",
                                    },
                                },
                            },
                            verifyOtp: {
                                on: {
                                    VERIFY_OTP: {
                                        guard: ({ context }) => !!context.email,
                                        target: "verifyingOtp",
                                    },
                                    CANCEL: {
                                        target: "idle",
                                        actions: "clearForgotPasswordContext",
                                    },
                                },
                            },
                            verifyingOtp: {
                                invoke: {
                                    src: "verifyOtp",
                                    input: ({ context, event }) => ({
                                        email: context.email ?? "",
                                        otp: event.payload.otp,
                                    }),
                                    onDone: {
                                        target: "resetPassword",
                                        actions: "setResetActionToken",
                                    },
                                    onError: {
                                        target: "verifyOtp",
                                        actions: "setError",
                                    },
                                },
                            },
                            resetPassword: {
                                on: {
                                    RESET_PASSWORD: {
                                        guard: ({ context }) => !!context.resetActionToken,
                                        target: "resettingPassword",
                                        actions: "setPendingCredentialsFromNewPassword",
                                    },
                                },
                            },
                            resettingPassword: {
                                invoke: {
                                    src: "completePasswordReset",
                                    input: ({ context }) => ({
                                        actionToken: context.resetActionToken ?? "",
                                        newPassword: context.pendingCredentials?.password ?? "",
                                    }),
                                    onDone: "loggingInAfterReset",
                                    onError: {
                                        target: "resetPassword",
                                        actions: "setError",
                                    },
                                },
                            },
                            loggingInAfterReset: {
                                invoke: {
                                    src: "loginUser",
                                    input: ({ context }) => context.pendingCredentials ?? { email: "", password: "" },
                                    onDone: {
                                        target: "#auth.authorized",
                                        actions: [
                                            "setSession",
                                            "clearForgotPasswordContext",
                                            "clearPendingCredentials",
                                        ],
                                    },
                                    onError: {
                                        target: "#auth.unauthorized.login",
                                        actions: [
                                            "setError",
                                            "clearForgotPasswordContext",
                                            "clearPendingCredentials",
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
            },
            authorized: {
                on: {
                    LOGOUT: {
                        target: "loggingOut",
                    },
                },
            },
            loggingOut: {
                invoke: {
                    src: "logoutUser",
                    onDone: {
                        target: "unauthorized",
                        actions: ["clearSession", "clearError"],
                    },
                    onError: {
                        target: "authorized",
                        actions: "setError",
                    },
                },
            },
        },
    });
};
exports.createAuthMachine = createAuthMachine;
