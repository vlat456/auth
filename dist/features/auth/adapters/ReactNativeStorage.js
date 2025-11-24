"use strict";
/**
 * Path: src/features/auth/adapters/ReactNativeStorage.ts
 * Version: 0.1.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactNativeStorage = void 0;
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
exports.ReactNativeStorage = {
    getItem: async (key) => {
        return await async_storage_1.default.getItem(key);
    },
    setItem: async (key, value) => {
        await async_storage_1.default.setItem(key, value);
    },
    removeItem: async (key) => {
        await async_storage_1.default.removeItem(key);
    },
};
