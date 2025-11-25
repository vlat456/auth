/**
 * Path: src/features/auth/service/authService.ts
 * Authentication service that manages the auth machine instance
 */

import { interpret, ActorRefFrom } from 'xstate';
import { createAuthMachine } from '../machine/authMachine';
import { IAuthRepository } from '../types';
import { SimplifiedAuthRepository } from '../repositories/SimplifiedAuthRepository';
import { AuthContext, AuthEvent } from '../machine/authMachine';

// Define the auth service class that will manage the machine
export class AuthService {
  private authService: ActorRefFrom<ReturnType<typeof createAuthMachine>>;
  private repository: IAuthRepository;

  constructor(repository: IAuthRepository) {
    this.repository = repository;
    this.authService = interpret(createAuthMachine(this.repository));
    this.authService.start(); // Start the service
  }

  // Get the current state of the authentication machine
  getSnapshot() {
    return this.authService.getSnapshot();
  }

  // Subscribe to state changes
  subscribe(callback: (state: any) => void) {
    return this.authService.subscribe(callback);
  }

  // Send an event to the authentication machine
  send(event: AuthEvent) {
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