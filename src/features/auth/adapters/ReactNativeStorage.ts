/**
 * Path: src/features/auth/adapters/ReactNativeStorage.ts
 * Version: 0.1.0
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { IStorage } from "../types";

export const ReactNativeStorage: IStorage = {
  getItem: async (key) => {
    return await AsyncStorage.getItem(key);
  },
  setItem: async (key, value) => {
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key) => {
    await AsyncStorage.removeItem(key);
  },
};
