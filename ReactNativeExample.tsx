/**
 * Example usage of ReactNativeAuthInterface in a React Native component
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { ReactNativeAuthInterface } from '@your-app/auth-logic';

// Initialize the auth interface
const auth = new ReactNativeAuthInterface('https://your-api-base-url.com');

const AuthExample = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is already logged in when component mounts
    checkCurrentSession();
  }, []);

  const checkCurrentSession = async () => {
    try {
      const session = await auth.checkSession();
      setIsLoggedIn(!!session);
    } catch (error) {
      console.error('Error checking session:', error);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const session = await auth.login({ email, password });
      setIsLoggedIn(true);
      Alert.alert('Success', 'Logged in successfully!');
      console.log('Access token:', session.accessToken);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      await auth.register({ email, password });
      Alert.alert('Success', 'Registration successful! Please check your email for verification.');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.logout();
      setIsLoggedIn(false);
      setEmail('');
      setPassword('');
      Alert.alert('Success', 'Logged out successfully!');
    } catch (error: any) {
      Alert.alert('Logout Failed', error.message || 'An error occurred');
    }
  };

  const handleForgotPassword = async () => {
    setIsLoading(true);
    try {
      await auth.requestPasswordReset({ email });
      Alert.alert('Success', 'Password reset OTP sent to your email!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    try {
      // For registration verification
      // const result = await auth.verifyOtp({ email, otp });
      
      // For password reset verification
      const result = await auth.verifyOtp({ email, otp });
      Alert.alert('Success', 'OTP verified!');
      console.log('Verification result:', result);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>
        {isLoggedIn ? 'Logged In' : 'Please Login'}
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />

      <TextInput
        placeholder="OTP (if verifying)"
        value={otp}
        onChangeText={setOtp}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />

      {isLoggedIn ? (
        <>
          <Button title="Logout" onPress={handleLogout} disabled={isLoading} />
        </>
      ) : (
        <>
          <Button title="Login" onPress={handleLogin} disabled={isLoading} />
          <Button title="Register" onPress={handleRegister} disabled={isLoading} style={{ marginTop: 10 }} />
        </>
      )}

      <Button 
        title="Forgot Password" 
        onPress={handleForgotPassword} 
        disabled={isLoading} 
        style={{ marginTop: 10 }} 
      />

      <Button 
        title="Verify OTP" 
        onPress={handleVerifyOtp} 
        disabled={isLoading} 
        style={{ marginTop: 10 }} 
      />

      {isLoading && <Text>Loading...</Text>}
    </View>
  );
};

export default AuthExample;