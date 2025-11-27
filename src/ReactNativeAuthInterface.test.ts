/**
 * Tests for React Native Auth Interface
 */

import { ReactNativeAuthInterface } from "./ReactNativeAuthInterface";

jest.mock("./features/auth/repositories/AuthRepository");
jest.mock("./features/auth/adapters/ReactNativeStorage", () => ({
  ReactNativeStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe("ReactNativeAuthInterface", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize interface", () => {
      const instance = new ReactNativeAuthInterface();
      expect(instance).toBeDefined();
    });

    it("should initialize with custom API URL", () => {
      const customURL = "https://custom-api.example.com";
      const instance = new ReactNativeAuthInterface(customURL);
      expect(instance).toBeDefined();
    });
  });

  describe("login", () => {
    it("should have login method", () => {
      const instance = new ReactNativeAuthInterface();
      expect(typeof instance.login).toBe("function");
    });

    it("should be async method", () => {
      const instance = new ReactNativeAuthInterface();
      const result = instance.login({
        email: "test@example.com",
        password: "password123",
      });
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe("register", () => {
    it("should have register method", () => {
      const instance = new ReactNativeAuthInterface();
      expect(typeof instance.register).toBe("function");
    });

    it("should return a promise", () => {
      const instance = new ReactNativeAuthInterface();
      const result = instance.register({
        email: "test@example.com",
        password: "password123",
      });
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe("requestPasswordReset", () => {
    it("should have requestPasswordReset method", () => {
      const instance = new ReactNativeAuthInterface();
      expect(typeof instance.requestPasswordReset).toBe("function");
    });

    it("should return a promise", () => {
      const instance = new ReactNativeAuthInterface();
      const result = instance.requestPasswordReset({
        email: "test@example.com",
      });
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe("verifyOtp", () => {
    it("should have verifyOtp method", () => {
      const instance = new ReactNativeAuthInterface();
      expect(typeof instance.verifyOtp).toBe("function");
    });

    it("should return a promise", () => {
      const instance = new ReactNativeAuthInterface();
      const result = instance.verifyOtp({
        email: "test@example.com",
        otp: "123456",
      });
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe("completePasswordReset", () => {
    it("should have completePasswordReset method", () => {
      const instance = new ReactNativeAuthInterface();
      expect(typeof instance.completePasswordReset).toBe("function");
    });

    it("should return a promise", () => {
      const instance = new ReactNativeAuthInterface();
      const result = instance.completePasswordReset({
        actionToken: "token",
        newPassword: "newpassword123",
      });
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe("completeRegistration", () => {
    it("should have completeRegistration method", () => {
      const instance = new ReactNativeAuthInterface();
      expect(typeof instance.completeRegistration).toBe("function");
    });

    it("should return a promise", () => {
      const instance = new ReactNativeAuthInterface();
      const result = instance.completeRegistration({
        actionToken: "token",
        newPassword: "newpassword123",
      });
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe("checkSession", () => {
    it("should have checkSession method", () => {
      const instance = new ReactNativeAuthInterface();
      expect(typeof instance.checkSession).toBe("function");
    });

    it("should return a promise", () => {
      const instance = new ReactNativeAuthInterface();
      const result = instance.checkSession();
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe("logout", () => {
    it("should have logout method", () => {
      const instance = new ReactNativeAuthInterface();
      expect(typeof instance.logout).toBe("function");
    });

    it("should return a promise", () => {
      const instance = new ReactNativeAuthInterface();
      const result = instance.logout();
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe("refresh", () => {
    it("should have refresh method", () => {
      const instance = new ReactNativeAuthInterface();
      expect(typeof instance.refresh).toBe("function");
    });

    it("should return a promise", () => {
      const instance = new ReactNativeAuthInterface();
      const result = instance.refresh();
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe("changePassword", () => {
    it("should throw not implemented error", async () => {
      const instance = new ReactNativeAuthInterface();
      const payload = {
        email: "test@example.com",
        newPassword: "newpassword123",
      };

      await expect(instance.changePassword(payload)).rejects.toThrow(
        "Method not implemented",
      );
    });
  });

  describe("deleteAccount", () => {
    it("should throw not implemented error", async () => {
      const instance = new ReactNativeAuthInterface();
      const payload = { email: "test@example.com" };

      await expect(instance.deleteAccount(payload)).rejects.toThrow(
        "Method not implemented",
      );
    });
  });

  describe("getCurrentSession", () => {
    it("should have getCurrentSession method", () => {
      const instance = new ReactNativeAuthInterface();
      expect(typeof instance.getCurrentSession).toBe("function");
    });

    it("should return a value", () => {
      const instance = new ReactNativeAuthInterface();
      const result = instance.getCurrentSession();
      expect(result).toBeDefined();
    });
  });

  describe("isLoggedIn", () => {
    it("should have isLoggedIn method", () => {
      const instance = new ReactNativeAuthInterface();
      expect(typeof instance.isLoggedIn).toBe("function");
    });

    it("should return a boolean", () => {
      const instance = new ReactNativeAuthInterface();
      const result = instance.isLoggedIn();
      expect(typeof result).toBe("boolean");
    });
  });

  describe("isLoading", () => {
    it("should have isLoading method", () => {
      const instance = new ReactNativeAuthInterface();
      expect(typeof instance.isLoading).toBe("function");
    });

    it("should return a boolean", () => {
      const instance = new ReactNativeAuthInterface();
      const result = instance.isLoading();
      expect(typeof result).toBe("boolean");
    });
  });

  describe("hasError", () => {
    it("should have hasError method", () => {
      const instance = new ReactNativeAuthInterface();
      expect(typeof instance.hasError).toBe("function");
    });

    it("should return a boolean", () => {
      const instance = new ReactNativeAuthInterface();
      const result = instance.hasError();
      expect(typeof result).toBe("boolean");
    });
  });

  describe("getError", () => {
    it("should have getError method", () => {
      const instance = new ReactNativeAuthInterface();
      expect(typeof instance.getError).toBe("function");
    });

    it("should return a value", () => {
      const instance = new ReactNativeAuthInterface();
      const result = instance.getError();
      expect(result).toBeDefined();
    });
  });

  describe("getAuthState", () => {
    it("should have getAuthState method", () => {
      const instance = new ReactNativeAuthInterface();
      expect(typeof instance.getAuthState).toBe("function");
    });

    it("should return a value", () => {
      const instance = new ReactNativeAuthInterface();
      const result = instance.getAuthState();
      expect(result).toBeDefined();
    });
  });

  describe("subscribe", () => {
    it("should have subscribe method", () => {
      const instance = new ReactNativeAuthInterface();
      expect(typeof instance.subscribe).toBe("function");
    });

    it("should return a value", () => {
      const instance = new ReactNativeAuthInterface();
      const callback = (state: any) => console.log(state);
      const result = instance.subscribe(callback);
      expect(result).toBeDefined();
    });
  });

  describe("navigation methods", () => {
    it("should have goToLogin method", () => {
      const instance = new ReactNativeAuthInterface();
      expect(typeof instance.goToLogin).toBe("function");
    });

    it("should execute without error", () => {
      const instance = new ReactNativeAuthInterface();
      expect(() => instance.goToLogin()).not.toThrow();
    });

    it("should have goToRegister method", () => {
      const instance = new ReactNativeAuthInterface();
      expect(typeof instance.goToRegister).toBe("function");
    });

    it("should execute without error", () => {
      const instance = new ReactNativeAuthInterface();
      expect(() => instance.goToRegister()).not.toThrow();
    });

    it("should have goToForgotPassword method", () => {
      const instance = new ReactNativeAuthInterface();
      expect(typeof instance.goToForgotPassword).toBe("function");
    });

    it("should execute without error", () => {
      const instance = new ReactNativeAuthInterface();
      expect(() => instance.goToForgotPassword()).not.toThrow();
    });

    it("should have cancel method", () => {
      const instance = new ReactNativeAuthInterface();
      expect(typeof instance.cancel).toBe("function");
    });

    it("should execute without error", () => {
      const instance = new ReactNativeAuthInterface();
      expect(() => instance.cancel()).not.toThrow();
    });
  });

  describe("interface completeness", () => {
    it("should have all required public methods", () => {
      const instance = new ReactNativeAuthInterface();
      const methods = [
        "login",
        "register",
        "requestPasswordReset",
        "verifyOtp",
        "completePasswordReset",
        "completeRegistration",
        "checkSession",
        "logout",
        "refresh",
        "changePassword",
        "deleteAccount",
        "getCurrentSession",
        "isLoggedIn",
        "isLoading",
        "hasError",
        "getError",
        "getAuthState",
        "subscribe",
        "goToLogin",
        "goToRegister",
        "goToForgotPassword",
        "cancel",
      ];

      for (const method of methods) {
        expect(typeof instance[method as keyof ReactNativeAuthInterface]).toBe(
          "function",
        );
      }
    });

    it("should have methods that return promises", () => {
      const instance = new ReactNativeAuthInterface();
      const payload = {
        email: "test@example.com",
        password: "password123",
      };

      const result = instance.login(payload);
      expect(result instanceof Promise).toBe(true);
    });
  });

  describe("error handling for not implemented methods", () => {
    it("changePassword should reject with proper error", async () => {
      const instance = new ReactNativeAuthInterface();
      try {
        await instance.changePassword({
          email: "test@example.com",
          newPassword: "newpass",
        });
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Method not implemented");
      }
    });

    it("deleteAccount should reject with proper error", async () => {
      const instance = new ReactNativeAuthInterface();
      try {
        await instance.deleteAccount({
          email: "test@example.com",
        });
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Method not implemented");
      }
    });
  });
});
