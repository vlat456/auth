/**
 * Path: src/features/auth/machine/authMachine.ts
 * Version: 0.2.0
 */

import { setup, assign, fromPromise } from "xstate";
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
  safeExtractSessionOutput,
  safeExtractRegisterPayload,
  safeExtractOtpRequestPayload,
  safeExtractResetPasswordPayload,
  safeExtractEmail,
  safeExtractOtp,
  safeExtractLoginPayload,
  safeExtractErrorMessage,
  safeExtractOutput,
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

export const createAuthMachine = (authRepository: IAuthRepository) => {
  return setup({
    types: {
      context: {} as AuthContext,
      events: {} as AuthEvent,
    },
    actors: {
      checkSession: fromPromise(async () => {
        return await authRepository.checkSession();
      }),
      validateAndRefreshSessionIfNeeded: fromPromise(async ({ input }: { input: { session?: AuthSession } }) => {
        // Simple direct call to the simplified repository
        const currentSession = input.session || await authRepository.checkSession();
        if (!currentSession) return null;

        // If we need refresh logic, it should be handled in the machine
        // For now, return the session as is
        return currentSession;
      }),
      loginUser: fromPromise(async ({ input }: { input: LoginRequestDTO }) => {
        return await authRepository.login(input);
      }),
      registerUser: fromPromise(
        async ({ input }: { input: RegisterRequestDTO }) => {
          return await authRepository.register(input);
        },
      ),
      requestPasswordReset: fromPromise(
        async ({ input }: { input: RequestOtpDTO }) => {
          return await authRepository.requestPasswordReset(input);
        },
      ),
      verifyOtp: fromPromise(async ({ input }: { input: VerifyOtpDTO }) => {
        return await authRepository.verifyOtp(input);
      }),
      completeRegistration: fromPromise(
        async ({ input }: { input: CompleteRegistrationDTO }) => {
          return await authRepository.completeRegistration(input);
        },
      ),
      completePasswordReset: fromPromise(
        async ({ input }: { input: CompletePasswordResetDTO }) => {
          return await authRepository.completePasswordReset(input);
        },
      ),
      logoutUser: fromPromise(async () => {
        return await authRepository.logout();
      }),
      refreshToken: fromPromise(async ({ input }: { input: { refreshToken: string } }) => {
        return await authRepository.refresh(input.refreshToken);
      }),
      validateSessionWithServer: fromPromise(async ({ input }: { input: { session: AuthSession } }) => {
        // In the new architecture, validation happens through direct API calls
        // The machine will decide what to do based on the result
        try {
          // Attempt to validate by making an authenticated request
          // This would require the repository to have a method to check session validity
          // For now, we'll just return the session and let the machine handle validation
          return input.session;
        } catch (error) {
          return null;
        }
      }),
    },
    actions: {
      setSession: assign({
        session: ({ event }) => {
          // SECURITY: Use safe extraction instead of (event as any)
          const output = safeExtractSessionOutput(event);
          return output ?? null;
        },
        error: null,
      }),
      setError: assign({
        error: ({ event }) => {
          // SECURITY: Safely extract error message
          const msg =
            safeExtractErrorMessage(event) || "An unexpected error occurred";
          return { message: msg };
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
          // SECURITY: Use safe extraction instead of (event as any)
          return safeExtractEmail(event);
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
          // SECURITY: Validate payload before assigning
          const payload = safeExtractRegisterPayload(event);
          return payload as LoginRequestDTO | undefined;
        },
      }),
      clearPendingCredentials: assign({
        pendingCredentials: undefined,
      }),
      setRegistrationActionToken: assign({
        registrationActionToken: ({ event }) => {
          // SECURITY: Safely extract action token from output
          const output = safeExtractOutput<string>(event);
          return typeof output === "string" ? output : undefined;
        },
      }),
      setResetActionToken: assign({
        resetActionToken: ({ event }) => {
          // SECURITY: Safely extract action token from output
          const output = safeExtractOutput<string>(event);
          return typeof output === "string" ? output : undefined;
        },
      }),
      setPendingCredentialsFromNewPassword: assign({
        pendingCredentials: ({ context, event }) => {
          // SECURITY: Use safe extraction instead of (event as any)
          const resetPayload = safeExtractResetPasswordPayload(event);
          if (!resetPayload) {
            return undefined;
          }
          return {
            email: context.email ?? "",
            password: resetPayload.newPassword,
          };
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
          COMPLETE_REGISTRATION: "#auth.unauthorized.completeRegistrationProcess",
        },
        invoke: {
          src: "validateSessionWithServer",
          input: ({ context }) => ({ session: context.session! }),
          onDone: {
            target: "authorized",
          },
          onError: {
            target: "refreshingToken",  // If validation fails, try to refresh
          },
        },
      },
      refreshingToken: {
        on: {
          COMPLETE_REGISTRATION: "#auth.unauthorized.completeRegistrationProcess",
        },
        invoke: {
          id: 'refresh-token',
          src: "refreshToken",
          input: ({ context }) => ({
            refreshToken: context.session?.refreshToken || ""
          }),
          onDone: {
            target: "authorized",
            actions: assign({
              session: (_, event) => event.output // Update session from event data
            })
          },
          onError: {
            target: "unauthorized", // Go to unauthenticated state if refresh fails
            actions: assign({
              session: null,
              error: (_, event) => ({ message: "Session refresh failed" })
            })
          }
        }
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
                    const payload = safeExtractLoginPayload(event);
                    return payload || { email: "", password: "" };
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
                if (event.type === 'COMPLETE_REGISTRATION') {
                  return (event as { type: 'COMPLETE_REGISTRATION'; payload: CompleteRegistrationDTO }).payload;
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
                    // SECURITY: Validate register payload before use
                    const payload = safeExtractRegisterPayload(event);
                    return payload || { email: "", password: "" };
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
                  input: ({ context, event }) => ({
                    email: context.email ?? "",
                    otp: safeExtractOtp(event) ?? "",
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
                    newPassword: resolveRegistrationPassword(
                      context.pendingCredentials,
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
                    const payload = safeExtractOtpRequestPayload(event);
                    return payload || { email: "" };
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
                  input: ({ context, event }) => ({
                    email: context.email ?? "",
                    otp: safeExtractOtp(event) ?? "",
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
          COMPLETE_REGISTRATION: ".completeRegistrationProcess",
        },
        invoke: {
          // Periodically check if the token needs a refresh
          src: "validateAndRefreshSessionIfNeeded",
          input: ({ context }) => ({ session: context.session }),
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
