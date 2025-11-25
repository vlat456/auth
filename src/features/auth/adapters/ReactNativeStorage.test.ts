/**
 * Tests for React Native Storage adapter
 */

import { ReactNativeStorage } from "./ReactNativeStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("@react-native-async-storage/async-storage");

describe("ReactNativeStorage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getItem", () => {
    it("should retrieve item from storage", async () => {
      const testValue = "test-value";
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(testValue);

      const result = await ReactNativeStorage.getItem("test-key");

      expect(result).toBe(testValue);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith("test-key");
    });

    it("should return null for missing key", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await ReactNativeStorage.getItem("missing-key");

      expect(result).toBeNull();
    });

    it("should handle different key names", async () => {
      const keys = ["auth-token", "refresh-token", "user-data"];
      
      for (const key of keys) {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(`value-${key}`);
        const result = await ReactNativeStorage.getItem(key);
        expect(result).toBe(`value-${key}`);
        expect(AsyncStorage.getItem).toHaveBeenCalledWith(key);
      }
    });

    it("should handle errors from AsyncStorage", async () => {
      const error = new Error("Storage error");
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(error);

      await expect(ReactNativeStorage.getItem("key")).rejects.toThrow(error);
    });

    it("should return JSON string values unchanged", async () => {
      const jsonValue = JSON.stringify({ id: "123", name: "Test" });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(jsonValue);

      const result = await ReactNativeStorage.getItem("json-key");

      expect(result).toBe(jsonValue);
    });
  });

  describe("setItem", () => {
    it("should store item in storage", async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await ReactNativeStorage.setItem("test-key", "test-value");

      expect(AsyncStorage.setItem).toHaveBeenCalledWith("test-key", "test-value");
    });

    it("should handle JSON values", async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      const jsonValue = JSON.stringify({ token: "abc123" });

      await ReactNativeStorage.setItem("auth-session", jsonValue);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith("auth-session", jsonValue);
    });

    it("should handle empty string values", async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await ReactNativeStorage.setItem("empty-key", "");

      expect(AsyncStorage.setItem).toHaveBeenCalledWith("empty-key", "");
    });

    it("should handle long values", async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      const longValue = "x".repeat(10000);

      await ReactNativeStorage.setItem("long-key", longValue);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith("long-key", longValue);
    });

    it("should handle errors from AsyncStorage", async () => {
      const error = new Error("Storage error");
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(error);

      await expect(
        ReactNativeStorage.setItem("key", "value"),
      ).rejects.toThrow(error);
    });

    it("should handle multiple sequential writes", async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await ReactNativeStorage.setItem("key1", "value1");
      await ReactNativeStorage.setItem("key2", "value2");
      await ReactNativeStorage.setItem("key3", "value3");

      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(3);
    });
  });

  describe("removeItem", () => {
    it("should remove item from storage", async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await ReactNativeStorage.removeItem("test-key");

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith("test-key");
    });

    it("should handle removal of non-existent keys", async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await ReactNativeStorage.removeItem("non-existent-key");

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith("non-existent-key");
    });

    it("should handle different key names", async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
      const keys = ["auth-token", "refresh-token", "user-data"];

      for (const key of keys) {
        await ReactNativeStorage.removeItem(key);
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith(key);
      }
    });

    it("should handle errors from AsyncStorage", async () => {
      const error = new Error("Storage error");
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(error);

      await expect(ReactNativeStorage.removeItem("key")).rejects.toThrow(error);
    });

    it("should handle multiple sequential removals", async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await ReactNativeStorage.removeItem("key1");
      await ReactNativeStorage.removeItem("key2");
      await ReactNativeStorage.removeItem("key3");

      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(3);
    });
  });

  describe("Storage interface compliance", () => {
    it("should have all required methods", () => {
      expect(typeof ReactNativeStorage.getItem).toBe("function");
      expect(typeof ReactNativeStorage.setItem).toBe("function");
      expect(typeof ReactNativeStorage.removeItem).toBe("function");
    });

    it("should handle CRUD operations in sequence", async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue("stored-value");
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      // Create
      await ReactNativeStorage.setItem("crud-key", "value");
      expect(AsyncStorage.setItem).toHaveBeenCalled();

      // Read
      const retrieved = await ReactNativeStorage.getItem("crud-key");
      expect(retrieved).toBe("stored-value");
      expect(AsyncStorage.getItem).toHaveBeenCalled();

      // Delete
      await ReactNativeStorage.removeItem("crud-key");
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });
  });
});
