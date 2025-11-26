/* eslint-disable @typescript-eslint/no-unsafe-call */
/**
 * Path: src/features/auth/service/authService.test.ts
 *
 * Tests for AuthService - the public authentication API layer.
 * These tests verify that the service layer provides a clean API.
 *
 * NOTE: These are unit tests for the service API surface.
 * Detailed state machine integration tests are in authMachine.test.ts
 */

import { AuthService } from "./authService";
import { IAuthRepository } from "../types";

// Mock repository
const createMockRepository = (): IAuthRepository => ({
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
});

describe("AuthService", () => {
  let mockRepo: IAuthRepository;
  let service: AuthService;

  beforeEach(() => {
    mockRepo = createMockRepository();
    service = new AuthService(mockRepo);
  });

  afterEach(() => {
    service.stop();
  });

  describe("State Query Methods", () => {
    it("should have isLoggedIn method", () => {
      expect(typeof service.isLoggedIn).toBe("function");
      expect(service.isLoggedIn()).toBe(false);
    });

    it("should have hasError method", () => {
      expect(typeof service.hasError).toBe("function");
      expect(service.hasError()).toBe(false);
    });

    it("should have getError method", () => {
      expect(typeof service.getError).toBe("function");
      expect(service.getError()).toBeNull();
    });

    it("should have getSession method", () => {
      expect(typeof service.getSession).toBe("function");
      expect(service.getSession()).toBeNull();
    });

    it("should have getState method", () => {
      expect(typeof service.getState).toBe("function");
      const state = service.getState() as string | object;
      expect(state).toBeDefined();
    });

    it("should have matches method", () => {
      expect(typeof service.matches).toBe("function");
      expect(service.matches("unauthorized")).toBe(true);
    });

    it("should have isLoading method", () => {
      expect(typeof service.isLoading).toBe("function");
      expect(service.isLoading()).toBe(false);
    });

    it("should have getContext method", () => {
      expect(typeof service.getContext).toBe("function");
      service.getContext();
    });
  });

  describe("Navigation Methods", () => {
    it("should have goToLogin method", () => {
      expect(typeof service.goToLogin).toBe("function");
      service.goToLogin();
    });

    it("should have goToRegister method", () => {
      expect(typeof service.goToRegister).toBe("function");
      service.goToRegister();
    });

    it("should have goToForgotPassword method", () => {
      expect(typeof service.goToForgotPassword).toBe("function");
      service.goToForgotPassword();
    });

    it("should have cancel method", () => {
      expect(typeof service.cancel).toBe("function");
      service.cancel();
    });
  });

  describe("Subscription Management", () => {
    it("should have subscribe method that returns unsubscribe function", () => {
      expect(typeof service.subscribe).toBe("function");
      const subscriber = jest.fn();
      const unsubscribe = service.subscribe(subscriber);
      expect(typeof unsubscribe).toBe("function");
      unsubscribe();
    });
  });

  describe("Service Lifecycle", () => {
    it("should have stop method", () => {
      expect(typeof service.stop).toBe("function");
      service.stop();
      expect(service.isLoggedIn()).toBe(false);
    });
  });

  describe("Promise-based Authentication Methods", () => {
    it("should have login method", () => {
      expect(typeof service.login).toBe("function");
    });

    it("should have register method", () => {
      expect(typeof service.register).toBe("function");
    });

    it("should have checkSession method", () => {
      expect(typeof service.checkSession).toBe("function");
    });

    it("should have logout method", () => {
      expect(typeof service.logout).toBe("function");
    });

    it("should have refresh method", () => {
      expect(typeof service.refresh).toBe("function");
    });

    it("should have requestPasswordReset method", () => {
      expect(typeof service.requestPasswordReset).toBe("function");
    });

    it("should have verifyOtp method", () => {
      expect(typeof service.verifyOtp).toBe("function");
    });

    it("should have completePasswordReset method", () => {
      expect(typeof service.completePasswordReset).toBe("function");
    });

    it("should have completeRegistration method", () => {
      expect(typeof service.completeRegistration).toBe("function");
    });
  });
});
