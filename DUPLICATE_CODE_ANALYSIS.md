# Duplicate Code Analysis Report

## Overview
This report identifies duplicate and extractable functionality in the authentication library codebase. The analysis focused on finding repeated patterns that could be extracted into reusable functions or components.

## Findings

### 1. Safe Extraction Functions

**Location**: `/src/features/auth/utils/safetyUtils.ts`

**Issue**: Multiple similar functions following the same pattern for extracting specific values from event payloads.

**Current Implementation**:
```typescript
export function safeExtractEmail(event: AuthEvent): string | undefined {
  return safeExtractStringFromPayload(event, "email");
}

export function safeExtractOtp(event: AuthEvent): string | undefined {
  return safeExtractStringFromPayload(event, "otp");
}

export function safeExtractNewPassword(event: AuthEvent): string | undefined {
  return safeExtractStringFromPayload(event, "newPassword");
}
```

**Recommendation**: Extract a generic function:
```typescript
export function safeExtractValue<T extends string | number | boolean>(
  event: AuthEvent, 
  key: string, 
  typeGuard?: (value: unknown) => value is T
): T | undefined {
  // Generic extraction logic here
}
```

### 2. Input Sanitization Functions

**Location**: `/src/features/auth/schemas/validationSchemas.ts` and `/src/features/auth/utils/sanitizationUtils.ts`

**Issue**: Duplicate sanitization logic exists in both the validation schemas and the deprecated sanitization utilities file.

**Current Implementation**:
```typescript
// In validationSchemas.ts
const sanitizeEmail = (email: string): string => {
  if (typeof email !== 'string') {
    return '';
  }
  return email.toLowerCase().trim().substring(0, 254);
};

// In sanitizationUtils.ts (DEPRECATED)
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return '';
  }
  const normalized = validator.normalizeEmail(email);
  return normalized || '';
}
```

**Recommendation**: 
- Remove the deprecated sanitizationUtils.ts file
- Consolidate all sanitization logic in validationSchemas.ts
- Ensure consistency in sanitization methods

### 3. Rate Limiting Implementation

**Location**: `/src/features/auth/repositories/AuthRepository.ts`

**Issue**: The same rate limiting pattern is repeated across multiple methods (login, register, requestPasswordReset).

**Current Implementation**:
```typescript
// In login method
const emailKey = `login_${payload.email}`;
const rateLimitResult = authRateLimiter.check(emailKey, DEFAULT_RATE_LIMITS.login);
if (!rateLimitResult.allowed) {
  throw new Error("Too many login attempts. Please try again later.");
}

// In register method
const emailKey = `register_${payload.email}`;
const rateLimitResult = authRateLimiter.check(emailKey, DEFAULT_RATE_LIMITS.registration);
if (!rateLimitResult.allowed) {
  throw new Error("Too many registration attempts. Please try again later.");
}
```

**Recommendation**: Create a higher-order function or decorator for rate limiting:
```typescript
const withRateLimiting = (keyPrefix: string, rateLimitConfig: RateLimitOptions) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const email = args[0].email; // Assuming first param has email
      const key = `${keyPrefix}_${email}`;
      const rateLimitResult = authRateLimiter.check(key, rateLimitConfig);
      
      if (!rateLimitResult.allowed) {
        throw new Error(`Too many ${keyPrefix} attempts. Please try again later.`);
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
};
```

### 4. Session Handling Logic

**Location**: `/src/features/auth/repositories/AuthRepository.ts`

**Issue**: Similar session handling patterns across multiple methods (checking, reading, saving, validating).

**Current Implementation**:
```typescript
// In multiple methods
const session = await this.readSession();
if (!session) return null;

if (this.isTokenExpired(session.accessToken)) {
  return await this.handleExpiredSession(session);
}

return await this.validateSessionWithServer(session);
```

**Recommendation**: Create a unified session management service:
```typescript
class SessionManager {
  constructor(private storage: IStorage) {}
  
  async validateSession(): Promise<AuthSession | null> {
    // Common validation logic
  }
  
  async refreshSessionIfExpired(session: AuthSession): Promise<AuthSession | null> {
    // Common refresh logic
  }
}
```

### 5. Validation with Schema Functions

**Location**: `/src/features/auth/utils/safetyUtils.ts`

**Issue**: Multiple functions with the same pattern of extracting and validating payloads.

**Current Implementation**:
```typescript
export function safeExtractLoginPayload(
  event: AuthEvent
): LoginRequestDTO | undefined {
  return safeExtractAndValidatePayload(event, LoginRequestSchema);
}

export function safeExtractRegisterPayload(
  event: AuthEvent
): { email: string; password: string } | undefined {
  return safeExtractAndValidatePayload(event, RegisterRequestSchema);
}
```

**Recommendation**: Use a generic factory or generic function to generate these validation functions:
```typescript
const createSafeExtractFunction = <T>(schema: ZodSchema<T>) => {
  return (event: AuthEvent): T | undefined => {
    return safeExtractAndValidatePayload(event, schema);
  };
};

// Then generate the functions:
export const safeExtractLoginPayload = createSafeExtractFunction(LoginRequestSchema);
export const safeExtractRegisterPayload = createSafeExtractFunction(RegisterRequestSchema);
```

## Additional Observations

### 6. Error Handling Pattern

**Location**: Used throughout AuthRepository with `withErrorHandling` HOC

**Current State**: Good use of higher-order function but could be enhanced with more specific error handling types.

### 7. Axios Interceptor Configuration

**Location**: `/src/features/auth/repositories/AuthRepository.ts`

**Issue**: The retry logic pattern is embedded in the interceptor configuration.

**Recommendation**: Extract the retry configuration into a separate utility that can be reused across different API clients.

## Priority Recommendations

1. **High Priority**: Remove duplicate sanitization logic (sanitizationUtils.ts is deprecated)
2. **High Priority**: Extract the rate limiting pattern into a reusable decorator/extension
3. **Medium Priority**: Refactor safe extraction functions to use a generic pattern
4. **Medium Priority**: Consolidate session handling logic
5. **Low Priority**: Create generic factory for validation functions

## Benefits of Refactoring

- Reduced code duplication
- Improved maintainability
- Consistent error handling
- Easier testing of shared functionality
- Reduced risk of inconsistent behavior across different parts of the system