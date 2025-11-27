# Google Login Integration Guide

## Overview

This document outlines how to integrate Google Sign-In functionality into the existing auth-logic project. The implementation should follow the same architectural patterns as the existing system while adding Google OAuth capabilities.

## Architecture Integration Points

### 1. Domain Type Extensions

First, we need to extend the existing type system to support Google login:

```typescript
// In src/features/auth/types.ts
export interface GoogleLoginRequestDTO {
  idToken: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface GoogleAuthResponseDTO {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export type AuthEvent = 
  // ... existing events
  | { type: 'GOOGLE_LOGIN'; payload: GoogleLoginRequestDTO }
  | { type: 'GOOGLE_LOGIN_SUCCESS'; payload: AuthSession }
  | { type: 'GOOGLE_LOGIN_ERROR'; error: AuthError };
```

### 2. Validation Schema

Add validation schemas for Google login:

```typescript
// In src/features/auth/schemas/validationSchemas.ts
export const GoogleLoginRequestSchema = z.object({
  idToken: z.string().min(1, 'ID token is required'),
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required'),
  avatar: z.string().optional(),
});

export const GoogleAuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: UserProfileSchema,
});

export const GoogleLoginRequestSchemaWrapper = ApiResponseWrapper.extend({
  data: GoogleLoginRequestSchema,
});
```

### 3. Repository Layer Extension

Extend the AuthRepository interface and implementation:

```typescript
// In src/features/auth/repositories/AuthRepository.ts
export interface IAuthRepository {
  // ... existing methods
  googleLogin(payload: GoogleLoginRequestDTO): Promise<AuthSession>;
}

export class AuthRepository implements IAuthRepository {
  // ... existing methods
  
  googleLogin = withErrorHandling(
    async (payload: GoogleLoginRequestDTO): Promise<AuthSession> => {
      const validatedPayload = GoogleLoginRequestSchema.parse(payload);
      
      const response = await this.apiClient.post<
        ApiSuccessResponse<GoogleAuthResponseDTO>
      >("/auth/google", validatedPayload);
      
      const validatedData = GoogleAuthResponseSchemaWrapper.parse(response.data);
      
      const session: AuthSession = {
        accessToken: validatedData.data.accessToken,
        refreshToken: validatedData.data.refreshToken,
        user: validatedData.data.user,
        expiresAt: this.calculateExpirationTime(validatedData.data.accessToken),
      };
      
      // Save session to storage
      await this.writeSession(session);
      return session;
    }
  );
}
```

### 4. XState Machine Updates

Modify the authMachine to handle Google login:

```typescript
// In src/features/auth/machine/authMachine.ts
// Add new states for Google login
const authMachine = setup({
  types: {} as {
    // ... existing types
    events: 
      | EventWithSystem
      | { type: 'GOOGLE_LOGIN'; payload: GoogleLoginRequestDTO }
      | { type: 'GOOGLE_LOGIN_SUCCESS'; payload: AuthSession }
      | { type: 'GOOGLE_LOGIN_ERROR'; error: AuthError };
  },
  actors: {
    // ... existing actors
    googleLoginUser: fromPromise(async ({ input }: { input: GoogleLoginRequestDTO }) => {
      return await authRepository.googleLogin(input);
    }),
  }
}).createMachine({
  // ... existing configuration
  
  states: {
    unauthorized: {
      states: {
        login: {
          // ... existing states
        },
        register: {
          // ... existing states
        },
        forgotPassword: {
          // ... existing states
        },
        // Add Google login state
        googleLogin: {
          tags: ['loading'],
          invoke: {
            id: 'google-login',
            src: 'googleLoginUser',
            input: ({ context }) => context.googleLoginPayload!,
            onDone: {
              target: 'success',
              actions: assign({
                session: ({ event }) => event.output,
                error: null,
                googleLoginPayload: undefined
              })
            },
            onError: {
              target: 'error',
              actions: assign({
                error: ({ event }) => event.error as AuthError,
                googleLoginPayload: undefined
              })
            }
          }
        }
      }
    }
  },
  
  on: {
    // ... existing transitions
    GOOGLE_LOGIN: {
      target: '.unauthorized.login.googleLogin',
      actions: assign({
        googleLoginPayload: ({ event }) => event.payload
      })
    }
  }
});
```

### 5. Context Extension

Update the AuthContext to support Google login:

```typescript
// In src/features/auth/types.ts
export type GoogleLoginFlowContext = {
  idToken: string;
  email: string;
  name: string;
  avatar?: string;
};

export type AuthContext = {
  // ... existing context properties
  googleLogin?: GoogleLoginFlowContext;
};

// Update the context initialization
export const initialContext: AuthContext = {
  session: null,
  error: null,
  // ... other existing properties
  googleLogin: undefined,
};
```

### 6. Service Layer Enhancement

Update the AuthService to include Google login:

```typescript
// In src/features/auth/service/authService.ts
export class AuthService {
  // ... existing methods
  
  async googleLogin(payload: GoogleLoginRequestDTO): Promise<AuthSession> {
    return new Promise((resolve, reject) => {
      const cleanup = this.subscribe((state) => {
        if (state.matches("authorized")) {
          cleanup();
          resolve(state.context.session!);
        } else if (
          state.context.error &&
          state.matches({ unauthorized: { login: "error" } })
        ) {
          cleanup();
          reject(new Error(state.context.error.message));
        }
      });

      this._send({ type: "GOOGLE_LOGIN", payload });
    });
  }
}
```

### 7. React Native Interface

Update the ReactNativeAuthInterface to expose Google login:

```typescript
// In ReactNativeAuthInterface.ts
export class ReactNativeAuthInterface {
  // ... existing methods
  
  async googleLogin(payload: GoogleLoginRequestDTO): Promise<AuthSession> {
    return this.authService.googleLogin(payload);
  }
  
  // Helper method to initiate Google Sign-In
  async initiateGoogleSignIn(): Promise<GoogleLoginRequestDTO> {
    try {
      // This assumes you're using @react-native-google-signin/google-signin
      // or a similar library for React Native
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      return {
        idToken: userInfo.idToken!,
        email: userInfo.user.email,
        name: userInfo.user.name || userInfo.user.familyName + ' ' + userInfo.user.givenName,
        avatar: userInfo.user.photo,
      };
    } catch (error) {
      throw new Error('Google Sign-In failed: ' + (error as Error).message);
    }
  }
}
```

## Frontend Integration Example

### React Native Component

```tsx
import React from 'react';
import { View, TouchableOpacity, Text, Image } from 'react-native';
import { ReactNativeAuthInterface } from '@your-app/auth-logic';

interface GoogleLoginButtonProps {
  onLoginSuccess: (session: AuthSession) => void;
  onLoginError: (error: Error) => void;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ 
  onLoginSuccess, 
  onLoginError 
}) => {
  const auth = new ReactNativeAuthInterface();

  const handleGoogleLogin = async () => {
    try {
      // Initiate Google Sign-In and get user info
      const googleLoginData = await auth.initiateGoogleSignIn();
      
      // Perform backend authentication
      const session = await auth.googleLogin(googleLoginData);
      
      onLoginSuccess(session);
    } catch (error) {
      onLoginError(error as Error);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.googleButton} 
      onPress={handleGoogleLogin}
    >
      <Image 
        source={require('./google-icon.png')} 
        style={styles.googleIcon} 
      />
      <Text style={styles.googleButtonText}>
        Sign in with Google
      </Text>
    </TouchableOpacity>
  );
};

const styles = {
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
};

export default GoogleLoginButton;
```

## API Security Considerations

### 1. ID Token Verification

On the backend, verify the Google ID token:

```typescript
// Backend verification (pseudo-code)
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(token: string) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  
  const payload = ticket.getPayload();
  return payload;
}
```

### 2. Additional Security Measures

- Validate the ID token's audience matches your Google Client ID
- Check the token's issuer is accounts.google.com or https://accounts.google.com
- Verify the token hasn't expired
- Implement CSRF protection with state parameter
- Store the Google user ID for future reference

## Testing Strategy

### Unit Tests

```typescript
// authMachine.test.ts - Add Google login tests
describe('Google Login', () => {
  it('should transition to authorized state on successful Google login', async () => {
    const mockGooglePayload: GoogleLoginRequestDTO = {
      idToken: 'fake-token',
      email: 'user@gmail.com',
      name: 'John Doe',
    };
    
    const mockSession: AuthSession = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { email: 'user@gmail.com', name: 'John Doe' },
      expiresAt: new Date().getTime() + 3600000,
    };
    
    const mockRepository = createMockRepository();
    mockRepository.googleLogin.mockResolvedValue(mockSession);
    
    const machine = createAuthMachine(mockRepository);
    const actor = createActor(machine);
    actor.start();
    
    actor.send({ type: 'GOOGLE_LOGIN', payload: mockGooglePayload });
    
    // Verify state transitions
    await waitFor(() => {
      expect(actor.getSnapshot().matches('authorized')).toBe(true);
    });
  });
});
```

## Dependencies to Add

Update package.json with Google Sign-In dependencies:

```json
{
  "dependencies": {
    "@react-native-google-signin/google-signin": "^10.0.0",
    "google-auth-library": "^9.0.0"
  }
}
```

## Migration Plan

1. **Phase 1**: Add type definitions and validation schemas
2. **Phase 2**: Extend repository with Google login method
3. **Phase 3**: Update XState machine with Google login states
4. **Phase 4**: Enhance service layer with Google login method
5. **Phase 5**: Update React Native interface
6. **Phase 6**: Create frontend component
7. **Phase 7**: Add comprehensive tests
8. **Phase 8**: Backend API implementation and security validation
9. **Phase 9**: Integration testing and documentation

This approach maintains the existing architectural patterns while adding Google Sign-In functionality in a type-safe, testable, and secure manner.