# Hooking FSM States to React Native Screens

This document outlines how to properly connect Finite State Machine (FSM) states to React Native screens, ensuring proper navigation flow, back button handling, and gesture support.

## Overview

The goal is to create a seamless mapping between FSM states and React Native screens where:
- Each FSM state corresponds to a specific screen or UI state
- Android and iOS back buttons are handled appropriately
- Gesture navigation (swipes) are supported
- State transitions correspond to navigation changes

## Implementation Strategy

### 1. State-to-Screen Mapping

```typescript
// Example mapping of FSM states to React Native screens
const stateScreenMap: Record<string, React.ComponentType> = {
  'login.idle': LoginScreen,
  'login.pending': LoadingScreen,
  'login.success': HomeScreen,
  'registration.form': RegistrationScreen,
  'registration.success': VerifyEmailScreen,
  'forgotPassword.form': ForgotPasswordScreen,
  'forgotPassword.sent': PasswordResetSentScreen,
  'onboarding.step1': OnboardingStep1,
  'onboarding.step2': OnboardingStep2,
  'onboarding.completed': HomeScreen,
};
```

### 2. Navigation Context Integration

Create a navigation context that listens to FSM state changes:

```typescript
// NavigationContext.tsx
import React, { createContext, useContext, useEffect } from 'react';
import { useMachine } from '@xstate/react';
import { authMachine } from './authMachine';

interface NavigationContextType {
  currentScreen: React.ComponentType;
  send: (event: string) => void;
  machineState: any;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [current, send] = useMachine(authMachine);
  const CurrentScreen = stateScreenMap[current.value as string] || ErrorScreen;

  return (
    <NavigationContext.Provider value={{ currentScreen: CurrentScreen, send, machineState: current }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
```

### 3. Screen Component Implementation

Each screen should be connected to the FSM state:

```typescript
// Example LoginScreen
import React from 'react';
import { View, Text, Button } from 'react-native';
import { useNavigation } from '../NavigationContext';

const LoginScreen: React.FC = () => {
  const { send, machineState } = useNavigation();

  const handleLogin = () => {
    send('LOGIN_ATTEMPT');
  };

  return (
    <View>
      <Text>Login Screen</Text>
      <Button title="Login" onPress={handleLogin} disabled={machineState.matches('login.pending')} />
    </View>
  );
};
```

### 4. Handling Back Button Navigation

Use React Navigation's `useFocusEffect` to handle hardware back button on Android:

```typescript
// In each screen component
import React from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

const ScreenComponent: React.FC = () => {
  const { send, machineState } = useNavigation();

  // Handle Android back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Check if current state allows back navigation
        if (canGoBack(machineState)) {
          send('BACK_NAVIGATION');
          return true; // Prevent default back behavior
        }
        return false; // Allow default back behavior
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [send, machineState])
  );

  return (
    <View>
      {/* Component content */}
    </View>
  );
};

const canGoBack = (state: any) => {
  // Define which states allow back navigation
  return state.matches('login.idle') || state.matches('registration.form');
};
```

### 5. Gesture Navigation (Swipe Handling)

For gesture support, use libraries like `react-native-gesture-handler`:

```typescript
// In screen component
import { useSwipe } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

const ScreenWithGestures: React.FC = () => {
  const { send, machineState } = useNavigation();
  const context = useSharedValue(0);

  const swipeHandler = useSwipe({ 
    onEnd: (direction) => {
      if (direction === 'RIGHT' && canSwipeBack(machineState)) {
        send('BACK_NAVIGATION');
      }
    }
  });

  return (
    <PanGestureHandler onGestureEvent={swipeHandler}>
      <Animated.View style={animatedStyle}>
        {/* Screen content */}
      </Animated.View>
    </PanGestureHandler>
  );
};
```

### 6. State Transition Handling

Handle navigation transitions based on state changes:

```typescript
// NavigationHandler.tsx
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useNavigation as useCustomNavigation } from './NavigationContext';

export const NavigationHandler: React.FC = () => {
  const { machineState } = useCustomNavigation();
  const reactNavigation = useNavigation();

  useEffect(() => {
    // Perform navigation actions based on state transitions
    if (machineState.matches('login.success')) {
      // Navigate to home after successful login
      reactNavigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } else if (machineState.matches('registration.success')) {
      // Navigate to verification screen
      reactNavigation.navigate('VerifyEmail');
    }
  }, [machineState]);

  return null; // This component doesn't render anything
};
```

### 7. Complete App Structure

```typescript
// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { NavigationProvider } from './contexts/NavigationContext';
import { NavigationHandler } from './components/NavigationHandler';
import { stateScreenMap } from './stateScreenMap';

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <NavigationProvider>
        <NavigationHandler />
        <MainNavigator />
      </NavigationProvider>
    </NavigationContainer>
  );
};

const MainNavigator: React.FC = () => {
  const { currentScreen: CurrentScreen } = useNavigation();
  
  return <CurrentScreen />;
};
```

## Best Practices

### 1. State Transition Guards
- Implement guards to prevent invalid state transitions
- Ensure that back navigation is only allowed from specific states

### 2. Loading States
- Display appropriate loading indicators during state transitions
- Prevent duplicate actions during pending states

### 3. Error Handling
- Map error states to appropriate error screens
- Implement error recovery mechanisms

### 4. Accessibility
- Ensure navigation is accessible for users with disabilities
- Properly announce screen changes for screen readers

### 5. Performance
- Memoize expensive computations in state listeners
- Use React.memo for screen components when appropriate

## Advanced Considerations

### 1. Nested State Management
For complex state machines with nested states, consider organizing screens hierarchically:

```typescript
const nestedStateScreenMap = {
  'auth': {
    'login.idle': LoginScreen,
    'registration.form': RegistrationScreen,
  },
  'onboarding': {
    'step1': OnboardingStep1,
    'step2': OnboardingStep2,
  }
};
```

### 2. Deep Linking
- Synchronize FSM states with deep links
- Initialize FSM based on URL parameters

### 3. Offline Handling
- Implement offline states in your FSM
- Cache state transitions for offline scenarios

This approach creates a robust, maintainable connection between your FSM and React Native screens while providing proper handling for platform-specific navigation patterns.