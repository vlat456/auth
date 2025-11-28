/**
 * Path: src/features/auth/machine/authMachine.ts
 * Version: 0.2.0
 */

import { setup, assign, fromPromise, assertEvent } from "xstate";
import {
  AuthSession,
  AuthError,
  LoginRequestDTO,
  RegisterRequestDTO,
  RequestOtpDTO,
  VerifyOtpDTO,
  CompleteRegistrationDTO,
  CompletePasswordResetDTO,
  IAuthRepository,
} from "../types";
import {
  resolveRegistrationPassword,
  hasValidCredentials,
} from "../utils/safetyUtils";

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
  // Shared across all flows
  session: AuthSession | null;
  error: AuthError | null;
  isRefreshing: boolean; // Flag to track if a refresh operation is in progress

  // Flow-specific contexts - exist only during those flows
  registration?: RegistrationFlowContext;
  passwordReset?: PasswordResetFlowContext;
};

export type AuthEvent =
  | { type: "CHECK_SESSION" }
  | { type: "LOGIN"; payload: LoginRequestDTO }
  | { type: "REGISTER"; payload: RegisterRequestDTO }
  | { type: "FORGOT_PASSWORD"; payload: RequestOtpDTO }
  | { type: "VERIFY_OTP"; payload: { otp: string } }
  | { type: "RESET_PASSWORD"; payload: { newPassword: string } }
  | { type: "COMPLETE_REGISTRATION"; payload: CompleteRegistrationDTO }
  | { type: "REFRESH" }
  | { type: "LOGOUT" }
  | { type: "CANCEL" }
  | { type: "GO_TO_REGISTER" }
  | { type: "GO_TO_LOGIN" }
  | { type: "GO_TO_FORGOT_PASSWORD" };

// Type-safe system event handlers
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

// Union type for specific actor outputs based on actual machine actors
type SystemEvents =
  | DoneActorEvent<AuthSession | null> // checkSession, validateSessionWithServer, refreshProfile
  | DoneActorEvent<AuthSession> // loginUser, refreshToken
  | DoneActorEvent<void> // registerUser, verifyOtp, completePasswordReset, completeRegistration
  | DoneActorEvent<string> // verifyOtp (returns action token)
  | ErrorActorEvent;

// Extended event type that includes both user events and system events
export type EventWithSystem = AuthEvent | SystemEvents;

export const createAuthMachine = (authRepository: IAuthRepository) => {
  return setup({
    types: {} as {
      context: AuthContext;
      events: EventWithSystem;
    },
    actors: {
      checkSession: fromPromise(async () => {
        return await authRepository.checkSession();
      }),
      validateAndRefreshSessionIfNeeded: fromPromise(
        async ({ input }: { input: { session?: AuthSession } }) => {
          // Simple direct call to the simplified repository
          const currentSession =
            input.session || (await authRepository.checkSession());
          if (!currentSession) return null;

          // If we need refresh logic, it should be handled in the machine
          // For now, return the session as is
          return currentSession;
        }
      ),
      loginUser: fromPromise(async ({ input }: { input: LoginRequestDTO }) => {
        return await authRepository.login(input);
      }),
      registerUser: fromPromise(
        async ({ input }: { input: RegisterRequestDTO }) => {
          return await authRepository.register(input);
        }
      ),
      requestPasswordReset: fromPromise(
        async ({ input }: { input: RequestOtpDTO }) => {
          return await authRepository.requestPasswordReset(input);
        }
      ),
      verifyOtp: fromPromise(async ({ input }: { input: VerifyOtpDTO }) => {
        return await authRepository.verifyOtp(input);
      }),
      completeRegistration: fromPromise(
        async ({ input }: { input: CompleteRegistrationDTO }) => {
          return await authRepository.completeRegistration(input);
        }
      ),
      completePasswordReset: fromPromise(
        async ({ input }: { input: CompletePasswordResetDTO }) => {
          return await authRepository.completePasswordReset(input);
        }
      ),
      logoutUser: fromPromise(async () => {
        return await authRepository.logout();
      }),
      refreshToken: fromPromise(
        async ({ input }: { input: { refreshToken: string } }) => {
          return await authRepository.refresh(input.refreshToken);
        }
      ),
      validateSessionWithServer: fromPromise(
        async ({ input }: { input: { session: AuthSession } }) => {
          // Fetch fresh profile data using the new access token to avoid stale user data
          try {
            // Use the repository's refreshProfile method which fetches profile using the stored token
            return await authRepository.refreshProfile();
          } catch (error) {
            // If profile fetch fails, return the session without updated profile
            return input.session;
          }
        }
      ),
    },
    actions: {
      setSession: assign({
        session: ({ event }) => {
          // Use type guard for done events that produce a session
          if (
            (event.type as string).includes("done.actor") &&
            "output" in event
          ) {
            return (event as any).output ?? null;
          }
          return null;
        },
        error: null,
      }),
      setError: assign({
        error: ({ event }) => {
          // All xstate error events have the error property, but we can't assertEvent to all
          // since we don't know all possible error event types. Use type guard instead.
          if (
            "error" in event &&
            typeof event.error === "object" &&
            event.error !== null &&
            "message" in event.error
          ) {
            const msg =
              (event.error as { message: string }).message ||
              "An unexpected error occurred";
            return { message: msg };
          }
          return { message: "An unexpected error occurred" };
        },
      }),
      clearError: assign({
        error: null,
      }),
      clearSession: assign({
        session: null,
      }),
      /**
       * Set email from REGISTER event and initialize registration flow context
       * Isolated from password reset flow context
       */
      setRegistrationEmail: assign({
        registration: ({ event }: any) => {
          const payload = event.payload || {};
          return {
            email: payload.email ?? "",
            pendingCredentials: {
              email: payload.email ?? "",
              password: payload.password ?? "",
            },
          } as RegistrationFlowContext;
        },
      }),
      /**
       * Set email from FORGOT_PASSWORD event and initialize password reset flow context
       * Isolated from registration flow context
       */
      setPasswordResetEmail: assign({
        passwordReset: ({ event }: any) => {
          const payload = event.payload || {};
          return {
            email: payload.email ?? "",
          } as PasswordResetFlowContext;
        },
      }),
      /**
       * Clear registration flow context completely
       * Automatic cleanup when leaving registration flow
       */
      clearRegistrationContext: assign({
        registration: undefined,
      }),
      /**
       * Clear password reset flow context completely
       * Automatic cleanup when leaving password reset flow
       */
      clearPasswordResetContext: assign({
        passwordReset: undefined,
      }),
      /**
       * Store registration action token in registration context only
       */
      setRegistrationActionToken: assign({
        registration: ({ context, event }: any) => {
          // Get token from done event
          let token: string | undefined;
          if (
            (event.type as string).includes("done.actor") &&
            "output" in event
          ) {
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
      setPasswordResetActionToken: assign({
        passwordReset: ({ context, event }: any) => {
          // Get token from done event
          let token: string | undefined;
          if (
            (event.type as string).includes("done.actor") &&
            "output" in event
          ) {
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
      setRegistrationPendingPassword: assign({
        registration: ({ context, event }: any) => {
          if (event.type === "RESET_PASSWORD" && "payload" in event) {
            const payload = event.payload;
            if (
              payload &&
              typeof payload === "object" &&
              "newPassword" in payload
            ) {
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
      setPasswordResetPendingPassword: assign({
        passwordReset: ({ context, event }: any) => {
          if (event.type === "RESET_PASSWORD" && "payload" in event) {
            const payload = event.payload;
            if (
              payload &&
              typeof payload === "object" &&
              "newPassword" in payload
            ) {
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
      /**
       * Set the refreshing flag to true to prevent concurrent refresh operations
       */
      setRefreshingFlag: assign({
        isRefreshing: true,
      }),
      /**
       * Clear the refreshing flag to allow new refresh operations
       */
      clearRefreshingFlag: assign({
        isRefreshing: false,
      }),
    },
  }).createMachine({
    id: "auth",
    context: {
      session: null,
      error: null,
      isRefreshing: false,
    } as AuthContext,
    initial: "checkingSession",
    states: {
      checkingSession: {
        meta: {
          testDescription: "Checking if session exists"
        },
        invoke: {
          src: "checkSession",
          onDone: [
            {
              guard: ({ event }) => !!event.output,
              target: "validatingSession",
              actions: assign({ session: ({ event }) => event.output }),
            },
            { target: "unauthorized" },
          ],
          onError: {
            target: "unauthorized",
          },
        },
      },
      validatingSession: {
        meta: {
          testDescription: "Validating existing session with server"
        },
        invoke: {
          src: "validateSessionWithServer",
          input: ({ context }) => ({ session: context.session! }),
          onDone: {
            target: "fetchingProfileAfterValidation",
          },
          onError: [
            {
              guard: ({ context }) => !context.isRefreshing,
              target: "refreshingToken", // If validation fails and no refresh in progress, try to refresh
            },
            {
              target: "unauthorized", // If validation fails and a refresh is already in progress, go to unauthorized
              actions: assign({
                error: () => ({ message: "Session validation failed - refresh in progress" }),
              }),
            },
          ],
        },
      },
      fetchingProfileAfterValidation: {
        meta: {
          testDescription: "Fetching updated profile after session validation"
        },
        invoke: {
          src: "validateSessionWithServer", // This will fetch the profile
          input: ({ context }) => ({ session: context.session! }),
          onDone: {
            target: "authorized",
            actions: [
              assign({
                session: ({ event }: any) => event.output as AuthSession,
              }),
            ],
          },
          onError: {
            target: "unauthorized", // If profile fetch fails, go to unauthorized as session may be invalid
            actions: [
              assign({
                session: () => null,
                error: () => ({ message: "Profile validation failed" }),
              }),
            ],
          },
        },
      },
      refreshingToken: {
        meta: {
          testDescription: "Refreshing the access token using refresh token"
        },
        entry: "setRefreshingFlag",
        invoke: {
          id: "refresh-token",
          src: "refreshToken",
          input: ({ context }) => ({
            refreshToken: context.session?.refreshToken || "",
          }),
          onDone: {
            target: "fetchingProfileAfterRefresh",
            actions: [
              assign({
                session: ({ event }: any) => event.output as AuthSession,
              }),
              "clearRefreshingFlag",
            ],
          },
          onError: {
            target: "unauthorized", // Go to unauthenticated state if refresh fails
            actions: [
              assign({
                session: () => null,
                error: () => ({ message: "Session refresh failed" }),
              }),
              "clearRefreshingFlag",
            ],
          },
        },
      },
      fetchingProfileAfterRefresh: {
        meta: {
          testDescription: "Fetching updated profile after token refresh"
        },
        invoke: {
          src: "validateSessionWithServer",
          input: ({ context }) => ({ session: context.session! }),
          onDone: {
            target: "authorized",
            actions: [
              assign({
                session: ({ event }: any) => event.output as AuthSession,
              }),
            ],
          },
          onError: {
            target: "unauthorized", // If profile fetch fails after refresh, go to unauthorized
            actions: [
              assign({
                session: () => null,
                error: () => ({ message: "Profile validation after refresh failed" }),
              }),
            ],
          },
        },
      },

      unauthorized: {
        meta: {
          testDescription: "Unauthenticated state - user needs to log in"
        },
        initial: "login",
        on: {
          COMPLETE_REGISTRATION: ".completeRegistrationProcess", // Handle complete registration from unauthorized state
        },
        states: {
          login: {
            meta: {
              testDescription: "Login sub-flow"
            },
            initial: "idle",
            on: {
              GO_TO_REGISTER: "#auth.unauthorized.register",
              GO_TO_FORGOT_PASSWORD: "#auth.unauthorized.forgotPassword",
            },
            states: {
              idle: {
                meta: {
                  testDescription: "Login form idle state - waiting for user input"
                },
                on: {
                  LOGIN: {
                    target: "submitting",
                    actions: "clearError",
                  },
                },
              },
              submitting: {
                meta: {
                  testDescription: "Submitting login credentials to server"
                },
                on: {
                  CANCEL: "idle",
                },
                invoke: {
                  src: "loginUser",
                  input: ({ event }) => {
                    assertEvent(event, "LOGIN");
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
            meta: {
              testDescription: "Complete registration process after OTP verification"
            },
            invoke: {
              src: "completeRegistration",
              input: ({ event }) => {
                // Extract payload from COMPLETE_REGISTRATION event
                if (event.type === "COMPLETE_REGISTRATION") {
                  return (
                    event as {
                      type: "COMPLETE_REGISTRATION";
                      payload: CompleteRegistrationDTO;
                    }
                  ).payload;
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
            meta: {
              testDescription: "Logging in after completing registration"
            },
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
                actions: ["setSession", "clearRegistrationContext"],
              },
              onError: {
                target: "login",
                actions: ["setError", "clearRegistrationContext"],
              },
            },
          },

          register: {
            meta: {
              testDescription: "Registration sub-flow"
            },
            initial: "form",
            on: {
              GO_TO_LOGIN: {
                target: "#auth.unauthorized.login",
                actions: ["clearRegistrationContext", "clearError"],
              },
            },
            states: {
              form: {
                meta: {
                  testDescription: "Registration form state - collecting user information"
                },
                on: {
                  REGISTER: {
                    target: "submitting",
                    actions: ["clearError", "setRegistrationEmail"],
                  },
                },
              },
              submitting: {
                meta: {
                  testDescription: "Submitting registration to server"
                },
                on: {
                  CANCEL: {
                    target: "form",
                    actions: "clearRegistrationContext",
                  },
                },
                invoke: {
                  src: "registerUser",
                  input: ({ event }) => {
                    assertEvent(event, "REGISTER");
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
                meta: {
                  testDescription: "Waiting for user to enter OTP for verification"
                },
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
                meta: {
                  testDescription: "Verifying the OTP with server"
                },
                invoke: {
                  src: "verifyOtp",
                  input: ({ context, event }) => {
                    assertEvent(event, "VERIFY_OTP");
                    return {
                      email: context.registration?.email ?? "",
                      otp: event.payload.otp,
                    };
                  },
                  onDone: {
                    target: "resetPassword",
                    actions: "setRegistrationActionToken",
                  },
                  onError: {
                    target: "verifyOtp",
                    actions: "setError",
                  },
                },
              },
              resetPassword: {
                meta: {
                  testDescription: "Waiting for user to enter new password after OTP verification"
                },
                on: {
                  RESET_PASSWORD: {
                    guard: ({ context }) =>
                      !!context.registration?.actionToken,
                    target: "completingRegistration",
                    actions: "setRegistrationPendingPassword",
                  },
                },
              },
              completingRegistration: {
                meta: {
                  testDescription: "Completing registration with new password"
                },
                invoke: {
                  src: "completeRegistration",
                  input: ({ context }) => ({
                    actionToken: context.registration?.actionToken ?? "",
                    newPassword: resolveRegistrationPassword(
                      context.registration?.pendingCredentials
                    ),
                  }),
                  onDone: "loggingIn",
                  onError: {
                    target: "verifyOtp",
                    actions: "setError",
                  },
                },
              },
              loggingIn: {
                meta: {
                  testDescription: "Logging in after completing registration"
                },
                invoke: {
                  src: "loginUser",
                  input: ({ context }) => {
                    // SAFETY: Only use valid credentials, otherwise let API reject
                    // This prevents sending empty credentials that would be rejected
                    if (
                      hasValidCredentials(
                        context.registration?.pendingCredentials
                      )
                    ) {
                      return context.registration!.pendingCredentials;
                    }
                    // Missing or invalid credentials - return empty to be rejected by server
                    // with a proper error message rather than sending invalid data
                    return { email: "", password: "" };
                  },
                  onDone: {
                    target: "#auth.authorized",
                    actions: ["setSession", "clearRegistrationContext"],
                  },
                  onError: {
                    target: "#auth.unauthorized.login",
                    actions: ["setError", "clearRegistrationContext"],
                  },
                },
              },
            },
          },

          forgotPassword: {
            meta: {
              testDescription: "Forgot password sub-flow"
            },
            initial: "idle",
            on: {
              GO_TO_LOGIN: {
                target: "#auth.unauthorized.login",
                actions: ["clearPasswordResetContext", "clearError"],
              },
            },
            states: {
              idle: {
                meta: {
                  testDescription: "Forgot password form idle state - waiting for email input"
                },
                on: {
                  FORGOT_PASSWORD: {
                    target: "submitting",
                    actions: ["setPasswordResetEmail", "clearError"],
                  },
                },
              },
              submitting: {
                meta: {
                  testDescription: "Submitting email for password reset request"
                },
                on: {
                  CANCEL: "idle",
                },
                invoke: {
                  src: "requestPasswordReset",
                  input: ({ event }) => {
                    assertEvent(event, "FORGOT_PASSWORD");
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
                meta: {
                  testDescription: "Waiting for user to enter OTP for password reset"
                },
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
                meta: {
                  testDescription: "Verifying the password reset OTP with server"
                },
                invoke: {
                  src: "verifyOtp",
                  input: ({ context, event }) => {
                    assertEvent(event, "VERIFY_OTP");
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
                meta: {
                  testDescription: "Waiting for user to enter new password"
                },
                on: {
                  RESET_PASSWORD: {
                    guard: ({ context }) =>
                      !!context.passwordReset?.actionToken,
                    target: "resettingPassword",
                    actions: "setPasswordResetPendingPassword",
                  },
                },
              },
              resettingPassword: {
                meta: {
                  testDescription: "Submitting new password to complete reset"
                },
                invoke: {
                  src: "completePasswordReset",
                  input: ({ context }) => ({
                    actionToken: context.passwordReset?.actionToken ?? "",
                    newPassword:
                      context.passwordReset?.pendingCredentials?.password ?? "",
                  }),
                  onDone: "loggingInAfterReset",
                  onError: {
                    target: "resetPassword",
                    actions: "setError",
                  },
                },
              },
              loggingInAfterReset: {
                meta: {
                  testDescription: "Logging in after completing password reset"
                },
                invoke: {
                  src: "loginUser",
                  input: ({ context }) => {
                    // SAFETY: Only use valid credentials, otherwise let API reject
                    // This prevents sending empty credentials that would be rejected
                    if (
                      hasValidCredentials(
                        context.passwordReset?.pendingCredentials
                      )
                    ) {
                      return context.passwordReset!.pendingCredentials;
                    }
                    // Missing or invalid credentials - return empty to be rejected by server
                    // with a proper error message rather than sending invalid data
                    return { email: "", password: "" };
                  },
                  onDone: {
                    target: "#auth.authorized",
                    actions: ["setSession", "clearPasswordResetContext"],
                  },
                  onError: {
                    target: "#auth.unauthorized.login",
                    actions: ["setError", "clearPasswordResetContext"],
                  },
                },
              },
            },
          },
        },
      },
      authorized: {
        meta: {
          testDescription: "Authenticated state - user has valid session"
        },
        on: {
          LOGOUT: {
            target: "loggingOut",
          },
          REFRESH: {
            guard: ({ context }) => !context.isRefreshing,
            target: "refreshingToken",
          },
        },
        invoke: {
          // Periodically check if the token needs a refresh
          src: "validateAndRefreshSessionIfNeeded",
          input: ({ context }) => ({ session: context.session ?? undefined }),
        },
      },

      loggingOut: {
        meta: {
          testDescription: "Logging out user and clearing session"
        },
        invoke: {
          src: "logoutUser",
          onDone: {
            target: "unauthorized",
            actions: ["clearSession", "clearError"],
          },
          onError: {
            target: "unauthorized",
            actions: ["clearSession", "clearError"],
          },
        },
      },
    },
  });
};
