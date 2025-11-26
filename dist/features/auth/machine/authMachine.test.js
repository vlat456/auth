"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
/**
 * Path: src/features/auth/machine/authMachine.test.ts
 * Version: 0.1.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const xstate_1 = require("xstate");
const authMachine_1 = require("./authMachine");
jest.useFakeTimers();
// Helper to wait for a specific state or condition
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const waitForState = (actor, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
predicate) => {
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
// Helper to safely check state matches with type safety
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stateMatches = (snapshot, pattern) => {
    return snapshot["matches"](pattern);
};
const mockRepo = {
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
const createTestActor = () => {
    const machine = (0, authMachine_1.createAuthMachine)(mockRepo);
    const actor = (0, xstate_1.createActor)(machine);
    actor.start();
    return actor;
};
describe("Auth Machine", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe("Initialization", () => {
        it("should move to unauthorized if no session", async () => {
            mockRepo.checkSession.mockResolvedValue(null);
            const actor = createTestActor();
            await waitForState(actor, (s) => s["matches"]("unauthorized"));
        });
        it("should move to authorized if session exists", async () => {
            const mockSession = { accessToken: "validaccesstoken" };
            mockRepo.checkSession.mockResolvedValue(mockSession);
            mockRepo.refreshProfile.mockResolvedValue(mockSession);
            const actor = createTestActor();
            await waitForState(actor, (s) => s["matches"]("authorized"));
            expect(actor.getSnapshot().context.session).toEqual(mockSession);
        });
    });
    describe("Login Flow", () => {
        beforeEach(() => {
            mockRepo.checkSession.mockResolvedValue(null);
        });
        it("should handle success", async () => {
            const mockSession = {
                accessToken: "validaccesstoken",
                refreshToken: "validrefreshtoken",
            };
            mockRepo.login.mockResolvedValue(mockSession);
            const actor = createTestActor();
            await waitForState(actor, (s) => s["matches"]("unauthorized"));
            const p1 = waitForState(actor, (s) => s["matches"]("authorized"));
            actor.send({
                type: "LOGIN",
                payload: { email: "test@example.com", password: "validpass" },
            });
            await p1;
            expect(mockRepo.login).toHaveBeenCalled();
            expect(actor.getSnapshot().context.session).toEqual(mockSession);
        });
        it("should return to idle with an error on failure", async () => {
            mockRepo.login.mockRejectedValue(new Error("Fail"));
            const actor = createTestActor();
            await waitForState(actor, (s) => s["matches"]("unauthorized"));
            const p1 = waitForState(actor, (s) => s["matches"]({ unauthorized: { login: "idle" } }) &&
                s.context.error !== null);
            actor.send({
                type: "LOGIN",
                payload: { email: "test@example.com", password: "validpass" },
            });
            await p1;
            const snapshot = actor.getSnapshot();
            expect(snapshot.context.error?.message).toBe("Fail");
        });
        it("should fall back to default error message when failure lacks detail", async () => {
            mockRepo.login.mockRejectedValue(new Error(""));
            const actor = createTestActor();
            await waitForState(actor, (s) => s["matches"]("unauthorized"));
            const p1 = waitForState(actor, (s) => s["matches"]({ unauthorized: { login: "idle" } }) &&
                s.context.error?.message === "An unexpected error occurred");
            actor.send({
                type: "LOGIN",
                payload: { email: "test@example.com", password: "validpass" },
            });
            await p1;
        });
    });
    describe("Register Flow", () => {
        beforeEach(() => {
            mockRepo.checkSession.mockResolvedValue(null);
        });
        it("should handle full OTP-based registration flow", async () => {
            const mockSession = { accessToken: "validaccesstoken" };
            mockRepo.register.mockResolvedValue(undefined);
            mockRepo.verifyOtp.mockResolvedValue("registration-token");
            mockRepo.completeRegistration.mockResolvedValue(undefined);
            mockRepo.login.mockResolvedValue(mockSession);
            const actor = createTestActor();
            await waitForState(actor, (s) => s["matches"]("unauthorized"));
            const toRegister = waitForState(actor, (s) => s["matches"]({ unauthorized: { register: "form" } }));
            actor.send({ type: "GO_TO_REGISTER" });
            await toRegister;
            const toVerifyOtp = waitForState(actor, (s) => s["matches"]({ unauthorized: { register: "verifyOtp" } }));
            actor.send({
                type: "REGISTER",
                payload: { email: "test@example.com", password: "validpass" },
            });
            await toVerifyOtp;
            const toAuthorized = waitForState(actor, (s) => s["matches"]("authorized"));
            actor.send({ type: "VERIFY_OTP", payload: { otp: "654321" } });
            await toAuthorized;
            expect(mockRepo.register).toHaveBeenCalledWith({
                email: "test@example.com",
                password: "validpass",
            });
            expect(mockRepo.verifyOtp).toHaveBeenCalledWith({
                email: "test@example.com",
                otp: "654321",
            });
            expect(mockRepo.completeRegistration).toHaveBeenCalledWith({
                actionToken: "registration-token",
                newPassword: "validpass",
            });
            expect(mockRepo.login).toHaveBeenCalledWith({
                email: "test@example.com",
                password: "validpass",
            });
            expect(actor.getSnapshot().context.session).toEqual(mockSession);
        });
        it("should handle missing pending credentials gracefully after registration", async () => {
            const mockSession = { accessToken: "xyz" };
            mockRepo.register.mockResolvedValue(undefined);
            mockRepo.verifyOtp.mockResolvedValue("registration-token");
            mockRepo.completeRegistration.mockResolvedValue(undefined);
            mockRepo.login.mockRejectedValue(new Error("Invalid credentials"));
            const actor = createTestActor();
            await waitForState(actor, (s) => s["matches"]("unauthorized"));
            const toRegister = waitForState(actor, (s) => s["matches"]({ unauthorized: { register: "form" } }));
            actor.send({ type: "GO_TO_REGISTER" });
            await toRegister;
            const toVerifyOtp = waitForState(actor, (s) => s["matches"]({ unauthorized: { register: "verifyOtp" } }));
            actor.send({
                type: "REGISTER",
                payload: { email: "test@test.com", password: "validpass" },
            });
            await toVerifyOtp;
            // Simulate credentials being lost
            actor.getSnapshot().context.registration = actor.getSnapshot().context.registration || {};
            actor.getSnapshot().context.registration.pendingCredentials = undefined;
            const backToLogin = waitForState(actor, (s) => s["matches"]({ unauthorized: "login" }) && s.context.error !== null);
            actor.send({ type: "VERIFY_OTP", payload: { otp: "654321" } });
            await backToLogin;
            // Should attempt login with empty credentials (will fail with proper error)
            expect(mockRepo.login).toHaveBeenCalledWith({
                email: "",
                password: "",
            });
            expect(actor.getSnapshot().context.error?.message).toBe("Invalid credentials");
        });
        it("should return to form with an error when register fails", async () => {
            mockRepo.register.mockRejectedValue(new Error("Exists"));
            const actor = createTestActor();
            await waitForState(actor, (s) => s["matches"]("unauthorized"));
            // 1. Go to register screen
            const p1 = waitForState(actor, (s) => s["matches"]({ unauthorized: { register: "form" } }));
            actor.send({ type: "GO_TO_REGISTER" });
            await p1;
            // 2. Send the register event that will fail
            const backToForm = waitForState(actor, (s) => s["matches"]({ unauthorized: { register: "form" } }));
            actor.send({
                type: "REGISTER",
                payload: { email: "a", password: "b" },
            });
            await backToForm;
            const snapshot = actor.getSnapshot();
            expect(snapshot.context.error?.message).toBe("Exists");
            expect(snapshot["matches"]({ unauthorized: { register: "form" } })).toBe(true);
        });
        it("should show default error when register rejects without payload", async () => {
            mockRepo.register.mockRejectedValue(undefined);
            const actor = createTestActor();
            await waitForState(actor, (s) => s["matches"]("unauthorized"));
            const toForm = waitForState(actor, (s) => s["matches"]({ unauthorized: { register: "form" } }));
            actor.send({ type: "GO_TO_REGISTER" });
            await toForm;
            const backToForm = waitForState(actor, (s) => s["matches"]({ unauthorized: { register: "form" } }) &&
                s.context.error?.message === "An unexpected error occurred");
            actor.send({ type: "REGISTER", payload: { email: "a", password: "b" } });
            await backToForm;
        });
        it("should surface OTP errors", async () => {
            mockRepo.register.mockResolvedValue(undefined);
            mockRepo.verifyOtp.mockRejectedValue(new Error("Bad OTP"));
            const actor = createTestActor();
            await waitForState(actor, (s) => s["matches"]("unauthorized"));
            const toVerify = waitForState(actor, (s) => s["matches"]({ unauthorized: { register: "verifyOtp" } }));
            actor.send({ type: "GO_TO_REGISTER" });
            actor.send({ type: "REGISTER", payload: { email: "a", password: "b" } });
            await toVerify;
            const pErr = waitForState(actor, (s) => s["matches"]({ unauthorized: { register: "verifyOtp" } }) &&
                s.context.error !== null);
            actor.send({ type: "VERIFY_OTP", payload: { otp: "000000" } });
            await pErr;
            expect(actor.getSnapshot().context.error?.message).toBe("Bad OTP");
        });
        it("should ignore VERIFY_OTP when email context is missing", async () => {
            mockRepo.register.mockResolvedValue(undefined);
            mockRepo.verifyOtp.mockResolvedValue("token");
            const actor = createTestActor();
            await waitForState(actor, (s) => s["matches"]("unauthorized"));
            const toVerify = waitForState(actor, (s) => s["matches"]({ unauthorized: { register: "verifyOtp" } }));
            actor.send({ type: "GO_TO_REGISTER" });
            actor.send({ type: "REGISTER", payload: { email: "a", password: "b" } });
            await toVerify;
            // Simulate lost email context (guards should block transition)
            actor.getSnapshot().context.email = undefined;
            actor.send({ type: "VERIFY_OTP", payload: { otp: "000000" } });
            await Promise.resolve();
            expect(actor
                .getSnapshot()["matches"]({ unauthorized: { register: "verifyOtp" } })).toBe(true);
            expect(mockRepo.verifyOtp).not.toHaveBeenCalled();
        });
        it("should complete registration with empty password when none stored", async () => {
            mockRepo.register.mockResolvedValue(undefined);
            mockRepo.verifyOtp.mockResolvedValue("registration-token");
            mockRepo.completeRegistration.mockResolvedValue(undefined);
            mockRepo.login.mockRejectedValue(new Error("Fail login"));
            const actor = createTestActor();
            await waitForState(actor, (s) => s["matches"]("unauthorized"));
            const toVerify = waitForState(actor, (s) => s["matches"]({ unauthorized: { register: "verifyOtp" } }));
            actor.send({ type: "GO_TO_REGISTER" });
            actor.send({ type: "REGISTER", payload: { email: "a", password: "b" } });
            await toVerify;
            actor.getSnapshot().context.pendingCredentials = {
                email: "a",
                password: null,
            };
            const backToLogin = waitForState(actor, (s) => s["matches"]({ unauthorized: "login" }));
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
            mockRepo.checkSession.mockResolvedValue(null);
        });
        it("should handle request failure", async () => {
            mockRepo.requestPasswordReset.mockRejectedValue(new Error("Email not found"));
            const actor = createTestActor();
            await waitForState(actor, (s) => s["matches"]("unauthorized"));
            const p1 = waitForState(actor, (s) => s["matches"]({ unauthorized: { forgotPassword: "idle" } }));
            actor.send({ type: "GO_TO_FORGOT_PASSWORD" });
            await p1;
            const p2 = waitForState(actor, (s) => s["matches"]({ unauthorized: { forgotPassword: "idle" } }) &&
                s.context.error !== null);
            actor.send({
                type: "FORGOT_PASSWORD",
                payload: { email: "missing@test.com" },
            });
            await p2;
            const snapshot = actor.getSnapshot();
            expect(snapshot.context.error?.message).toBe("Email not found");
        });
        it("should handle OTP verification failure", async () => {
            mockRepo.requestPasswordReset.mockResolvedValue(undefined);
            mockRepo.verifyOtp.mockRejectedValue(new Error("Invalid OTP"));
            const actor = createTestActor();
            await waitForState(actor, (s) => s["matches"]("unauthorized"));
            // 1. Go to forgot password and submit email successfully
            const p1 = waitForState(actor, (s) => s["matches"]({ unauthorized: { forgotPassword: "idle" } }));
            actor.send({ type: "GO_TO_FORGOT_PASSWORD" });
            await p1;
            const p2 = waitForState(actor, (s) => s["matches"]({ unauthorized: { forgotPassword: "verifyOtp" } }));
            actor.send({
                type: "FORGOT_PASSWORD",
                payload: { email: "test@test.com" },
            });
            await p2;
            // 2. Submit invalid OTP
            const p3 = waitForState(actor, (s) => s["matches"]({ unauthorized: { forgotPassword: "verifyOtp" } }) &&
                s.context.error !== null);
            actor.send({
                type: "VERIFY_OTP",
                payload: { otp: "wrong-otp" },
            });
            await p3;
            const snapshot = actor.getSnapshot();
            expect(snapshot.context.error?.message).toBe("Invalid OTP");
        });
        it("should handle the full forgot password flow", async () => {
            const mockSession = { accessToken: "validaccesstoken" };
            mockRepo.requestPasswordReset.mockResolvedValue(undefined);
            mockRepo.verifyOtp.mockResolvedValue("action-token");
            mockRepo.completePasswordReset.mockResolvedValue(undefined);
            mockRepo.login.mockResolvedValue(mockSession);
            const actor = createTestActor();
            await waitForState(actor, (s) => s["matches"]("unauthorized"));
            // 1. Go to forgot password and submit email
            const p1 = waitForState(actor, (s) => s["matches"]({ unauthorized: { forgotPassword: "idle" } }));
            actor.send({ type: "GO_TO_FORGOT_PASSWORD" });
            await p1;
            const p2 = waitForState(actor, (s) => s["matches"]({ unauthorized: { forgotPassword: "verifyOtp" } }));
            actor.send({
                type: "FORGOT_PASSWORD",
                payload: { email: "test@test.com" },
            });
            await p2;
            expect(mockRepo.requestPasswordReset).toHaveBeenCalled();
            // 2. Submit OTP
            const p3 = waitForState(actor, (s) => s["matches"]({ unauthorized: { forgotPassword: "resetPassword" } }));
            actor.send({
                type: "VERIFY_OTP",
                payload: { otp: "1234" },
            });
            await p3;
            expect(mockRepo.verifyOtp).toHaveBeenCalled();
            // 3. Submit new password
            const p4 = waitForState(actor, (s) => s["matches"]({ unauthorized: { forgotPassword: "resettingPassword" } }));
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
            const p5 = waitForState(actor, (s) => s["matches"]("authorized"));
            await p5;
            expect(mockRepo.login).toHaveBeenCalledWith({
                email: "test@test.com",
                password: "new-password",
            });
            expect(actor.getSnapshot().context.session).toEqual(mockSession);
        });
        it("should ignore VERIFY_OTP when email context is missing", async () => {
            mockRepo.requestPasswordReset.mockResolvedValue(undefined);
            mockRepo.verifyOtp.mockResolvedValue("action-token");
            const actor = createTestActor();
            await waitForState(actor, (s) => s["matches"]("unauthorized"));
            const toVerify = waitForState(actor, (s) => s["matches"]({ unauthorized: { forgotPassword: "verifyOtp" } }));
            actor.send({ type: "GO_TO_FORGOT_PASSWORD" });
            actor.send({
                type: "FORGOT_PASSWORD",
                payload: { email: "test@test.com" },
            });
            await toVerify;
            actor.getSnapshot().context.email = undefined;
            actor.send({ type: "VERIFY_OTP", payload: { otp: "123456" } });
            await Promise.resolve();
            expect(actor
                .getSnapshot()["matches"]({ unauthorized: { forgotPassword: "verifyOtp" } })).toBe(true);
            expect(mockRepo.verifyOtp).not.toHaveBeenCalled();
        });
        it("should ignore RESET_PASSWORD when no action token exists", async () => {
            mockRepo.requestPasswordReset.mockResolvedValue(undefined);
            mockRepo.verifyOtp.mockResolvedValue("action-token");
            const actor = createTestActor();
            await waitForState(actor, (s) => s["matches"]("unauthorized"));
            const toVerify = waitForState(actor, (s) => s["matches"]({ unauthorized: { forgotPassword: "verifyOtp" } }));
            actor.send({ type: "GO_TO_FORGOT_PASSWORD" });
            actor.send({
                type: "FORGOT_PASSWORD",
                payload: { email: "test@test.com" },
            });
            await toVerify;
            const toReset = waitForState(actor, (s) => s["matches"]({ unauthorized: { forgotPassword: "resetPassword" } }));
            actor.send({ type: "VERIFY_OTP", payload: { otp: "123456" } });
            await toReset;
            actor.getSnapshot().context.resetActionToken = undefined;
            actor.send({
                type: "RESET_PASSWORD",
                payload: { newPassword: "Secret123!" },
            });
            await Promise.resolve();
            expect(actor
                .getSnapshot()["matches"]({ unauthorized: { forgotPassword: "resetPassword" } })).toBe(true);
            expect(mockRepo.completePasswordReset).not.toHaveBeenCalled();
        });
    });
    describe("Navigation & Logout", () => {
        it("should navigate between sub-states", async () => {
            mockRepo.checkSession.mockResolvedValue(null);
            const actor = createTestActor();
            await waitForState(actor, (s) => s["matches"]({ unauthorized: "login" }));
            const p1 = waitForState(actor, (s) => s["matches"]({ unauthorized: "register" }));
            actor.send({ type: "GO_TO_REGISTER" });
            await p1;
            const p2 = waitForState(actor, (s) => s["matches"]({ unauthorized: "login" }));
            actor.send({ type: "GO_TO_LOGIN" });
            await p2;
        });
        it("should logout and clear session", async () => {
            const mockSession = { accessToken: "123" };
            mockRepo.checkSession.mockResolvedValue(mockSession);
            mockRepo.logout.mockResolvedValue(undefined);
            const actor = createTestActor();
            await waitForState(actor, (s) => s["matches"]("authorized"));
            const p1 = waitForState(actor, (s) => s["matches"]("unauthorized"));
            actor.send({ type: "LOGOUT" });
            await p1;
            expect(mockRepo.logout).toHaveBeenCalled();
            expect(actor.getSnapshot().context.session).toBeNull();
        });
    });
    describe("Branch Coverage Tests", () => {
        it("should handle checkSession error", async () => {
            mockRepo.checkSession.mockRejectedValue(new Error("Network error"));
            const actor = createTestActor();
            await waitForState(actor, (s) => s["matches"]("unauthorized"));
            // The error might not be set on the context during checkSession error
            // Just ensure it transitions to unauthorized as expected
            expect(actor.getSnapshot().value).toEqual({
                unauthorized: { login: "idle" },
            });
        });
        it("should handle error in login with null error object", async () => {
            mockRepo.checkSession.mockResolvedValue(null);
            // Test with null error object that causes fallback to default error message
            mockRepo.login.mockRejectedValue(null);
            const actor = createTestActor();
            await waitForState(actor, (s) => s["matches"]("unauthorized"));
            const p1 = waitForState(actor, (s) => s["matches"]({ unauthorized: { login: "idle" } }) &&
                s.context.error?.message === "An unexpected error occurred");
            actor.send({
                type: "LOGIN",
                payload: { email: "test@example.com", password: "validpass" },
            });
            await p1;
            expect(actor.getSnapshot().context.error?.message).toBe("An unexpected error occurred");
        });
        it("should handle error in register with null error object", async () => {
            mockRepo.checkSession.mockResolvedValue(null);
            mockRepo.register.mockRejectedValue(null);
            const actor = createTestActor();
            await waitForState(actor, (s) => s["matches"]("unauthorized"));
            // Navigate to register
            const toRegister = waitForState(actor, (s) => s["matches"]({ unauthorized: { register: "form" } }));
            actor.send({ type: "GO_TO_REGISTER" });
            await toRegister;
            // Try to register - should fail
            const backToForm = waitForState(actor, (s) => s["matches"]({ unauthorized: { register: "form" } }) &&
                s.context.error?.message === "An unexpected error occurred");
            actor.send({
                type: "REGISTER",
                payload: { email: "a", password: "b" },
            });
            await backToForm;
            expect(actor.getSnapshot().context.error?.message).toBe("An unexpected error occurred");
        });
    });
});
