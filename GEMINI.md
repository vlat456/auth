# Gemini Project Context: @your-app/auth-logic

This file provides context for the Gemini AI assistant to understand and effectively assist with this project.

## Project Overview

This project is a decoupled authentication logic library for a TypeScript application. It uses **XState** to manage complex authentication flows as a state machine and follows the **Repository Pattern** to separate business logic from data access.

The core of the project is the `authMachine`, which handles:
- User login and registration
- Session checking
- A full "forgot password" flow, including OTP verification and password reset
- User logout

The `AuthRepository` class consumes this logic and communicates with a backend API via `axios`. It is designed to be platform-agnostic, using a generic `IStorage` interface for session token persistence, which can be implemented with `async-storage` on React Native or `localStorage` on the web.

## Key Technologies

- **TypeScript** for type safety
- **XState** for state management
- **Jest** for testing
- **Axios** for HTTP requests

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

### Testing

- **Unit Tests**: Tests are written with Jest and are co-located with the source files (e.g., `authMachine.test.ts`).
- **Mocking**: Dependencies like the `AuthRepository` are mocked in tests to isolate the logic being tested.

### Coding Style

- **TypeScript**: The project uses TypeScript for all its code, enforcing type safety.
- **Interfaces**: Interfaces are used to define contracts for data structures (`User`, `LoginPayload`) and services (`IAuthRepository`, `IStorage`).
