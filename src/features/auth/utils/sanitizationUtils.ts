/**
 * Input sanitization utilities to prevent injection attacks
 */

import * as validator from 'validator';

/**
 * Sanitizes user input by removing potentially dangerous characters
 * @param input The input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove or escape potentially dangerous characters
  // This is a basic sanitization - implement more comprehensive as needed
  return input
    .replace(/</g, '&lt;')   // Prevent HTML injection
    .replace(/>/g, '&gt;')   // Prevent HTML injection
    .replace(/"/g, '&quot;') // Prevent attribute escaping
    .replace(/'/g, '&#x27;') // Prevent attribute escaping
    .replace(/\//g, '&#x2F;') // Prevent closing tags
    .trim(); // Remove leading/trailing whitespace
}

/**
 * Sanitizes an email address
 * @param email The email to sanitize
 * @returns Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return '';
  }
  
  // Use validator to normalize and validate email
  const normalized = validator.normalizeEmail(email);
  return normalized || '';
}

/**
 * Sanitizes a password (removes only dangerous characters while preserving strength)
 * @param password The password to sanitize
 * @returns Sanitized password
 */
export function sanitizePassword(password: string): string {
  if (typeof password !== 'string') {
    return '';
  }
  
  // Don't overly restrict password chars as this might reduce entropy
  // Just remove potentially dangerous characters
  return password.replace(/['"]/g, '');
}

/**
 * Sanitizes user profile name
 * @param name The name to sanitize
 * @returns Sanitized name
 */
export function sanitizeName(name: string): string {
  if (typeof name !== 'string') {
    return '';
  }
  
  return validator.escape(name).trim();
}

/**
 * Sanitizes a general text field
 * @param text The text to sanitize
 * @returns Sanitized text
 */
export function sanitizeText(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }
  
  return validator.escape(text).trim();
}

/**
 * Sanitizes an OTP code (only allow digits and limit length)
 * @param otp The OTP to sanitize
 * @returns Sanitized OTP
 */
export function sanitizeOtp(otp: string): string {
  if (typeof otp !== 'string') {
    return '';
  }
  
  // Only allow digits and ensure it's not too long
  const digitsOnly = otp.replace(/\D/g, '').substring(0, 10);
  return digitsOnly;
}

/**
 * Sanitizes an action token
 * @param token The token to sanitize
 * @returns Sanitized token
 */
export function sanitizeActionToken(token: string): string {
  if (typeof token !== 'string') {
    return '';
  }
  
  // Remove potential dangerous characters but keep token format
  return token.replace(/['"<>]/g, '').trim();
}

/**
 * Sanitizes a complete input object by applying appropriate sanitization to each field
 * @param input The input object to sanitize
 * @returns Sanitized input object
 */
export function sanitizeLoginRequest(input: { email: string; password: string }): { email: string; password: string } {
  return {
    email: sanitizeEmail(input.email),
    password: sanitizePassword(input.password)
  };
}

export function sanitizeRegisterRequest(input: { email: string; password: string }): { email: string; password: string } {
  return {
    email: sanitizeEmail(input.email),
    password: sanitizePassword(input.password)
  };
}

export function sanitizeRequestOtp(input: { email: string }): { email: string } {
  return {
    email: sanitizeEmail(input.email)
  };
}

export function sanitizeVerifyOtp(input: { email: string; otp: string }): { email: string; otp: string } {
  return {
    email: sanitizeEmail(input.email),
    otp: sanitizeOtp(input.otp)
  };
}

export function sanitizeCompleteRegistration(input: { actionToken: string; newPassword: string }): { actionToken: string; newPassword: string } {
  return {
    actionToken: sanitizeActionToken(input.actionToken),
    newPassword: sanitizePassword(input.newPassword)
  };
}

export function sanitizeCompletePasswordReset(input: { actionToken: string; newPassword: string }): { actionToken: string; newPassword: string } {
  return {
    actionToken: sanitizeActionToken(input.actionToken),
    newPassword: sanitizePassword(input.newPassword)
  };
}