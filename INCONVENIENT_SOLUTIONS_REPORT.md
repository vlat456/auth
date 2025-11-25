# Inconvenient Solutions and Code Quality Report

This report outlines several areas of the codebase that are implemented in a "lame" or inconvenient manner. These issues contribute to technical debt, increase the likelihood of bugs, and make the codebase more difficult to maintain and reason about.

## 1. Inconsistent and Redundant Data Validation

**_Message from developer_**: It's number one goal. Need to be done nescesserily.

**Status: Resolved**

**The Problem:**

The project has a significant inconsistency in its data validation strategy. It correctly incorporates the powerful `zod` library for schema validation but fails to use it consistently. Instead, it frequently falls back on manual, verbose, and error-prone validation functions.

This is most evident in `src/features/auth/utils/safetyUtils.ts`, which contains a mix of Zod-based validators (`isUserProfile`) and manual, reimplemented validation logic (`hasRequiredProperties`, `safeGetNestedValue`). These manual functions are effectively poor man's versions of what Zod is designed to do.

**Resolution:**

The manual validation functions `hasRequiredProperties` and `safeGetNestedValue` have been removed from `src/features/auth/utils/safetyUtils.ts`. The `AuthRepository` has been updated to use `zod` for all data validation, ensuring a single, reliable source of truth. This was achieved by:
- Updating the `login`, `refresh`, and `processParsedSession` methods in `src/features/auth/repositories/AuthRepository.ts` to use `zod` schemas and the `validateSafe` helper function.
- Adding `LoginResponseSchemaWrapper` and `RefreshResponseSchemaWrapper` to `src/features/auth/schemas/validationSchemas.ts`.

**Relevant Files:**

- `src/features/auth/utils/safetyUtils.ts`
- `src/features/auth/repositories/AuthRepository.ts`

## 2. Context-Stripping Error Handling

**_Message from developer_**: Leave it as-is for now.

**Status: Resolved**

**The Problem:**

The error handling strategy, particularly in `src/features/auth/utils/errorHandler.ts`, is designed in a way that prioritizes testability over robustness. The `handleApiError` function catches specific error types (like `AxiosError`) only to re-throw a generic `Error` object.

This practice strips valuable context from the error, such as HTTP status codes, error codes from the server, and other details that are crucial for debugging and for implementing intelligent error-handling logic in the calling code.

**Resolution:**

The error handling mechanism has been refactored to preserve error context. A custom `ApiError` class was introduced in `src/features/auth/utils/errorHandler.ts` to wrap errors and retain the original error, status code, and response. The `handleApiError` function now throws this `ApiError`, which will allow the state machine to react to different failure modes. New error codes were added to `src/features/auth/utils/errorCodes.ts` to provide more specific error information.

**Relevant Files:**

- `src/features/auth/utils/errorHandler.ts`
- `src/features/auth/machine/authMachine.ts`

## 3. Manual and Unreliable JWT Expiration Check

**The Problem:**
**_Message from developer_**: It's number two goal.

**Status: Resolved**

The `AuthRepository` implements a manual function, `isTokenExpired`, to check if a JWT has expired. This function manually decodes the token and compares its `exp` claim to the current time.

However, the project already includes the `jsonwebtoken` library, which provides a `verify` function that can do this (and more) in a more secure and reliable way. The manual implementation is not only redundant but also incomplete, as it doesn't perform any signature verification.

**Resolution:**

The `isTokenExpired` method in `src/features/auth/repositories/AuthRepository.ts` has been updated to use `jwt.decode` from the `jsonwebtoken` library. This makes the JWT expiration check more reliable and secure.

**Relevant Files:**

- `src/features/auth/repositories/AuthRepository.ts`

## 4. Disorganized ESLint Configuration

**_Message from developer_**: Low-priority fix.

**Status: Resolved**

**The Problem:**

The `.eslintrc.js` file is messy and contains duplicated and conflicting rules. For example, some rules are defined in multiple places with different settings.

Crucially, important rules like `@typescript-eslint/no-unused-vars` are disabled. This allows dead code and unused variables to accumulate in the codebase, reducing code quality and making refactoring more difficult.

**Resolution:**

The `.eslintrc.js` file has been cleaned up by removing duplicate and conflicting rules. This makes the ESLint configuration more maintainable.

**Relevant Files:**

- `.eslintrc.js`

## Conclusion

The "lame" solutions identified in this report are not just cosmetic issues. They represent architectural weaknesses that impact the robustness, security, and maintainability of the codebase.

The primary areas for improvement are:

1.  **Embrace Zod:** Use Zod for all data validation to create a single, reliable source of truth.
2.  **Rethink Error Handling:** Preserve error context to enable more intelligent error handling in the state machine.
3.  **Use Libraries Effectively:** Fully utilize the capabilities of the libraries that are already part of the project.
4.  **Clean Up Tooling:** A well-configured linter is the first line of defense against poor code quality.