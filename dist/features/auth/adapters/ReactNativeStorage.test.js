"use strict";
/**
 * Tests for React Native Storage adapter
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ReactNativeStorage_1 = require("./ReactNativeStorage");
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
jest.mock("@react-native-async-storage/async-storage");
describe("ReactNativeStorage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe("getItem", () => {
        it("should retrieve item from storage", async () => {
            const testValue = "test-value";
            async_storage_1.default.getItem.mockResolvedValue(testValue);
            const result = await ReactNativeStorage_1.ReactNativeStorage.getItem("test-key");
            expect(result).toBe(testValue);
            expect(async_storage_1.default.getItem).toHaveBeenCalledWith("test-key");
        });
        it("should return null for missing key", async () => {
            async_storage_1.default.getItem.mockResolvedValue(null);
            const result = await ReactNativeStorage_1.ReactNativeStorage.getItem("missing-key");
            expect(result).toBeNull();
        });
        it("should handle different key names", async () => {
            const keys = ["auth-token", "refresh-token", "user-data"];
            for (const key of keys) {
                async_storage_1.default.getItem.mockResolvedValueOnce(`value-${key}`);
                const result = await ReactNativeStorage_1.ReactNativeStorage.getItem(key);
                expect(result).toBe(`value-${key}`);
                expect(async_storage_1.default.getItem).toHaveBeenCalledWith(key);
            }
        });
        it("should handle errors from AsyncStorage", async () => {
            const error = new Error("Storage error");
            async_storage_1.default.getItem.mockRejectedValue(error);
            await expect(ReactNativeStorage_1.ReactNativeStorage.getItem("key")).rejects.toThrow(error);
        });
        it("should return JSON string values unchanged", async () => {
            const jsonValue = JSON.stringify({ id: "123", name: "Test" });
            async_storage_1.default.getItem.mockResolvedValue(jsonValue);
            const result = await ReactNativeStorage_1.ReactNativeStorage.getItem("json-key");
            expect(result).toBe(jsonValue);
        });
    });
    describe("setItem", () => {
        it("should store item in storage", async () => {
            async_storage_1.default.setItem.mockResolvedValue(undefined);
            await ReactNativeStorage_1.ReactNativeStorage.setItem("test-key", "test-value");
            expect(async_storage_1.default.setItem).toHaveBeenCalledWith("test-key", "test-value");
        });
        it("should handle JSON values", async () => {
            async_storage_1.default.setItem.mockResolvedValue(undefined);
            const jsonValue = JSON.stringify({ token: "abc123" });
            await ReactNativeStorage_1.ReactNativeStorage.setItem("auth-session", jsonValue);
            expect(async_storage_1.default.setItem).toHaveBeenCalledWith("auth-session", jsonValue);
        });
        it("should handle empty string values", async () => {
            async_storage_1.default.setItem.mockResolvedValue(undefined);
            await ReactNativeStorage_1.ReactNativeStorage.setItem("empty-key", "");
            expect(async_storage_1.default.setItem).toHaveBeenCalledWith("empty-key", "");
        });
        it("should handle long values", async () => {
            async_storage_1.default.setItem.mockResolvedValue(undefined);
            const longValue = "x".repeat(10000);
            await ReactNativeStorage_1.ReactNativeStorage.setItem("long-key", longValue);
            expect(async_storage_1.default.setItem).toHaveBeenCalledWith("long-key", longValue);
        });
        it("should handle errors from AsyncStorage", async () => {
            const error = new Error("Storage error");
            async_storage_1.default.setItem.mockRejectedValue(error);
            await expect(ReactNativeStorage_1.ReactNativeStorage.setItem("key", "value")).rejects.toThrow(error);
        });
        it("should handle multiple sequential writes", async () => {
            async_storage_1.default.setItem.mockResolvedValue(undefined);
            await ReactNativeStorage_1.ReactNativeStorage.setItem("key1", "value1");
            await ReactNativeStorage_1.ReactNativeStorage.setItem("key2", "value2");
            await ReactNativeStorage_1.ReactNativeStorage.setItem("key3", "value3");
            expect(async_storage_1.default.setItem).toHaveBeenCalledTimes(3);
        });
    });
    describe("removeItem", () => {
        it("should remove item from storage", async () => {
            async_storage_1.default.removeItem.mockResolvedValue(undefined);
            await ReactNativeStorage_1.ReactNativeStorage.removeItem("test-key");
            expect(async_storage_1.default.removeItem).toHaveBeenCalledWith("test-key");
        });
        it("should handle removal of non-existent keys", async () => {
            async_storage_1.default.removeItem.mockResolvedValue(undefined);
            await ReactNativeStorage_1.ReactNativeStorage.removeItem("non-existent-key");
            expect(async_storage_1.default.removeItem).toHaveBeenCalledWith("non-existent-key");
        });
        it("should handle different key names", async () => {
            async_storage_1.default.removeItem.mockResolvedValue(undefined);
            const keys = ["auth-token", "refresh-token", "user-data"];
            for (const key of keys) {
                await ReactNativeStorage_1.ReactNativeStorage.removeItem(key);
                expect(async_storage_1.default.removeItem).toHaveBeenCalledWith(key);
            }
        });
        it("should handle errors from AsyncStorage", async () => {
            const error = new Error("Storage error");
            async_storage_1.default.removeItem.mockRejectedValue(error);
            await expect(ReactNativeStorage_1.ReactNativeStorage.removeItem("key")).rejects.toThrow(error);
        });
        it("should handle multiple sequential removals", async () => {
            async_storage_1.default.removeItem.mockResolvedValue(undefined);
            await ReactNativeStorage_1.ReactNativeStorage.removeItem("key1");
            await ReactNativeStorage_1.ReactNativeStorage.removeItem("key2");
            await ReactNativeStorage_1.ReactNativeStorage.removeItem("key3");
            expect(async_storage_1.default.removeItem).toHaveBeenCalledTimes(3);
        });
    });
    describe("Storage interface compliance", () => {
        it("should have all required methods", () => {
            expect(typeof ReactNativeStorage_1.ReactNativeStorage.getItem).toBe("function");
            expect(typeof ReactNativeStorage_1.ReactNativeStorage.setItem).toBe("function");
            expect(typeof ReactNativeStorage_1.ReactNativeStorage.removeItem).toBe("function");
        });
        it("should handle CRUD operations in sequence", async () => {
            async_storage_1.default.setItem.mockResolvedValue(undefined);
            async_storage_1.default.getItem.mockResolvedValue("stored-value");
            async_storage_1.default.removeItem.mockResolvedValue(undefined);
            // Create
            await ReactNativeStorage_1.ReactNativeStorage.setItem("crud-key", "value");
            expect(async_storage_1.default.setItem).toHaveBeenCalled();
            // Read
            const retrieved = await ReactNativeStorage_1.ReactNativeStorage.getItem("crud-key");
            expect(retrieved).toBe("stored-value");
            expect(async_storage_1.default.getItem).toHaveBeenCalled();
            // Delete
            await ReactNativeStorage_1.ReactNativeStorage.removeItem("crud-key");
            expect(async_storage_1.default.removeItem).toHaveBeenCalled();
        });
    });
});
