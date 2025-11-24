# Gemini Project Context: @your-app/auth-logic

This file provides context for the Gemini AI assistant to understand and effectively assist with this project.

## Project Overview

This project is a decoupled authentication logic library for a TypeScript application. It uses **XState** to manage complex authentication flows as a state machine and follows the **Repository Pattern** to separate business logic from data access.

The core of the project is the `authMachine`, which handles:
- User login and registration with OTP verification
- Session checking with JWT handling and refresh token support
- A full "forgot password" flow, including OTP verification and password reset
- Complete registration flow after OTP verification
- User logout

The `AuthRepository` class implements the data access layer and communicates with a backend API via `axios`. It is designed to be platform-agnostic, using a generic `IStorage` interface for session token persistence, which can be implemented with `async-storage` on React Native or `localStorage` on the web.

The project also includes utility functions for error handling and safe data access, with comprehensive type safety throughout.

## Key Technologies

- **TypeScript** for type safety
- **XState** for state management
- **Jest** for testing
- **Axios** for HTTP requests
- **Repository Pattern** for data access abstraction
- **Dependency Injection** for testability and flexibility

## Building and Running

### Prerequisites

- Node.js
- npm or yarn

### Scripts

The following scripts are available in `package.json`:

- **`npm test`**: Runs the test suite using Jest.
- **`npm run test:watch`**: Runs the tests in watch mode.
- **`npm run test:coverage`**: Generates a test coverage report.
- **`npm run build`**: Compiles the TypeScript code into JavaScript.

## Development Conventions

### Architecture

- **Feature-Based Structure**: The code is organized by features (e.g., `auth`).
- **State Machine**: The core logic is encapsulated in an XState machine (`authMachine.ts`), making the flow of control explicit and easy to visualize.
- **Repository Pattern**: Data access and API communication are handled by the `AuthRepository`, which is injected into the state machine. This decouples the state logic from the implementation details of the backend.
- **Dependency Injection**: The `AuthRepository` and a storage adapter (`IStorage`) are injected, allowing for easy mocking in tests and platform-specific implementations.
- **Utility Functions**: Safe data access and error handling utilities are provided in the `utils` directory.

### Testing

- **Unit Tests**: Tests are written with Jest and are co-located with the source files (e.g., `authMachine.test.ts`).
- **Mocking**: Dependencies like the `AuthRepository` are mocked in tests to isolate the logic being tested.
- **Comprehensive Coverage**: Includes tests for all authentication flows, error handling, JWT validation, and token refresh scenarios.
- **Test Suites**: Organized into three main test suites: Auth Machine, Auth Repository, and Error Handler utilities.

### Coding Style

- **TypeScript**: The project uses TypeScript for all its code, enforcing type safety.
- **Interfaces**: Interfaces are used to define contracts for data structures (`User`, `LoginPayload`) and services (`IAuthRepository`, `IStorage`).
- **Functional Utilities**: Utility functions for safe data access and error handling are provided to prevent runtime errors.
- **Async Operations**: All side effects are handled as async operations within the XState machine using `fromPromise`.

## Key Features

### Authentication Flows
- Standard login flow with error handling
- OTP-based registration flow with email verification
- Complete registration with action tokens
- Multi-step forgot password flow with OTP verification
- Session management with JWT validation and refresh tokens
- Secure logout mechanism

### Security Considerations
- JWT expiration checking with both local and server-side validation
- Secure token storage with refresh token support
- Safe data access utilities to prevent runtime errors
- Proper error handling to avoid exposing sensitive information

### Error Handling
- Comprehensive error handling utilities for API responses
- Graceful degradation for network and server errors
- User-friendly error messages
- Fallback strategies for various failure scenarios

### Session Management
- Automatic session checking and validation
- Local JWT expiration checking before server requests
- Automatic token refresh using refresh tokens
- Proper cleanup on logout or invalid tokens
