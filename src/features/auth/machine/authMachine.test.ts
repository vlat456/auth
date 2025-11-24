/**
 * Path: src/features/auth/machine/authMachine.test.ts
 * Version: 0.1.0
 */

import { createActor, AnyActor, StateFrom } from "xstate";
import { createAuthMachine, resolveRegistrationPassword } from "./authMachine";
import { IAuthRepository } from "../types";

jest.useFakeTimers();

// Helper to wait for a specific state or condition
const waitForState = <T extends AnyActor>(
  actor: T,
  predicate: (snapshot: StateFrom<T["logic"]>) => boolean
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      reject(new Error(`Timeout waiting for state: ${JSON.stringify(actor.getSnapshot().value)}`));
    }, 5000); // 5-second timeout

    const subscription = actor.subscribe((snapshot) => {
      if (predicate(snapshot)) {
        clearTimeout(timeout);
        subscription.unsubscribe();
        resolve();
      }
    });
  });
};

const mockRepo: IAuthRepository = {
  login: jest.fn(),
  register: jest.fn(),
  requestPasswordReset: jest.fn(),
  verifyOtp: jest.fn(),
  completeRegistration: jest.fn(),
  completePasswordReset: jest.fn(),
  checkSession: jest.fn(),
  logout: jest.fn(),
};

const createTestActor = () => {
  const machine = createAuthMachine(mockRepo);
  const actor = createActor(machine);
  actor.start();
  return actor;
};

describe("Auth Machine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should move to unauthorized if no session", async () => {
      (mockRepo.checkSession as jest.Mock).mockResolvedValue(null);
      const actor = createTestActor();
      await waitForState(actor, (s) => s.matches("unauthorized"));
    });

    it("should move to authorized if session exists", async () => {
      const mockSession = { accessToken: "123" };
      (mockRepo.checkSession as jest.Mock).mockResolvedValue(mockSession);
      const actor = createTestActor();
      await waitForState(actor, (s) => s.matches("authorized"));
      expect(actor.getSnapshot().context.session).toEqual(mockSession);
    });
  });

  describe("Login Flow", () => {
    beforeEach(() => {
      (mockRepo.checkSession as jest.Mock).mockResolvedValue(null);
    });

    it("should handle success", async () => {
      const mockSession = { accessToken: "123", refreshToken: "456" };
      (mockRepo.login as jest.Mock).mockResolvedValue(mockSession);

      const actor = createTestActor();
      await waitForState(actor, (s) => s.matches("unauthorized"));

      const p1 = waitForState(actor, (s) => s.matches("authorized"));
      actor.send({ type: "LOGIN", payload: { email: "a", password: "b" } });
      await p1;

      expect(mockRepo.login).toHaveBeenCalled();
      expect(actor.getSnapshot().context.session).toEqual(mockSession);
    });

    it("should return to idle with an error on failure", async () => {
      (mockRepo.login as jest.Mock).mockRejectedValue(new Error("Fail"));

      const actor = createTestActor();
      await waitForState(actor, (s) => s.matches("unauthorized"));

      const p1 = waitForState(
        actor,
        (s) =>
          s.matches({ unauthorized: { login: "idle" } }) && s.context.error !== null
      );
      actor.send({ type: "LOGIN", payload: { email: "a", password: "b" } });
      await p1;

      const snapshot = actor.getSnapshot();
      expect(snapshot.context.error?.message).toBe("Fail");
    });

    it("should fall back to default error message when failure lacks detail", async () => {
      (mockRepo.login as jest.Mock).mockRejectedValue(new Error(""));

      const actor = createTestActor();
      await waitForState(actor, (s) => s.matches("unauthorized"));

      const p1 = waitForState(
        actor,
        (s) =>
          s.matches({ unauthorized: { login: "idle" } }) &&
          s.context.error?.message === "An unexpected error occurred"
      );
      actor.send({ type: "LOGIN", payload: { email: "a", password: "b" } });
      await p1;
    });
  });

  describe("Register Flow", () => {
    beforeEach(() => {
      (mockRepo.checkSession as jest.Mock).mockResolvedValue(null);
    });

    it("should handle full OTP-based registration flow", async () => {
      const mockSession = { accessToken: "xyz" };
      (mockRepo.register as jest.Mock).mockResolvedValue(undefined);
      (mockRepo.verifyOtp as jest.Mock).mockResolvedValue("registration-token");
      (mockRepo.completeRegistration as jest.Mock).mockResolvedValue(undefined);
      (mockRepo.login as jest.Mock).mockResolvedValue(mockSession);

      const actor = createTestActor();
      await waitForState(actor, (s) => s.matches("unauthorized"));

      const toRegister = waitForState(actor, (s) =>
        s.matches({ unauthorized: { register: "form" } })
      );
      actor.send({ type: "GO_TO_REGISTER" });
      await toRegister;

      const toVerifyOtp = waitForState(actor, (s) =>
        s.matches({ unauthorized: { register: "verifyOtp" } })
      );
      actor.send({
        type: "REGISTER",
        payload: { email: "a", password: "b" },
      });
      await toVerifyOtp;

      const toAuthorized = waitForState(actor, (s) => s.matches("authorized"));
      actor.send({ type: "VERIFY_OTP", payload: { otp: "654321" } });
      await toAuthorized;

      expect(mockRepo.register).toHaveBeenCalledWith({
        email: "a",
        password: "b",
      });
      expect(mockRepo.verifyOtp).toHaveBeenCalledWith({
        email: "a",
        otp: "654321",
      });
      expect(mockRepo.completeRegistration).toHaveBeenCalledWith({
        actionToken: "registration-token",
        newPassword: "b",
      });
      expect(mockRepo.login).toHaveBeenCalledWith({ email: "a", password: "b" });
      expect(actor.getSnapshot().context.session).toEqual(mockSession);
    });

    it("should return to form with an error when register fails", async () => {
      (mockRepo.register as jest.Mock).mockRejectedValue(new Error("Exists"));

      const actor = createTestActor();
      await waitForState(actor, (s) => s.matches("unauthorized"));

      // 1. Go to register screen
      const p1 = waitForState(actor, (s) =>
        s.matches({ unauthorized: { register: "form" } })
      );
      actor.send({ type: "GO_TO_REGISTER" });
      await p1;

      // 2. Send the register event that will fail
      const backToForm = waitForState(actor, (s) =>
        s.matches({ unauthorized: { register: "form" } })
      );
      actor.send({
        type: "REGISTER",
        payload: { email: "a", password: "b" },
      });
      await backToForm;

      const snapshot = actor.getSnapshot();
      expect(snapshot.context.error?.message).toBe("Exists");
      expect(snapshot.matches({ unauthorized: { register: "form" } })).toBe(true);
    });

    it("should show default error when register rejects without payload", async () => {
      (mockRepo.register as jest.Mock).mockRejectedValue(undefined);

      const actor = createTestActor();
      await waitForState(actor, (s) => s.matches("unauthorized"));

      const toForm = waitForState(actor, (s) =>
        s.matches({ unauthorized: { register: "form" } })
      );
      actor.send({ type: "GO_TO_REGISTER" });
      await toForm;

      const backToForm = waitForState(
        actor,
        (s) =>
          s.matches({ unauthorized: { register: "form" } }) &&
          s.context.error?.message === "An unexpected error occurred"
      );
      actor.send({ type: "REGISTER", payload: { email: "a", password: "b" } });
      await backToForm;
    });

    it("should surface OTP errors", async () => {
      (mockRepo.register as jest.Mock).mockResolvedValue(undefined);
      (mockRepo.verifyOtp as jest.Mock).mockRejectedValue(new Error("Bad OTP"));

      const actor = createTestActor();
      await waitForState(actor, (s) => s.matches("unauthorized"));

      const toVerify = waitForState(actor, (s) =>
        s.matches({ unauthorized: { register: "verifyOtp" } })
      );
      actor.send({ type: "GO_TO_REGISTER" });
      actor.send({ type: "REGISTER", payload: { email: "a", password: "b" } });
      await toVerify;

      const pErr = waitForState(
        actor,
        (s) =>
          s.matches({ unauthorized: { register: "verifyOtp" } }) &&
          s.context.error !== null
      );
      actor.send({ type: "VERIFY_OTP", payload: { otp: "000000" } });
      await pErr;

      expect(actor.getSnapshot().context.error?.message).toBe("Bad OTP");
    });

    it("should ignore VERIFY_OTP when email context is missing", async () => {
      (mockRepo.register as jest.Mock).mockResolvedValue(undefined);
      (mockRepo.verifyOtp as jest.Mock).mockResolvedValue("token");

      const actor = createTestActor();
      await waitForState(actor, (s) => s.matches("unauthorized"));

      const toVerify = waitForState(actor, (s) =>
        s.matches({ unauthorized: { register: "verifyOtp" } })
      );
      actor.send({ type: "GO_TO_REGISTER" });
      actor.send({ type: "REGISTER", payload: { email: "a", password: "b" } });
      await toVerify;

      // Simulate lost email context (guards should block transition)
      (actor.getSnapshot().context as any).email = undefined;

      actor.send({ type: "VERIFY_OTP", payload: { otp: "000000" } });
      await Promise.resolve();

      expect(actor.getSnapshot().matches({ unauthorized: { register: "verifyOtp" } })).toBe(true);
      expect(mockRepo.verifyOtp).not.toHaveBeenCalled();
    });

    it("should complete registration with empty password when none stored", async () => {
      (mockRepo.register as jest.Mock).mockResolvedValue(undefined);
      (mockRepo.verifyOtp as jest.Mock).mockResolvedValue("registration-token");
      (mockRepo.completeRegistration as jest.Mock).mockResolvedValue(undefined);
      (mockRepo.login as jest.Mock).mockRejectedValue(new Error("Fail login"));

      const actor = createTestActor();
      await waitForState(actor, (s) => s.matches("unauthorized"));

      const toVerify = waitForState(actor, (s) =>
        s.matches({ unauthorized: { register: "verifyOtp" } })
      );
      actor.send({ type: "GO_TO_REGISTER" });
      actor.send({ type: "REGISTER", payload: { email: "a", password: "b" } });
      await toVerify;

      (actor.getSnapshot().context as any).pendingCredentials = {
        email: "a",
        password: null,
      };

      const backToLogin = waitForState(actor, (s) => s.matches({ unauthorized: "login" }));
      actor.send({ type: "VERIFY_OTP", payload: { otp: "123456" } });
      await backToLogin;

      expect(mockRepo.completeRegistration).toHaveBeenCalledWith({
        actionToken: "registration-token",
        newPassword: "",
      });
    });
  });

  describe("Forgot Password Flow", () => {
    beforeEach(() => {
      (mockRepo.checkSession as jest.Mock).mockResolvedValue(null);
    });

    it("should handle request failure", async () => {
      (mockRepo.requestPasswordReset as jest.Mock).mockRejectedValue(
        new Error("Email not found")
      );

      const actor = createTestActor();
      await waitForState(actor, (s) => s.matches("unauthorized"));

      const p1 = waitForState(actor, (s) =>
        s.matches({ unauthorized: { forgotPassword: "idle" } })
      );
      actor.send({ type: "GO_TO_FORGOT_PASSWORD" });
      await p1;

      const p2 = waitForState(
        actor,
        (s) =>
          s.matches({ unauthorized: { forgotPassword: "idle" } }) &&
          s.context.error !== null
      );
      actor.send({
        type: "FORGOT_PASSWORD",
        payload: { email: "missing@test.com" },
      });
      await p2;

      const snapshot = actor.getSnapshot();
      expect(snapshot.context.error?.message).toBe("Email not found");
    });

    it("should handle OTP verification failure", async () => {
      (mockRepo.requestPasswordReset as jest.Mock).mockResolvedValue(undefined);
      (mockRepo.verifyOtp as jest.Mock).mockRejectedValue(new Error("Invalid OTP"));

      const actor = createTestActor();
      await waitForState(actor, (s) => s.matches("unauthorized"));

      // 1. Go to forgot password and submit email successfully
      const p1 = waitForState(actor, (s) =>
        s.matches({ unauthorized: { forgotPassword: "idle" } })
      );
      actor.send({ type: "GO_TO_FORGOT_PASSWORD" });
      await p1;

      const p2 = waitForState(actor, (s) =>
        s.matches({ unauthorized: { forgotPassword: "verifyOtp" } })
      );
      actor.send({
        type: "FORGOT_PASSWORD",
        payload: { email: "test@test.com" },
      });
      await p2;

      // 2. Submit invalid OTP
      const p3 = waitForState(
        actor,
        (s) =>
          s.matches({ unauthorized: { forgotPassword: "verifyOtp" } }) &&
          s.context.error !== null
      );
      actor.send({
        type: "VERIFY_OTP",
        payload: { otp: "wrong-otp" },
      });
      await p3;

      const snapshot = actor.getSnapshot();
      expect(snapshot.context.error?.message).toBe("Invalid OTP");
    });

    it("should handle the full forgot password flow", async () => {
      const mockSession = { accessToken: "1" };
      (mockRepo.requestPasswordReset as jest.Mock).mockResolvedValue(undefined);
      (mockRepo.verifyOtp as jest.Mock).mockResolvedValue("action-token");
      (mockRepo.completePasswordReset as jest.Mock).mockResolvedValue(undefined);
      (mockRepo.login as jest.Mock).mockResolvedValue(mockSession);

      const actor = createTestActor();
      await waitForState(actor, (s) => s.matches("unauthorized"));

      // 1. Go to forgot password and submit email
      const p1 = waitForState(actor, (s) =>
        s.matches({ unauthorized: { forgotPassword: "idle" } })
      );
      actor.send({ type: "GO_TO_FORGOT_PASSWORD" });
      await p1;

      const p2 = waitForState(actor, (s) =>
        s.matches({ unauthorized: { forgotPassword: "verifyOtp" } })
      );
      actor.send({
        type: "FORGOT_PASSWORD",
        payload: { email: "test@test.com" },
      });
      await p2;
      expect(mockRepo.requestPasswordReset).toHaveBeenCalled();

      // 2. Submit OTP
      const p3 = waitForState(actor, (s) =>
        s.matches({ unauthorized: { forgotPassword: "resetPassword" } })
      );
      actor.send({
        type: "VERIFY_OTP",
        payload: { otp: "1234" },
      });
      await p3;
      expect(mockRepo.verifyOtp).toHaveBeenCalled();

      // 3. Submit new password
      const p4 = waitForState(actor, (s) =>
        s.matches({ unauthorized: { forgotPassword: "resettingPassword" } })
      );
      actor.send({
        type: "RESET_PASSWORD",
        payload: {
          newPassword: "new-password",
        },
      });
      await p4;
      expect(mockRepo.completePasswordReset).toHaveBeenCalledWith({
        actionToken: "action-token",
        newPassword: "new-password",
      });

      const p5 = waitForState(actor, (s) => s.matches("authorized"));
      await p5;
      expect(mockRepo.login).toHaveBeenCalledWith({
        email: "test@test.com",
        password: "new-password",
      });
      expect(actor.getSnapshot().context.session).toEqual(mockSession);
    });

    it("should ignore VERIFY_OTP when email context is missing", async () => {
      (mockRepo.requestPasswordReset as jest.Mock).mockResolvedValue(undefined);
      (mockRepo.verifyOtp as jest.Mock).mockResolvedValue("action-token");

      const actor = createTestActor();
      await waitForState(actor, (s) => s.matches("unauthorized"));

      const toVerify = waitForState(actor, (s) =>
        s.matches({ unauthorized: { forgotPassword: "verifyOtp" } })
      );
      actor.send({ type: "GO_TO_FORGOT_PASSWORD" });
      actor.send({ type: "FORGOT_PASSWORD", payload: { email: "test@test.com" } });
      await toVerify;

      (actor.getSnapshot().context as any).email = undefined;

      actor.send({ type: "VERIFY_OTP", payload: { otp: "123456" } });
      await Promise.resolve();

      expect(actor.getSnapshot().matches({ unauthorized: { forgotPassword: "verifyOtp" } })).toBe(
        true
      );
      expect(mockRepo.verifyOtp).not.toHaveBeenCalled();
    });

    it("should ignore RESET_PASSWORD when no action token exists", async () => {
      (mockRepo.requestPasswordReset as jest.Mock).mockResolvedValue(undefined);
      (mockRepo.verifyOtp as jest.Mock).mockResolvedValue("action-token");

      const actor = createTestActor();
      await waitForState(actor, (s) => s.matches("unauthorized"));

      const toVerify = waitForState(actor, (s) =>
        s.matches({ unauthorized: { forgotPassword: "verifyOtp" } })
      );
      actor.send({ type: "GO_TO_FORGOT_PASSWORD" });
      actor.send({ type: "FORGOT_PASSWORD", payload: { email: "test@test.com" } });
      await toVerify;

      const toReset = waitForState(actor, (s) =>
        s.matches({ unauthorized: { forgotPassword: "resetPassword" } })
      );
      actor.send({ type: "VERIFY_OTP", payload: { otp: "123456" } });
      await toReset;

      (actor.getSnapshot().context as any).resetActionToken = undefined;

      actor.send({ type: "RESET_PASSWORD", payload: { newPassword: "Secret123!" } });
      await Promise.resolve();

      expect(
        actor.getSnapshot().matches({ unauthorized: { forgotPassword: "resetPassword" } })
      ).toBe(true);
      expect(mockRepo.completePasswordReset).not.toHaveBeenCalled();
    });
  });

  describe("Navigation & Logout", () => {
    it("should navigate between sub-states", async () => {
      (mockRepo.checkSession as jest.Mock).mockResolvedValue(null);
      const actor = createTestActor();
      await waitForState(actor, (s) => s.matches({ unauthorized: "login" }));

      const p1 = waitForState(actor, (s) =>
        s.matches({ unauthorized: "register" })
      );
      actor.send({ type: "GO_TO_REGISTER" });
      await p1;

      const p2 = waitForState(actor, (s) =>
        s.matches({ unauthorized: "login" })
      );
      actor.send({ type: "GO_TO_LOGIN" });
      await p2;
    });

    it("should logout and clear session", async () => {
      const mockSession = { accessToken: "123" };
      (mockRepo.checkSession as jest.Mock).mockResolvedValue(mockSession);
      (mockRepo.logout as jest.Mock).mockResolvedValue(undefined);

      const actor = createTestActor();
      await waitForState(actor, (s) => s.matches("authorized"));

      const p1 = waitForState(actor, (s) => s.matches("unauthorized"));
      actor.send({ type: "LOGOUT" });
      await p1;

      expect(mockRepo.logout).toHaveBeenCalled();
      expect(actor.getSnapshot().context.session).toBeNull();
    });
  });
});

describe("resolveRegistrationPassword", () => {
  it("returns provided password when non-empty string", () => {
    expect(
      resolveRegistrationPassword({ email: "a", password: "Secret123" })
    ).toBe("Secret123");
  });

  it("returns empty string when password is missing or blank", () => {
    expect(resolveRegistrationPassword({ email: "a", password: "" })).toBe("");
    expect(resolveRegistrationPassword({ email: "a" } as any)).toBe("");
    expect(resolveRegistrationPassword(undefined)).toBe("");
  });
});
