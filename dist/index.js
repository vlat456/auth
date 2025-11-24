"use strict";
/**
 * Main entry point for the Auth library
 * Exports the React Native interface and core types
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactNativeAuthInterface = void 0;
var ReactNativeAuthInterface_1 = require("./ReactNativeAuthInterface");
Object.defineProperty(exports, "ReactNativeAuthInterface", { enumerable: true, get: function () { return ReactNativeAuthInterface_1.ReactNativeAuthInterface; } });
__exportStar(require("./features/auth/types"), exports);
__exportStar(require("./features/auth/machine/authMachine"), exports);
