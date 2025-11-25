"use strict";
/**
 * Tests for React Native Auth Interface
 */
Object.defineProperty(exports, "__esModule", { value: true });
const ReactNativeAuthInterface_1 = require("./ReactNativeAuthInterface");
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
            const instance = new ReactNativeAuthInterface_1.ReactNativeAuthInterface();
            expect(instance).toBeDefined();
        });
        it("should initialize with custom API URL", () => {
            const customURL = "https://custom-api.example.com";
            const instance = new ReactNativeAuthInterface_1.ReactNativeAuthInterface(customURL);
            expect(instance).toBeDefined();
        });
    });
    describe("login", () => {
        it("should have login method", () => {
            const instance = new ReactNativeAuthInterface_1.ReactNativeAuthInterface();
            expect(typeof instance.login).toBe("function");
        });
        it("should be async method", () => {
            const instance = new ReactNativeAuthInterface_1.ReactNativeAuthInterface();
            const result = instance.login({
                email: "test@example.com",
                password: "password123",
            });
            expect(result).toBeInstanceOf(Promise);
        });
    });
    describe("register", () => {
        it("should have register method", () => {
            const instance = new ReactNativeAuthInterface_1.ReactNativeAuthInterface();
            expect(typeof instance.register).toBe("function");
        });
    });
    describe("requestPasswordReset", () => {
        it("should have requestPasswordReset method", () => {
            const instance = new ReactNativeAuthInterface_1.ReactNativeAuthInterface();
            expect(typeof instance.requestPasswordReset).toBe("function");
        });
    });
    describe("verifyOtp", () => {
        it("should have verifyOtp method", () => {
            const instance = new ReactNativeAuthInterface_1.ReactNativeAuthInterface();
            expect(typeof instance.verifyOtp).toBe("function");
        });
    });
    describe("completePasswordReset", () => {
        it("should have completePasswordReset method", () => {
            const instance = new ReactNativeAuthInterface_1.ReactNativeAuthInterface();
            expect(typeof instance.completePasswordReset).toBe("function");
        });
    });
    describe("completeRegistration", () => {
        it("should have completeRegistration method", () => {
            const instance = new ReactNativeAuthInterface_1.ReactNativeAuthInterface();
            expect(typeof instance.completeRegistration).toBe("function");
        });
    });
    describe("checkSession", () => {
        it("should have checkSession method", () => {
            const instance = new ReactNativeAuthInterface_1.ReactNativeAuthInterface();
            expect(typeof instance.checkSession).toBe("function");
        });
    });
    describe("logout", () => {
        it("should have logout method", () => {
            const instance = new ReactNativeAuthInterface_1.ReactNativeAuthInterface();
            expect(typeof instance.logout).toBe("function");
        });
    });
    describe("refresh", () => {
        it("should have refresh method", () => {
            const instance = new ReactNativeAuthInterface_1.ReactNativeAuthInterface();
            expect(typeof instance.refresh).toBe("function");
        });
    });
    describe("changePassword", () => {
        it("should throw not implemented error", async () => {
            const instance = new ReactNativeAuthInterface_1.ReactNativeAuthInterface();
            const payload = {
                email: "test@example.com",
                newPassword: "newpassword123",
            };
            await expect(instance.changePassword(payload)).rejects.toThrow("Method not implemented");
        });
    });
    describe("deleteAccount", () => {
        it("should throw not implemented error", async () => {
            const instance = new ReactNativeAuthInterface_1.ReactNativeAuthInterface();
            const payload = { email: "test@example.com" };
            await expect(instance.deleteAccount(payload)).rejects.toThrow("Method not implemented");
        });
    });
    describe("getCurrentSession", () => {
        it("should have getCurrentSession method", () => {
            const instance = new ReactNativeAuthInterface_1.ReactNativeAuthInterface();
            expect(typeof instance.getCurrentSession).toBe("function");
        });
    });
    describe("interface completeness", () => {
        it("should have all required public methods", () => {
            const instance = new ReactNativeAuthInterface_1.ReactNativeAuthInterface();
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
            ];
            for (const method of methods) {
                expect(typeof instance[method]).toBe("function");
            }
        });
        it("should have methods that return promises", () => {
            const instance = new ReactNativeAuthInterface_1.ReactNativeAuthInterface();
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
            const instance = new ReactNativeAuthInterface_1.ReactNativeAuthInterface();
            try {
                await instance.changePassword({
                    email: "test@example.com",
                    newPassword: "newpass",
                });
                fail("Should have thrown");
            }
            catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toBe("Method not implemented");
            }
        });
        it("deleteAccount should reject with proper error", async () => {
            const instance = new ReactNativeAuthInterface_1.ReactNativeAuthInterface();
            try {
                await instance.deleteAccount({
                    email: "test@example.com",
                });
                fail("Should have thrown");
            }
            catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toBe("Method not implemented");
            }
        });
    });
});
