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

export type AuthContext = {
  session: AuthSession | null;
  error: AuthError | null;
  email?: string;
  registrationActionToken?: string;
  resetActionToken?: string;
  pendingCredentials?: LoginRequestDTO;
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

// Extended event type that includes both user events and system events
export type EventWithSystem =
  | AuthEvent
  | { type: `xstate.done.actor.${string}`; output: any }
  | { type: `xstate.error.actor.${string}`; error: any };

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
      setEmailFromPayload: assign({
        email: ({ event }) => {
          // Use assertEvent to ensure event has expected type and payload
          assertEvent(event, ["REGISTER", "FORGOT_PASSWORD"]);
          return event.payload.email;
        },
      }),
      clearForgotPasswordContext: assign({
        email: undefined,
        resetActionToken: undefined,
        pendingCredentials: undefined,
      }),
      clearRegistrationContext: assign({
        email: undefined,
        registrationActionToken: undefined,
        pendingCredentials: undefined,
      }),
      setPendingCredentials: assign({
        pendingCredentials: ({ event }) => {
          // Use assertEvent to ensure event is a REGISTER event with payload
          assertEvent(event, "REGISTER");
          return {
            email: event.payload.email,
            password: event.payload.password,
          };
        },
      }),
      clearPendingCredentials: assign({
        pendingCredentials: undefined,
      }),
      setRegistrationActionToken: assign({
        registrationActionToken: ({ event }) => {
          // Use type guard to validate this is a done event from verifyOtp actor
          if (
            (event.type as string).includes("done.actor") &&
            "output" in event
          ) {
            const output = (event as any).output;
            return typeof output === "string" ? output : undefined;
          }
          return undefined;
        },
      }),
      setResetActionToken: assign({
        resetActionToken: ({ event }) => {
          // Use type guard to validate this is a done event from verifyOtp actor (in forgot password flow too)
          if (
            (event.type as string).includes("done.actor") &&
            "output" in event
          ) {
            const output = (event as any).output;
            return typeof output === "string" ? output : undefined;
          }
          return undefined;
        },
      }),
      setPendingCredentialsFromNewPassword: assign({
        pendingCredentials: ({ context, event }) => {
          // Extract newPassword from RESET_PASSWORD event
          if (event.type === "RESET_PASSWORD" && "payload" in event) {
            const payload = (event as any).payload;
            if (
              payload &&
              typeof payload === "object" &&
              "newPassword" in payload
            ) {
              return {
                email: context.email ?? "",
                password: (payload as any).newPassword,
              };
            }
          }
          return undefined;
        },
      }),
    },
  }).createMachine({
    id: "auth",
    context: {
      session: null,
      error: null,
    } as AuthContext,
    initial: "checkingSession",
    states: {
      checkingSession: {
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
        on: {
          COMPLETE_REGISTRATION:
            "#auth.unauthorized.completeRegistrationProcess",
        },
        invoke: {
          src: "validateSessionWithServer",
          input: ({ context }) => ({ session: context.session! }),
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
            target: "authorized", // If profile fetch fails, still go to authorized with existing session
            actions: [
              assign({
                session: ({ context }: { context: AuthContext }) => {
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
          COMPLETE_REGISTRATION:
            "#auth.unauthorized.completeRegistrationProcess",
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
              assign({
                session: ({ event }: any) => event.output as AuthSession,
              }),
            ],
          },
          onError: {
            target: "unauthorized", // Go to unauthenticated state if refresh fails
            actions: [
              assign({
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
            target: "authorized", // If profile fetch fails, still go to authorized with existing session
            actions: [
              assign({
                session: ({ context }: { context: AuthContext }) => {
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
                    assertEvent(event, "LOGIN");
                    return event.payload;
                  },
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
          completeRegistrationProcess: {
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
            invoke: {
              src: "loginUser",
              input: ({ context }) => {
                // Get credentials from context if available
                if (context.pendingCredentials) {
                  return context.pendingCredentials;
                }
                // Missing or invalid credentials - return empty to be rejected by server
                return { email: "", password: "" };
              },
              onDone: {
                target: "#auth.authorized",
                actions: [
                  "setSession",
                  "clearRegistrationContext",
                  "clearPendingCredentials",
                ],
              },
              onError: {
                target: "login",
                actions: [
                  "setError",
                  "clearRegistrationContext",
                  "clearPendingCredentials",
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
                  input: ({ context, event }) => {
                    assertEvent(event, "VERIFY_OTP");
                    return {
                      email: context.email ?? "",
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
                    actionToken: context.registrationActionToken ?? "",
                    newPassword: resolveRegistrationPassword(
                      context.pendingCredentials
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
                invoke: {
                  src: "loginUser",
                  input: ({ context }) => {
                    // SAFETY: Only use valid credentials, otherwise let API reject
                    // This prevents sending empty credentials that would be rejected
                    if (hasValidCredentials(context.pendingCredentials)) {
                      return context.pendingCredentials;
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
                  input: ({ context, event }) => {
                    assertEvent(event, "VERIFY_OTP");
                    return {
                      email: context.email ?? "",
                      otp: event.payload.otp,
                    };
                  },
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
                  input: ({ context }) => {
                    // SAFETY: Only use valid credentials, otherwise let API reject
                    // This prevents sending empty credentials that would be rejected
                    if (hasValidCredentials(context.pendingCredentials)) {
                      return context.pendingCredentials;
                    }
                    // Missing or invalid credentials - return empty to be rejected by server
                    // with a proper error message rather than sending invalid data
                    return { email: "", password: "" };
                  },
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
          REFRESH: {
            target: "refreshingToken",
          },
          COMPLETE_REGISTRATION:
            "#auth.unauthorized.completeRegistrationProcess",
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
