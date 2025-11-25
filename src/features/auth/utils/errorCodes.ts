/**
 * Error codes dictionary for secure error handling
 * Contains generic error messages to prevent information disclosure
 */

export enum AuthErrorCode {
  // General errors
  GENERAL_ERROR = 'AUTH_001',
  NETWORK_ERROR = 'AUTH_002',
  INVALID_INPUT = 'AUTH_003',
  SESSION_EXPIRED = 'AUTH_004',
  TOKEN_INVALID = 'AUTH_005',
  
  // Authentication errors
  LOGIN_FAILED = 'AUTH_101',
  REGISTRATION_FAILED = 'AUTH_102',
  USER_NOT_FOUND = 'AUTH_103',
  INVALID_CREDENTIALS = 'AUTH_104',
  ACCOUNT_LOCKED = 'AUTH_105',
  ACCOUNT_DISABLED = 'AUTH_106',
  
  // Authorization errors
  UNAUTHORIZED_ACCESS = 'AUTH_201',
  INSUFFICIENT_PERMISSIONS = 'AUTH_202',
  INVALID_TOKEN = 'AUTH_203',
  TOKEN_EXPIRED = 'AUTH_204',
  
  // OTP related errors
  OTP_INVALID = 'AUTH_301',
  OTP_EXPIRED = 'AUTH_302',
  OTP_RATE_LIMITED = 'AUTH_303',
  OTP_SEND_FAILED = 'AUTH_304',
  
  // Password related errors
  PASSWORD_RESET_FAILED = 'AUTH_401',
  PASSWORD_WEAK = 'AUTH_402',
  PASSWORD_MISMATCH = 'AUTH_403',
  PASSWORD_SAME_AS_OLD = 'AUTH_404',
  
  // Rate limiting
  TOO_MANY_REQUESTS = 'AUTH_501',
  RATE_LIMIT_EXCEEDED = 'AUTH_502',
  
  // Server errors
  SERVER_ERROR = 'AUTH_999',
}

export const ErrorMessages: Record<AuthErrorCode, string> = {
  // General errors
  [AuthErrorCode.GENERAL_ERROR]: 'An unexpected error occurred',
  [AuthErrorCode.NETWORK_ERROR]: 'Network connection error',
  [AuthErrorCode.INVALID_INPUT]: 'Invalid input provided',
  [AuthErrorCode.SESSION_EXPIRED]: 'Session expired, please login again',
  [AuthErrorCode.TOKEN_INVALID]: 'Invalid authentication token',
  
  // Authentication errors
  [AuthErrorCode.LOGIN_FAILED]: 'Login failed',
  [AuthErrorCode.REGISTRATION_FAILED]: 'Registration failed',
  [AuthErrorCode.USER_NOT_FOUND]: 'User not found',
  [AuthErrorCode.INVALID_CREDENTIALS]: 'Invalid credentials',
  [AuthErrorCode.ACCOUNT_LOCKED]: 'Account is locked',
  [AuthErrorCode.ACCOUNT_DISABLED]: 'Account is disabled',
  
  // Authorization errors
  [AuthErrorCode.UNAUTHORIZED_ACCESS]: 'Access denied',
  [AuthErrorCode.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',
  [AuthErrorCode.INVALID_TOKEN]: 'Invalid token',
  [AuthErrorCode.TOKEN_EXPIRED]: 'Token expired',
  
  // OTP related errors
  [AuthErrorCode.OTP_INVALID]: 'Invalid OTP code',
  [AuthErrorCode.OTP_EXPIRED]: 'OTP code has expired',
  [AuthErrorCode.OTP_RATE_LIMITED]: 'Too many attempts, please try again later',
  [AuthErrorCode.OTP_SEND_FAILED]: 'Failed to send OTP',
  
  // Password related errors
  [AuthErrorCode.PASSWORD_RESET_FAILED]: 'Password reset failed',
  [AuthErrorCode.PASSWORD_WEAK]: 'Password does not meet requirements',
  [AuthErrorCode.PASSWORD_MISMATCH]: 'Passwords do not match',
  [AuthErrorCode.PASSWORD_SAME_AS_OLD]: 'New password cannot be the same as old password',
  
  // Rate limiting
  [AuthErrorCode.TOO_MANY_REQUESTS]: 'Too many requests, please try again later',
  [AuthErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
  
  // Server errors
  [AuthErrorCode.SERVER_ERROR]: 'Server error occurred',
};