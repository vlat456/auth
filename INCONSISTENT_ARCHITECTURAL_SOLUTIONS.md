# Architectural Inconsistency Report

## Summary of Findings

The project suffers from a major architectural inconsistency: it maintains two parallel and redundant implementations of the core authentication logic. The documentation and file structure suggest a modern, robust architecture based on an XState state machine (`authMachine.ts`), but the live code completely ignores this and instead uses a complex, manually-implemented state management system within `AuthRepository.ts`.

This has led to several problems:

1.  **Redundant & Dead Code:** The entire `authMachine.ts` is effectively dead code, increasing maintenance overhead and causing confusion for developers who expect it to be the source of truth.
2.  **Overly Complex Logic:** The manual session management in `AuthRepository.ts` is spread across multiple, intertwined methods (`checkSession`, `validateAndRefreshSessionIfNeeded`, `handleExpiredSession`, etc.), making it difficult to understand, maintain, and debug.
3.  **Inconsistent Behavior:** The complexity of the manual implementation has introduced bugs and inconsistencies, such as non-uniform error handling (some methods throw custom errors, others return null or log warnings) and a token refresh mechanism that can lead to valid sessions with stale user profile data.
4.  **Flawed Public API:** The main entry point, `ReactNativeAuthInterface.ts`, is a facade with flaws. It contains unimplemented methods, a misleadingly named method (`getCurrentSession`), and is tightly coupled to its dependencies, violating the principle of dependency injection and making it hard to test.

The recommended course of action is to undertake a refactoring to eliminate the redundant `AuthRepository` logic and properly integrate the `authMachine`. This would align the actual architecture with the intended design, significantly simplify the codebase, and resolve the associated inconsistencies and bugs.

## Relevant Locations

### 1. `src/features/auth/repositories/AuthRepository.ts`

*   **Reasoning:** This file contains the core authentication logic that is actually being used by the application. It features a complex, manual implementation of session and state management, which is the source of several inconsistencies. It directly contradicts the project's stated architecture of using a state machine.
*   **Key Symbols:** `AuthRepository`, `checkSession`, `refresh`, `isTokenExpired`

### 2. `src/features/auth/machine/authMachine.ts`

*   **Reasoning:** This file contains a well-defined XState state machine that models the entire authentication flow. However, it is completely unused and represents a parallel, dead-code implementation of the logic found in AuthRepository.ts. This is the most significant architectural inconsistency.
*   **Key Symbols:** `createAuthMachine`

### 3. `src/ReactNativeAuthInterface.ts`

*   **Reasoning:** This is the public facade for the library. It contains several architectural flaws: it has unimplemented stub methods, a misleading method implementation (getCurrentSession), and it is tightly coupled to the AuthRepository via direct instantiation, which prevents dependency injection and makes testing difficult.
*   **Key Symbols:** `ReactNativeAuthInterface`, `changePassword`, `deleteAccount`, `getCurrentSession`

### 4. `src/features/auth/utils/errorHandler.ts`

*   **Reasoning:** This file contains a robust error-handling system that was clearly designed to be used with the state machine (as per comments). Its inconsistent application within AuthRepository.ts (where some errors are handled differently) is a symptom of the larger architectural schism.
*   **Key Symbols:** `withErrorHandling`, `handleApiError`

## Architectural Improvement Suggestions

This section provides concrete examples and a path forward for refactoring the codebase to resolve the inconsistencies mentioned above. The core principle is to establish the `authMachine` as the single source of truth for all authentication state and logic.

### 1. Simplify `AuthRepository` to a Stateless API Layer

The `AuthRepository` should be responsible *only* for communicating with the backend API. It should not contain any stateful logic like checking if a token is expired or managing refresh locks. This logic belongs in the state machine.

**Example: Simplifying the `refresh` logic**

Currently, the repository contains complex logic to handle session refreshes. This should be reduced to a simple API call.

**Before (`AuthRepository.ts`):**
```typescript
// In AuthRepository.ts
private isRefreshing = false;

public async validateAndRefreshSessionIfNeeded(session: IAuthSession | null): Promise<IAuthSession | null> {
  if (!session) {
    return null;
  }

  if (this.isTokenExpired(session.accessToken)) {
    if (this.isRefreshing) {
      // Avoid race conditions by waiting for the ongoing refresh
      await this.waitForRefresh();
      // After waiting, the session should be updated by the other process
      return this.storage.getSession();
    }
    return this.handleExpiredSession(session);
  }

  return session;
}

private async handleExpiredSession(session: IAuthSession): Promise<IAuthSession | null> {
  try {
    return await this.refresh(session.refreshToken);
  } catch (error) {
    // If refresh fails, logout
    await this.logout();
    return null;
  }
}
```

**After (`AuthRepository.ts`):**
The repository's `refresh` method becomes a direct, stateless API call. All conditional logic is removed.

```typescript
// In AuthRepository.ts - The ONLY refresh-related method needed
public async refresh(refreshToken: string): Promise<IAuthSession> {
  try {
    const response = await this.apiClient.post<IAuthSession>('/auth/refresh', { refreshToken });
    const newSession = response.data;

    // Persist the new session
    await this.storage.saveSession(newSession);
    
    return newSession;
  } catch (error) {
    // Let the caller (the state machine) handle the error
    await this.storage.clearSession();
    throw new ApiError('REFRESH_FAILED', 'Session refresh failed.');
  }
}
```

### 2. Centralize Logic within `authMachine`

The `authMachine` should orchestrate all actions and state transitions. It will invoke the simplified `AuthRepository` methods to perform side effects like API calls.

**Example: Invoking the repository from the machine**

The machine definition will describe *how* and *when* to call the repository's methods.

**`authMachine.ts` integration:**
```typescript
// In createAuthMachine
createMachine({
  // ... machine config
  context: {
    authRepository: //... injected instance
    session: undefined,
    error: undefined,
  },
  states: {
    authenticated: {
      invoke: {
        // Periodically check if the token needs a refresh
        src: 'tokenRefreshChecker',
      },
      on: {
        REFRESH: 'refreshing',
        LOGOUT: 'loggingOut',
      }
    },
    refreshing: {
      invoke: {
        id: 'refresh-token',
        src: (context) => context.authRepository.refresh(context.session.refreshToken),
        onDone: {
          target: 'authenticated',
          actions: assign({
            session: (_, event) => event.data // Update session from event data
          })
        },
        onError: {
          target: 'unauthenticated', // Go to unauthenticated state if refresh fails
          actions: assign({
            session: undefined,
            error: (_, event) => event.data
          })
        }
      }
    }
    // ... other states like 'loggingIn', 'loggingOut'
  }
})
```

### 3. Refactor `ReactNativeAuthInterface` for Dependency Injection

The public interface should be a thin wrapper around the `authMachine`. It should not create its own dependencies. Instead, they should be provided to it (Dependency Injection), making the interface easy to test and configure.

**Before (`ReactNativeAuthInterface.ts`):**
```typescript
// In ReactNativeAuthInterface.ts
export class ReactNativeAuthInterface {
  private readonly authRepository: IAuthRepository;
  private readonly storage: IStorage;

  constructor() {
    this.storage = new ReactNativeStorage();
    // TIGHT COUPLING: The interface creates its own dependency.
    this.authRepository = new AuthRepository(this.storage); 
  }

  public async getCurrentSession(): Promise<IAuthSession | null> {
    // Complex, manual session checking
    const session = await this.storage.getSession();
    return this.authRepository.validateAndRefreshSessionIfNeeded(session);
  }
}
```

**After (`ReactNativeAuthInterface.ts`):**
The `ReactNativeAuthInterface` now accepts a running instance of the state machine (`AuthService`) and dispatches events or reads state from it.

```typescript
// In a new file, e.g., authService.ts
import { createAuthMachine } from './machine/authMachine';
import { interpret } from 'xstate';

// The service would be a singleton instance in your app
export const authService = interpret(createAuthMachine(/* pass deps here */)).start();

// In ReactNativeAuthInterface.ts
import { authService } from './authService'; // Import the running service

export class ReactNativeAuthInterface {
  // The service is now the dependency
  private readonly authService: typeof authService;

  constructor() {
    // DECOUPLED: The interface uses a shared, injected service.
    this.authService = authService;
  }

  public getCurrentSession(): IAuthSession | undefined {
    // State is read directly from the machine's context
    return this.authService.getSnapshot().context.session;
  }
  
  public getAuthState(): string {
    // Easily get the current state, e.g., 'authenticated', 'unauthenticated'
    return this.authService.getSnapshot().value;
  }

  public login(credentials: ICredentials) {
    // Actions are just events sent to the machine
    this.authService.send({ type: 'LOGIN', credentials });
  }

  public logout() {
    this.authService.send({ type: 'LOGOUT' });
  }
}

---

## Refactoring Follow-up (2025-11-25): New Inconsistencies

A refactoring effort was made to address the issues outlined above. While it successfully introduced the `authMachine` as the central controller for authentication logic, it failed to complete the cleanup and introduced several new architectural flaws.

### 1. **New Flaw: Incomplete Simplification of the Active Repository**

The `SimplifiedAuthRepository` is an improvement but still violates the core principle of being a stateless API layer.

*   **Stateful Logic in `refresh`:** The `refresh` method contains business logic to fetch a fresh user profile after a token refresh.
    ```typescript
    // In SimplifiedAuthRepository.ts
    // ...
    // Fetch fresh profile data using the new access token
    let freshProfile: UserProfile | undefined;
    try {
      const profileResponse = await this.apiClient.get<UserProfile>(
        "/auth/me",
        {
          headers: { Authorization: `Bearer ${newAccessToken}` },
        },
      );
    //...
    ```
    This logic belongs in the `authMachine`. The repository's responsibility should end at refreshing the token and returning the new session data. The state machine should then decide whether a subsequent profile fetch is required.

### 2. **New Flaw: Loosely Typed State Machine Interactions**

The refactored `ReactNativeAuthInterface.ts` now interacts with the `authService`. However, these interactions are not strongly typed.

*   **Use of `any`:** The subscription callbacks use `any` to type the state object from the machine.
    ```typescript
    // In ReactNativeAuthInterface.ts
    const subscription = this.authService.subscribe((state: any) => {
      // ...
    });
    ```
    This undermines the safety and predictability that TypeScript and XState are meant to provide. The machine's state schema is well-defined and should be used to type these interactions.

## Final Recommendations to Complete the Refactoring

1.  **Complete the Simplification:**
    *   Refactor the `refresh` method in the new `AuthRepository.ts` (formerly `SimplifiedAuthRepository.ts`) to remove the profile-fetching logic. It should only be responsible for the `/auth/refresh-token` API call and persisting the new session.
    *   Update the `authMachine` to orchestrate the profile fetch as a separate step after a successful token refresh.

2.  **Enforce Strong Typing:**
    *   In `ReactNativeAuthInterface.ts`, replace `any` with the proper type for the machine's state snapshot (e.g., `SnapshotFrom<typeof authMachine>`). This will provide full type safety and autocompletion for state and context values.
```