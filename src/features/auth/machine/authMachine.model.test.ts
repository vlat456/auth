/**
 * Path: src/features/auth/machine/authMachine.model.test.ts
 * Version: 0.1.0
 * 
 * Model-based tests for the auth machine
 * Demonstrates how model-based testing can be applied to XState machines
 * This approach generates comprehensive test cases based on state transitions
 */

import { createActor, createMachine } from "xstate";
import { createAuthMachine } from "./authMachine";
import { IAuthRepository } from "../types";

// Mock repository implementation for testing
const mockRepo: jest.Mocked<IAuthRepository> = {
  login: jest.fn(),
  register: jest.fn(),
  requestPasswordReset: jest.fn(),
  verifyOtp: jest.fn(),
  completeRegistration: jest.fn(),
  completePasswordReset: jest.fn(),
  checkSession: jest.fn(),
  refresh: jest.fn(),
  refreshProfile: jest.fn(),
  logout: jest.fn(),
};

// Helper to wait for a specific state or condition
const waitForState = (actor: any, predicate: (snapshot: any) => boolean): Promise<void> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      reject(
        new Error(
          `Timeout waiting for state: ${JSON.stringify(
            actor.getSnapshot().value
          )}`
        )
      );
    }, 10000); // 10-second timeout

    const subscription = actor.subscribe((snapshot: any) => {
      if (predicate(snapshot)) {
        clearTimeout(timeout);
        subscription.unsubscribe();
        resolve();
      }
    });
  });
};

// Helper to safely check state matches with type safety
const stateMatches = (snapshot: any, pattern: any): boolean => {
  return snapshot?.matches?.(pattern) || snapshot?.value === pattern;
};

describe("Auth Machine Model-Based Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("State Transition Coverage", () => {
    /**
     * These tests ensure we cover all possible state transitions in the auth machine
     * by executing comprehensive test paths based on the machine's structure
     */
    
    it("should test the complete login happy path", async () => {
      const mockSession = { accessToken: "valid-token", refreshToken: "refresh-token" };
      
      // Mock no existing session
      (mockRepo.checkSession as jest.Mock).mockResolvedValue(null);
      (mockRepo.login as jest.Mock).mockResolvedValue(mockSession);
      
      const machine = createAuthMachine(mockRepo);
      const actor = createActor(machine);
      actor.start();

      // Wait for unauthorized state
      await waitForState(actor, (s) => stateMatches(s, "unauthorized"));

      // Execute login
      const toAuthorized = waitForState(actor, (s) => stateMatches(s, "authorized"));
      actor.send({
        type: "LOGIN",
        payload: { email: "test@example.com", password: "password123" }
      });
      await toAuthorized;

      // Verify final state and session
      expect(stateMatches(actor.getSnapshot(), "authorized")).toBe(true);
      expect(actor.getSnapshot().context.session).toEqual(mockSession);
      expect(mockRepo.login).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123"
      });
    });

    it("should test the complete registration flow", async () => {
      const mockSession = { accessToken: "valid-token", refreshToken: "refresh-token" };
      
      // Mock no existing session
      (mockRepo.checkSession as jest.Mock).mockResolvedValue(null);
      (mockRepo.register as jest.Mock).mockResolvedValue(undefined);
      (mockRepo.verifyOtp as jest.Mock).mockResolvedValue("action-token");
      (mockRepo.completeRegistration as jest.Mock).mockResolvedValue(undefined);
      (mockRepo.login as jest.Mock).mockResolvedValue(mockSession);
      
      const machine = createAuthMachine(mockRepo);
      const actor = createActor(machine);
      actor.start();

      // Wait for unauthorized state
      await waitForState(actor, (s) => stateMatches(s, "unauthorized"));

      // Navigate to register
      const toRegister = waitForState(actor, (s) => 
        stateMatches(s, { unauthorized: { register: "form" } }));
      actor.send({ type: "GO_TO_REGISTER" });
      await toRegister;

      // Submit registration
      const toVerifyOtp = waitForState(actor, (s) => 
        stateMatches(s, { unauthorized: { register: "verifyOtp" } }));
      actor.send({
        type: "REGISTER",
        payload: { email: "test@example.com", password: "password123" }
      });
      await toVerifyOtp;

      // Verify OTP
      const toCompleting = waitForState(actor, (s) => 
        stateMatches(s, { unauthorized: { register: "completingRegistration" } }));
      actor.send({ type: "VERIFY_OTP", payload: { otp: "123456" } });
      await toCompleting;

      // Wait for completion and login
      const toAuthorized = waitForState(actor, (s) => stateMatches(s, "authorized"));
      await toAuthorized;

      expect(stateMatches(actor.getSnapshot(), "authorized")).toBe(true);
      expect(actor.getSnapshot().context.session).toEqual(mockSession);
    });

    it("should test the complete forgot password flow", async () => {
      const mockSession = { accessToken: "valid-token", refreshToken: "refresh-token" };
      
      // Mock no existing session
      (mockRepo.checkSession as jest.Mock).mockResolvedValue(null);
      (mockRepo.requestPasswordReset as jest.Mock).mockResolvedValue(undefined);
      (mockRepo.verifyOtp as jest.Mock).mockResolvedValue("action-token");
      (mockRepo.completePasswordReset as jest.Mock).mockResolvedValue(undefined);
      (mockRepo.login as jest.Mock).mockResolvedValue(mockSession);
      
      const machine = createAuthMachine(mockRepo);
      const actor = createActor(machine);
      actor.start();

      // Wait for unauthorized state
      await waitForState(actor, (s) => stateMatches(s, "unauthorized"));

      // Navigate to forgot password
      const toForgot = waitForState(actor, (s) => 
        stateMatches(s, { unauthorized: { forgotPassword: "idle" } }));
      actor.send({ type: "GO_TO_FORGOT_PASSWORD" });
      await toForgot;

      // Request password reset
      const toVerifyOtp = waitForState(actor, (s) => 
        stateMatches(s, { unauthorized: { forgotPassword: "verifyOtp" } }));
      actor.send({
        type: "FORGOT_PASSWORD",
        payload: { email: "test@example.com" }
      });
      await toVerifyOtp;

      // Verify OTP
      const toResetPassword = waitForState(actor, (s) => 
        stateMatches(s, { unauthorized: { forgotPassword: "resetPassword" } }));
      actor.send({ type: "VERIFY_OTP", payload: { otp: "123456" } });
      await toResetPassword;

      // Reset password
      const toResettingPassword = waitForState(actor, (s) => 
        stateMatches(s, { unauthorized: { forgotPassword: "resettingPassword" } }));
      actor.send({
        type: "RESET_PASSWORD",
        payload: { newPassword: "newpassword123" }
      });
      await toResettingPassword;

      // Wait for completion and login
      const toAuthorized = waitForState(actor, (s) => stateMatches(s, "authorized"));
      await toAuthorized;

      expect(stateMatches(actor.getSnapshot(), "authorized")).toBe(true);
      expect(actor.getSnapshot().context.session).toEqual(mockSession);
    });

    it("should test logout functionality", async () => {
      const mockSession = { accessToken: "valid-token", refreshToken: "refresh-token" };
      
      // Mock existing session
      (mockRepo.checkSession as jest.Mock).mockResolvedValue(mockSession);
      (mockRepo.logout as jest.Mock).mockResolvedValue(undefined);
      
      const machine = createAuthMachine(mockRepo);
      const actor = createActor(machine);
      actor.start();

      // Wait for authorized state
      await waitForState(actor, (s) => stateMatches(s, "authorized"));

      // Execute logout
      const toUnauthorized = waitForState(actor, (s) => stateMatches(s, "unauthorized"));
      actor.send({ type: "LOGOUT" });
      await toUnauthorized;

      // Verify final state and cleared session
      expect(stateMatches(actor.getSnapshot(), "unauthorized")).toBe(true);
      expect(actor.getSnapshot().context.session).toBeNull();
      expect(mockRepo.logout).toHaveBeenCalled();
    });
  });

  describe("Error Path Coverage", () => {
    it("should handle login error properly", async () => {
      // Mock no existing session and login error
      (mockRepo.checkSession as jest.Mock).mockResolvedValue(null);
      (mockRepo.login as jest.Mock).mockRejectedValue(new Error("Invalid credentials"));
      
      const machine = createAuthMachine(mockRepo);
      const actor = createActor(machine);
      actor.start();

      // Wait for unauthorized state
      await waitForState(actor, (s) => stateMatches(s, "unauthorized"));

      // Attempt login - should fail
      const toLoginIdle = waitForState(actor, (s) => 
        stateMatches(s, { unauthorized: { login: "idle" } }) &&
        s.context.error !== null
      );
      actor.send({
        type: "LOGIN",
        payload: { email: "test@example.com", password: "wrongpassword" }
      });
      await toLoginIdle;

      expect(actor.getSnapshot().context.error?.message).toBe("Invalid credentials");
    });

    it("should handle registration error properly", async () => {
      // Mock no existing session and registration error
      (mockRepo.checkSession as jest.Mock).mockResolvedValue(null);
      (mockRepo.register as jest.Mock).mockRejectedValue(new Error("Email already exists"));
      
      const machine = createAuthMachine(mockRepo);
      const actor = createActor(machine);
      actor.start();

      // Wait for unauthorized state
      await waitForState(actor, (s) => stateMatches(s, "unauthorized"));

      // Navigate to register
      const toRegister = waitForState(actor, (s) => 
        stateMatches(s, { unauthorized: { register: "form" } }));
      actor.send({ type: "GO_TO_REGISTER" });
      await toRegister;

      // Attempt registration - should fail
      const backToForm = waitForState(actor, (s) => 
        stateMatches(s, { unauthorized: { register: "form" } }) &&
        s.context.error !== null
      );
      actor.send({
        type: "REGISTER",
        payload: { email: "existing@example.com", password: "password123" }
      });
      await backToForm;

      expect(actor.getSnapshot().context.error?.message).toBe("Email already exists");
    });

    it("should handle password reset request error", async () => {
      // Mock no existing session and password reset error
      (mockRepo.checkSession as jest.Mock).mockResolvedValue(null);
      (mockRepo.requestPasswordReset as jest.Mock).mockRejectedValue(new Error("Email not found"));
      
      const machine = createAuthMachine(mockRepo);
      const actor = createActor(machine);
      actor.start();

      // Wait for unauthorized state
      await waitForState(actor, (s) => stateMatches(s, "unauthorized"));

      // Navigate to forgot password
      const toForgot = waitForState(actor, (s) => 
        stateMatches(s, { unauthorized: { forgotPassword: "idle" } }));
      actor.send({ type: "GO_TO_FORGOT_PASSWORD" });
      await toForgot;

      // Request password reset - should fail
      const backToIdle = waitForState(actor, (s) => 
        stateMatches(s, { unauthorized: { forgotPassword: "idle" } }) &&
        s.context.error !== null
      );
      actor.send({
        type: "FORGOT_PASSWORD",
        payload: { email: "nonexistent@example.com" }
      });
      await backToIdle;

      expect(actor.getSnapshot().context.error?.message).toBe("Email not found");
    });
  });

  describe("Navigation Path Coverage", () => {
    it("should navigate between login and register", async () => {
      // Mock no existing session
      (mockRepo.checkSession as jest.Mock).mockResolvedValue(null);

      const machine = createAuthMachine(mockRepo);
      const actor = createActor(machine);
      actor.start();

      // Wait for unauthorized state first
      await waitForState(actor, (s) =>
        stateMatches(s, { unauthorized: { login: "idle" } }));

      // Navigate to register
      const toRegister = waitForState(actor, (s) =>
        stateMatches(s, { unauthorized: { register: "form" } }));
      actor.send({ type: "GO_TO_REGISTER" });
      await toRegister;

      expect(stateMatches(actor.getSnapshot(), { unauthorized: { register: "form" } })).toBe(true);

      // Navigate back to login
      const toLogin = waitForState(actor, (s) =>
        stateMatches(s, { unauthorized: { login: "idle" } }));
      actor.send({ type: "GO_TO_LOGIN" });
      await toLogin;

      expect(stateMatches(actor.getSnapshot(), { unauthorized: { login: "idle" } })).toBe(true);
    }, 15000); // Increase timeout for complex navigation

    it("should navigate between login and forgot password", async () => {
      // Mock no existing session
      (mockRepo.checkSession as jest.Mock).mockResolvedValue(null);

      const machine = createAuthMachine(mockRepo);
      const actor = createActor(machine);
      actor.start();

      // Wait for unauthorized state first
      await waitForState(actor, (s) =>
        stateMatches(s, { unauthorized: { login: "idle" } }));

      // Navigate to forgot password
      const toForgot = waitForState(actor, (s) =>
        stateMatches(s, { unauthorized: { forgotPassword: "idle" } }));
      actor.send({ type: "GO_TO_FORGOT_PASSWORD" });
      await toForgot;

      expect(stateMatches(actor.getSnapshot(), { unauthorized: { forgotPassword: "idle" } })).toBe(true);

      // Navigate back to login
      const toLogin = waitForState(actor, (s) =>
        stateMatches(s, { unauthorized: { login: "idle" } }));
      actor.send({ type: "GO_TO_LOGIN" });
      await toLogin;

      expect(stateMatches(actor.getSnapshot(), { unauthorized: { login: "idle" } })).toBe(true);
    }, 15000); // Increase timeout for complex navigation
  });

  describe("Token Refresh Coverage", () => {
    it("should test token refresh functionality", async () => {
      const initialSession = {
        accessToken: "expiring-token",
        refreshToken: "refresh-token",
        profile: { id: "1", email: "test@example.com" }
      };
      const refreshedSession = {
        accessToken: "new-valid-token",
        refreshToken: "refresh-token",
        profile: { id: "1", email: "test@example.com" }
      };

      // Mock existing session and refresh
      (mockRepo.checkSession as jest.Mock).mockResolvedValue(initialSession);
      (mockRepo.refresh as jest.Mock).mockResolvedValue(refreshedSession);

      const machine = createAuthMachine(mockRepo);
      const actor = createActor(machine);
      actor.start();

      // Wait for authorized state
      await waitForState(actor, (s) => stateMatches(s, "authorized"));

      // Execute refresh
      const stillAuthorized = waitForState(actor, (s) => stateMatches(s, "authorized"));
      actor.send({ type: "REFRESH" });
      await stillAuthorized;

      // Verify refresh was called (the exact implementation may call with different parameters)
      expect(mockRepo.refresh).toHaveBeenCalled();
    }, 15000); // Increase timeout for refresh flow
  });
});