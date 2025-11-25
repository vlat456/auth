# Gemini Project Context

This file provides context for the Gemini AI assistant to understand and effectively assist with this project.

## Project Overview

This project is a decoupled authentication logic library for TypeScript applications, with a strong focus on React Native. It uses **XState** to manage complex authentication flows as a state machine and follows the **Repository Pattern** and **Dependency Injection** to separate business logic from data access, making it highly modular and testable.

The core of the project is the `authMachine`, which provides a complete and secure solution for managing user authentication, including:
- User login, registration, and session management.
- Robust handling of JWTs with automated token refresh.
- Advanced security features like request retries, rate limiting, and race condition protection for token refreshes.

The `AuthRepository` class implements the data access layer, communicating with a backend API via `axios`. It is designed to be platform-agnostic by using a generic `IStorage` interface for session token persistence, which can be implemented with `async-storage` on React Native or `localStorage` on the web.

## Key Technologies

- **TypeScript** for strict type-safety.
- **XState** for state management and modeling complex authentication flows.
- **Axios** for making HTTP requests to the backend API.
- **Zod** and **validator** for data validation and sanitization.
- **Jest** for unit and integration testing.

## Architecture

The project follows a clean, modular architecture that promotes separation of concerns and reusability:

- **Dependency Injection (DI)**: The core logic (`authMachine`) depends on interfaces (`IAuthRepository`, `IStorage`) rather than concrete implementations. This allows consumers of the library to provide their own repository or storage mechanisms, making the library highly flexible and easy to test.
- **Repository Pattern**: The `AuthRepository` encapsulates all data access and API communication, separating the business logic in the state machine from the implementation details of the backend.
- **Adapter Pattern**: `ReactNativeStorage` is an adapter that makes an external library (like `@react-native-async-storage/async-storage`) conform to the `IStorage` interface defined by the project.
- **Feature-Based Structure**: All authentication-related logic is organized under `src/features/auth`, with clear subdirectories for the state `machine`, `repositories`, `adapters`, `schemas`, and `utils`.

## Development Conventions

- **High Type Safety**: Enforced by a strict `tsconfig.json` and the extensive use of utility types and safe data extraction functions.
- **Robustness and Security**: The `AuthRepository` includes advanced features like request retries with exponential backoff, a mutex to prevent token refresh race conditions, client-side rate limiting, and secure JWT handling.
- **Strict Linting**: A comprehensive ESLint setup enforces high code quality, consistency, and maintainability.
- **API Contract**: The use of Data Transfer Objects (DTOs) in `types.ts` and the presence of an `openapi_schema.json` file suggest a contract-first approach to API integration.

## Key Features

- **Stateful Authentication Logic**: All authentication flows are managed in a predictable and robust XState state machine.
- **Pluggable Storage**: The storage mechanism is abstracted behind an interface, with a default implementation provided for React Native's `AsyncStorage`.
- **Advanced Session Management**: Includes secure JWT handling, automated token refreshing, and protection against common race conditions.
- **Resilient API Communication**: The `AuthRepository` is built with resilience in mind, featuring automated request retries with exponential backoff.
- **Modular and Testable**: The clear separation of concerns and use of dependency injection make the library easy to test and integrate into various application architectures.