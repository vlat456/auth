"use strict";
/**
 * Path: src/features/auth/machine/authMachine.ts
 * Version: 0.2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthMachine = void 0;
const xstate_1 = require("xstate");
const safetyUtils_1 = require("../utils/safetyUtils");
const createAuthMachine = (authRepository) => {
    return (0, xstate_1.setup)({
        types: {},
        actors: {
            checkSession: (0, xstate_1.fromPromise)(async () => {
                return await authRepository.checkSession();
            }),
            validateAndRefreshSessionIfNeeded: (0, xstate_1.fromPromise)(async ({ input }) => {
                // Simple direct call to the simplified repository
                const currentSession = input.session || (await authRepository.checkSession());
                if (!currentSession)
                    return null;
                // If we need refresh logic, it should be handled in the machine
                // For now, return the session as is
                return currentSession;
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
            refreshToken: (0, xstate_1.fromPromise)(async ({ input }) => {
                return await authRepository.refresh(input.refreshToken);
            }),
            validateSessionWithServer: (0, xstate_1.fromPromise)(async ({ input }) => {
                // Fetch fresh profile data using the new access token to avoid stale user data
                try {
                    // Use the repository's refreshProfile method which fetches profile using the stored token
                    return await authRepository.refreshProfile();
                }
                catch (error) {
                    // If profile fetch fails, return the session without updated profile
                    return input.session;
                }
            }),
        },
        actions: {
            setSession: (0, xstate_1.assign)({
                session: ({ event }) => {
                    // Use type guard for done events that produce a session
                    if (event.type.includes("done.actor") &&
                        "output" in event) {
                        return event.output ?? null;
                    }
                    return null;
                },
                error: null,
            }),
            setError: (0, xstate_1.assign)({
                error: ({ event }) => {
                    // All xstate error events have the error property, but we can't assertEvent to all
                    // since we don't know all possible error event types. Use type guard instead.
                    if ("error" in event &&
                        typeof event.error === "object" &&
                        event.error !== null &&
                        "message" in event.error) {
                        const msg = event.error.message ||
                            "An unexpected error occurred";
                        return { message: msg };
                    }
                    return { message: "An unexpected error occurred" };
                },
            }),
            clearError: (0, xstate_1.assign)({
                error: null,
            }),
            clearSession: (0, xstate_1.assign)({
                session: null,
            }),
            /**
             * Set email from REGISTER event and initialize registration flow context
             * Isolated from password reset flow context
             */
            setRegistrationEmail: (0, xstate_1.assign)({
                registration: ({ event }) => {
                    const payload = event.payload || {};
                    return {
                        email: payload.email ?? "",
                        pendingCredentials: {
                            email: payload.email ?? "",
                            password: payload.password ?? "",
                        },
                    };
                },
            }),
            /**
             * Set email from FORGOT_PASSWORD event and initialize password reset flow context
             * Isolated from registration flow context
             */
            setPasswordResetEmail: (0, xstate_1.assign)({
                passwordReset: ({ event }) => {
                    const payload = event.payload || {};
                    return {
                        email: payload.email ?? "",
                    };
                },
            }),
            /**
             * Clear registration flow context completely
             * Automatic cleanup when leaving registration flow
             */
            clearRegistrationContext: (0, xstate_1.assign)({
                registration: undefined,
            }),
            /**
             * Clear password reset flow context completely
             * Automatic cleanup when leaving password reset flow
             */
            clearPasswordResetContext: (0, xstate_1.assign)({
                passwordReset: undefined,
            }),
            /**
             * Store registration action token in registration context only
             */
            setRegistrationActionToken: (0, xstate_1.assign)({
                registration: ({ context, event }) => {
                    // Get token from done event
                    let token;
                    if (event.type.includes("done.actor") &&
                        "output" in event) {
                        const output = event.output;
                        token = typeof output === "string" ? output : undefined;
                    }
                    // Merge with existing registration context
                    return {
                        ...context.registration,
                        actionToken: token,
                    };
                },
            }),
            /**
             * Store password reset action token in password reset context only
             */
            setPasswordResetActionToken: (0, xstate_1.assign)({
                passwordReset: ({ context, event }) => {
                    // Get token from done event
                    let token;
                    if (event.type.includes("done.actor") &&
                        "output" in event) {
                        const output = event.output;
                        token = typeof output === "string" ? output : undefined;
                    }
                    // Merge with existing password reset context
                    return {
                        ...context.passwordReset,
                        actionToken: token,
                    };
                },
            }),
            /**
             * Update pending credentials in registration flow when new password is set
             */
            setRegistrationPendingPassword: (0, xstate_1.assign)({
                registration: ({ context, event }) => {
                    if (event.type === "RESET_PASSWORD" && "payload" in event) {
                        const payload = event.payload;
                        if (payload &&
                            typeof payload === "object" &&
                            "newPassword" in payload) {
                            return {
                                ...context.registration,
                                pendingCredentials: {
                                    email: context.registration?.email ?? "",
                                    password: payload.newPassword,
                                },
                            };
                        }
                    }
                    return context.registration;
                },
            }),
            /**
             * Update pending credentials in password reset flow when new password is set
             */
            setPasswordResetPendingPassword: (0, xstate_1.assign)({
                passwordReset: ({ context, event }) => {
                    if (event.type === "RESET_PASSWORD" && "payload" in event) {
                        const payload = event.payload;
                        if (payload &&
                            typeof payload === "object" &&
                            "newPassword" in payload) {
                            return {
                                ...context.passwordReset,
                                pendingCredentials: {
                                    email: context.passwordReset?.email ?? "",
                                    password: payload.newPassword,
                                },
                            };
                        }
                    }
                    return context.passwordReset;
                },
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
                    src: "checkSession",
                    onDone: [
                        {
                            guard: ({ event }) => !!event.output,
                            target: "validatingSession",
                            actions: (0, xstate_1.assign)({ session: ({ event }) => event.output }),
                        },
                        { target: "unauthorized" },
                    ],
                    onError: {
                        target: "unauthorized",
                    },
                },
            },
            validatingSession: {
                on: {
                    COMPLETE_REGISTRATION: "#auth.unauthorized.completeRegistrationProcess",
                },
                invoke: {
                    src: "validateSessionWithServer",
                    input: ({ context }) => ({ session: context.session }),
                    onDone: {
                        target: "fetchingProfileAfterValidation",
                    },
                    onError: {
                        target: "refreshingToken", // If validation fails, try to refresh
                    },
                },
            },
            fetchingProfileAfterValidation: {
                invoke: {
                    src: "validateSessionWithServer", // This will fetch the profile
                    input: ({ context }) => ({ session: context.session }),
                    onDone: {
                        target: "authorized",
                        actions: [
                            (0, xstate_1.assign)({
                                session: ({ event }) => event.output,
                            }),
                        ],
                    },
                    onError: {
                        target: "authorized", // If profile fetch fails, still go to authorized with existing session
                        actions: [
                            (0, xstate_1.assign)({
                                session: ({ context }) => {
                                    // Use the session from the context if profile fetch fails
                                    return context.session || null;
                                },
                            }),
                        ],
                    },
                },
            },
            refreshingToken: {
                on: {
                    COMPLETE_REGISTRATION: "#auth.unauthorized.completeRegistrationProcess",
                },
                invoke: {
                    id: "refresh-token",
                    src: "refreshToken",
                    input: ({ context }) => ({
                        refreshToken: context.session?.refreshToken || "",
                    }),
                    onDone: {
                        target: "fetchingProfileAfterRefresh",
                        actions: [
                            (0, xstate_1.assign)({
                                session: ({ event }) => event.output,
                            }),
                        ],
                    },
                    onError: {
                        target: "unauthorized", // Go to unauthenticated state if refresh fails
                        actions: [
                            (0, xstate_1.assign)({
                                session: () => null,
                                error: () => ({ message: "Session refresh failed" }),
                            }),
                        ],
                    },
                },
            },
            fetchingProfileAfterRefresh: {
                invoke: {
                    src: "validateSessionWithServer",
                    input: ({ context }) => ({ session: context.session }),
                    onDone: {
                        target: "authorized",
                        actions: [
                            (0, xstate_1.assign)({
                                session: ({ event }) => event.output,
                            }),
                        ],
                    },
                    onError: {
                        target: "authorized", // If profile fetch fails, still go to authorized with existing session
                        actions: [
                            (0, xstate_1.assign)({
                                session: ({ context }) => {
                                    // Use the session from the context if profile fetch fails
                                    return context.session || null;
                                },
                            }),
                        ],
                    },
                },
            },
            unauthorized: {
                initial: "login",
                on: {
                    COMPLETE_REGISTRATION: ".completeRegistrationProcess", // Handle complete registration from unauthorized state
                },
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
                                    input: ({ event }) => {
                                        (0, xstate_1.assertEvent)(event, "LOGIN");
                                        return event.payload;
                                    },
                                    onDone: {
                                        target: "#auth.authorized",
                                        actions: ["setSession"],
                                    },
                                    onError: {
                                        target: "idle",
                                        actions: "setError",
                                    },
                                },
                            },
                        },
                    },
                    completeRegistrationProcess: {
                        invoke: {
                            src: "completeRegistration",
                            input: ({ event }) => {
                                // Extract payload from COMPLETE_REGISTRATION event
                                if (event.type === "COMPLETE_REGISTRATION") {
                                    return event.payload;
                                }
                                return { actionToken: "", newPassword: "" };
                            },
                            onDone: {
                                target: "loggingInAfterCompletion",
                            },
                            onError: {
                                target: "login", // Return to login page
                                actions: "setError",
                            },
                        },
                    },
                    loggingInAfterCompletion: {
                        invoke: {
                            src: "loginUser",
                            input: ({ context }) => {
                                // Get credentials from registration context if available
                                if (context.registration?.pendingCredentials) {
                                    return context.registration.pendingCredentials;
                                }
                                // Missing or invalid credentials - return empty to be rejected by server
                                return { email: "", password: "" };
                            },
                            onDone: {
                                target: "#auth.authorized",
                                actions: [
                                    "setSession",
                                    "clearRegistrationContext",
                                ],
                            },
                            onError: {
                                target: "login",
                                actions: [
                                    "setError",
                                    "clearRegistrationContext",
                                ],
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
                                            "setRegistrationEmail",
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
                                    input: ({ event }) => {
                                        (0, xstate_1.assertEvent)(event, "REGISTER");
                                        return event.payload;
                                    },
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
                                        guard: ({ context }) => !!context.registration?.email,
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
                                    input: ({ context, event }) => {
                                        (0, xstate_1.assertEvent)(event, "VERIFY_OTP");
                                        return {
                                            email: context.registration?.email ?? "",
                                            otp: event.payload.otp,
                                        };
                                    },
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
                                        actionToken: context.registration?.actionToken ?? "",
                                        newPassword: (0, safetyUtils_1.resolveRegistrationPassword)(context.registration?.pendingCredentials),
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
                                    input: ({ context }) => {
                                        // SAFETY: Only use valid credentials, otherwise let API reject
                                        // This prevents sending empty credentials that would be rejected
                                        if ((0, safetyUtils_1.hasValidCredentials)(context.registration?.pendingCredentials)) {
                                            return context.registration.pendingCredentials;
                                        }
                                        // Missing or invalid credentials - return empty to be rejected by server
                                        // with a proper error message rather than sending invalid data
                                        return { email: "", password: "" };
                                    },
                                    onDone: {
                                        target: "#auth.authorized",
                                        actions: [
                                            "setSession",
                                            "clearRegistrationContext",
                                        ],
                                    },
                                    onError: {
                                        target: "#auth.unauthorized.login",
                                        actions: [
                                            "setError",
                                            "clearRegistrationContext",
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
                                actions: ["clearPasswordResetContext", "clearError"],
                            },
                        },
                        states: {
                            idle: {
                                on: {
                                    FORGOT_PASSWORD: {
                                        target: "submitting",
                                        actions: ["setPasswordResetEmail", "clearError"],
                                    },
                                },
                            },
                            submitting: {
                                on: {
                                    CANCEL: "idle",
                                },
                                invoke: {
                                    src: "requestPasswordReset",
                                    input: ({ event }) => {
                                        (0, xstate_1.assertEvent)(event, "FORGOT_PASSWORD");
                                        return event.payload;
                                    },
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
                                        guard: ({ context }) => !!context.passwordReset?.email,
                                        target: "verifyingOtp",
                                    },
                                    CANCEL: {
                                        target: "idle",
                                        actions: "clearPasswordResetContext",
                                    },
                                },
                            },
                            verifyingOtp: {
                                invoke: {
                                    src: "verifyOtp",
                                    input: ({ context, event }) => {
                                        (0, xstate_1.assertEvent)(event, "VERIFY_OTP");
                                        return {
                                            email: context.passwordReset?.email ?? "",
                                            otp: event.payload.otp,
                                        };
                                    },
                                    onDone: {
                                        target: "resetPassword",
                                        actions: "setPasswordResetActionToken",
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
                                        guard: ({ context }) => !!context.passwordReset?.actionToken,
                                        target: "resettingPassword",
                                        actions: "setPasswordResetPendingPassword",
                                    },
                                },
                            },
                            resettingPassword: {
                                invoke: {
                                    src: "completePasswordReset",
                                    input: ({ context }) => ({
                                        actionToken: context.passwordReset?.actionToken ?? "",
                                        newPassword: context.passwordReset?.pendingCredentials?.password ?? "",
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
                                    input: ({ context }) => {
                                        // SAFETY: Only use valid credentials, otherwise let API reject
                                        // This prevents sending empty credentials that would be rejected
                                        if ((0, safetyUtils_1.hasValidCredentials)(context.passwordReset?.pendingCredentials)) {
                                            return context.passwordReset.pendingCredentials;
                                        }
                                        // Missing or invalid credentials - return empty to be rejected by server
                                        // with a proper error message rather than sending invalid data
                                        return { email: "", password: "" };
                                    },
                                    onDone: {
                                        target: "#auth.authorized",
                                        actions: [
                                            "setSession",
                                            "clearPasswordResetContext",
                                        ],
                                    },
                                    onError: {
                                        target: "#auth.unauthorized.login",
                                        actions: [
                                            "setError",
                                            "clearPasswordResetContext",
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
                    REFRESH: {
                        target: "refreshingToken",
                    },
                    COMPLETE_REGISTRATION: "#auth.unauthorized.completeRegistrationProcess",
                },
                invoke: {
                    // Periodically check if the token needs a refresh
                    src: "validateAndRefreshSessionIfNeeded",
                    input: ({ context }) => ({ session: context.session ?? undefined }),
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
