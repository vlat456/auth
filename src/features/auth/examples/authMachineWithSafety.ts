/**
 * Example implementation showing how to use safety utilities in auth machine
 * This demonstrates best practices for validating data structures before accessing nested properties
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
  hasRequiredProperties, 
  isAuthSession, 
  isValidLoginRequest, 
  safeExtractEmail,
  safeExtractOtp,
  safeExtractNewPassword,
  safeExtractOutput,
  safeGetNestedValue,
  safeArrayAccess
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
  | { type: "LOGOUT" }
  | { type: "CANCEL" }
  | { type: "GO_TO_REGISTER" }
  | { type: "GO_TO_LOGIN" }
  | { type: "GO_TO_FORGOT_PASSWORD" };

export const createAuthMachineWithSafetyUtils = (authRepository: IAuthRepository) => {
  return setup({
    types: {
      context: {} as AuthContext,
      events: {} as AuthEvent,
    },
    actors: {
      checkSessionParams: fromPromise(async () => {
        return await authRepository.checkSession();
      }),
      loginUser: fromPromise(async ({ input }: { input: LoginRequestDTO }) => {
        // Validate input before using it using our safety utilities
        if (!hasRequiredProperties<Record<string, unknown>>(input, ['email', 'password'])) {
          throw new Error("Invalid login request: required fields missing");
        }
        return await authRepository.login(input);
      }),
      registerUser: fromPromise(
        async ({ input }: { input: RegisterRequestDTO }) => {
          // Validate input structure before using it
          if (!hasRequiredProperties<Record<string, unknown>>(input, ['email', 'password'])) {
            throw new Error("Invalid registration request: required fields missing");
          }
          return await authRepository.register(input);
        },
      ),
      // Other actors with safety validations...
    },
    actions: {
      setSession: assign({
        session: ({ event }: any) => {
          // Validate the output before assigning it as a session
          const output = safeExtractOutput<AuthSession>(event);
          if (output && isAuthSession(output)) {
            return output;
          }
          return null;
        },
        error: null,
      }),
      setError: assign({
        error: ({ event }: any) => {
          // Safely extract error message using safe navigation
          const errorMessage = safeGetNestedValue<string>(event, 'error.message') || 
                              safeGetNestedValue<string>(event, 'error') || 
                              "An unexpected error occurred";
          return { message: errorMessage };
        },
      }),
      setEmailFromPayload: assign({
        email: ({ event }: any) => {
          // Safe extraction using our utility
          const email = safeExtractEmail(event);
          return email || undefined;
        },
      }),
      // Example of safely extracting OTP with validation
      verifyUserOtp: assign({
        email: ({ context, event }: any) => {
          // Ensure context has required values
          const email = context.email;
          if (typeof email !== 'string' || email.trim().length === 0) {
            throw new Error("Email is required for OTP verification");
          }
          
          // Extract OTP safely 
          const otp = safeExtractOtp(event);
          if (!otp || otp.trim().length === 0) {
            throw new Error("OTP is required");
          }
          
          // Return the values for the actor input
          return email;
        },
      }),
      // Example of handling complex nested data safely
      processApiResponse: assign({
        session: ({ event }: any) => {
          // Validate the API response structure before accessing nested properties
          const response = event.output;
          if (!response || typeof response !== 'object') {
            return null;
          }
          
          // Example of safely accessing nested data structure
          const data = safeGetNestedValue(response, 'data');
          const accessToken = safeGetNestedValue<string>(data, 'accessToken');
          const refreshToken = safeGetNestedValue<string>(data, 'refreshToken');
          
          if (typeof accessToken !== 'string' || accessToken.length === 0) {
            return null;
          }
          
          return {
            accessToken,
            refreshToken,
          };
        }
      }),
      // Example of safe array access
      processUserList: assign({
        session: ({ event }: any) => {
          // Example of safely accessing arrays
          const users = safeGetNestedValue(event.output, 'users') as unknown[];
          const firstUser = safeArrayAccess(users, 0);
          
          if (!firstUser) {
            return null;
          }
          
          // Validate first user structure before using
          if (!hasRequiredProperties<Record<string, unknown>>(firstUser, ['id', 'email'])) {
            return null;
          }
          
          return {
            accessToken: safeGetNestedValue<string>(firstUser, 'token', ''),
            refreshToken: safeGetNestedValue<string>(firstUser, 'refreshToken', ''),
          };
        }
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
          src: "checkSessionParams",
          onDone: [
            {
              // Validate session before transitioning
              guard: ({ event }: any) => {
                const session = event.output;
                return !!session && isAuthSession(session);
              },
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
      // ... rest of the state machine
    },
  });
};

// Example of how to use type guards in regular functions
export function validateAndProcessLoginData(loginData: unknown): LoginRequestDTO | null {
  // Use our type guard to validate the structure
  if (!isValidLoginRequest(loginData)) {
    console.error("Invalid login data provided");
    return null;
  }
  
  // At this point, TypeScript knows loginData is LoginRequestDTO
  return loginData;
}

// Example of how to validate API responses
export function validateApiResponse<T>(response: unknown, requiredFields: string[]): T | null {
  if (!hasRequiredProperties<Record<string, unknown>>(response, requiredFields as (keyof Record<string, unknown>)[])) {
    console.error("API response missing required fields:", requiredFields);
    return null;
  }
  
  return response as T;
}

// Example of safely accessing nested configuration objects
export function getApiConfigValue(config: unknown, path: string, defaultValue?: string): string {
  if (typeof config !== 'object' || config === null) {
    return defaultValue || "";
  }
  
  const value = safeGetNestedValue<string>(config, path);
  return typeof value === 'string' ? value : defaultValue || "";
}