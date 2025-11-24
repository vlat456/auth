# Auth Library for React Native

This library provides authentication functionality that can be easily integrated into React Native applications. It uses XState for state management and follows the repository pattern for API interactions.

## Installation

```bash
npm install @your-app/auth-logic
```

## Usage

### Basic Setup

```typescript
import { ReactNativeAuthInterface } from '@your-app/auth-logic';

// Initialize the auth interface
// Optionally provide your API base URL (defaults to "https://api.astra.example.com")
const auth = new ReactNativeAuthInterface('https://your-api-base-url.com');

// Example usage:
try {
  // Register a new user
  await auth.register({ 
    email: 'user@example.com', 
    password: 'securePassword123' 
  });
  
  // Login
  const session = await auth.login({ 
    email: 'user@example.com', 
    password: 'securePassword123' 
  });
  
  console.log('Access token:', session.accessToken);
  
  // Check current session (validates and refreshes if needed)
  const currentSession = await auth.checkSession();
  if (currentSession) {
    console.log('User is logged in');
  } else {
    console.log('User is not logged in');
  }
  
  // Logout
  await auth.logout();
} catch (error) {
  console.error('Authentication error:', error);
}
```

### Available Methods

#### `constructor(apiBaseURL?: string)`
Initializes the authentication interface. Optionally specify your API base URL.

#### `login(payload: LoginRequestDTO): Promise<AuthSession>`
Logs in a user with email and password.

#### `register(payload: RegisterRequestDTO): Promise<void>`
Registers a new user.

#### `requestPasswordReset(payload: RequestOtpDTO): Promise<void>`
Requests a password reset, sending an OTP to the user's email.

#### `verifyOtp(payload: VerifyOtpDTO): Promise<string>`
Verifies an OTP code sent to the user.

#### `completePasswordReset(payload: CompletePasswordResetDTO): Promise<void>`
Completes the password reset process with a new password.

#### `completeRegistration(payload: CompleteRegistrationDTO): Promise<void>`
Completes user registration with action token and new password.

#### `checkSession(): Promise<AuthSession | null>`
Checks the current session, validating and refreshing it if necessary.

#### `logout(): Promise<void>`
Logs out the current user and clears the session.

#### `refresh(refreshToken: string): Promise<AuthSession>`
Manually refreshes the session using a refresh token.

## React Native Integration

The library is pre-configured to work with React Native's AsyncStorage through the `ReactNativeStorage` adapter. Make sure you have `@react-native-async-storage/async-storage` installed in your React Native project:

```bash
npx react-native install @react-native-async-storage/async-storage
```

## Types

The library exports all the types you need for type safety:

```typescript
import { 
  AuthSession, 
  UserProfile, 
  LoginRequestDTO, 
  RegisterRequestDTO 
} from '@your-app/auth-logic';
```

## Error Handling

All methods throw errors when authentication operations fail. Be sure to handle these appropriately in your application:

```typescript
try {
  await auth.login({ email: 'user@example.com', password: 'password' });
} catch (error) {
  if (error instanceof Error) {
    console.error('Login failed:', error.message);
  }
}
```

## Security

- Access tokens are stored securely using React Native's AsyncStorage
- Automatic token refresh when access tokens expire
- Proper validation and sanitization of all inputs
- Secure JWT token handling with local expiration checking