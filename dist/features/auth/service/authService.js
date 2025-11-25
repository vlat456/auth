"use strict";
/**
 * Path: src/features/auth/service/authService.ts
 * Authentication service that manages the auth machine instance
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const xstate_1 = require("xstate");
const authMachine_1 = require("../machine/authMachine");
// Define the auth service class that will manage the machine
class AuthService {
    constructor(repository) {
        this.repository = repository;
        const machine = (0, authMachine_1.createAuthMachine)(this.repository);
        this.authService = (0, xstate_1.interpret)(machine);
        this.authService.start(); // Start the service
    }
    // Get the current state of the authentication machine
    getSnapshot() {
        return this.authService.getSnapshot();
    }
    // Subscribe to state changes
    subscribe(callback) {
        return this.authService.subscribe(callback);
    }
    // Send an event to the authentication machine
    send(event) {
        this.authService.send(event);
    }
    // Get the current session from the machine context
    getSession() {
        return this.getSnapshot().context.session;
    }
    // Get the current authentication state (e.g., 'authorized', 'unauthorized')
    getAuthState() {
        return this.getSnapshot().value;
    }
    // Stop the service when no longer needed
    stop() {
        this.authService.stop();
    }
}
exports.AuthService = AuthService;
