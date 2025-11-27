/**
 * Path: src/features/auth/managers/ValidationManager.test.ts
 * Tests for ValidationManager
 */

import { ValidationManager } from './ValidationManager';

describe('ValidationManager', () => {
  let validationManager: ValidationManager;

  beforeEach(() => {
    validationManager = new ValidationManager();
  });

  describe('validateLoginRequest', () => {
    it('should validate a correct login request', () => {
      const validLoginRequest = {
        email: 'test@example.com',
        password: 'securePassword123'
      };

      const result = validationManager.validateLoginRequest(validLoginRequest);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.email).toBe('test@example.com');
      expect(result.data!.password).toBe('securePassword123');
    });

    it('should fail validation for invalid email', () => {
      const invalidLoginRequest = {
        email: 'invalid-email',
        password: 'securePassword123'
      };

      const result = validationManager.validateLoginRequest(invalidLoginRequest);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail validation for short password', () => {
      const invalidLoginRequest = {
        email: 'test@example.com',
        password: '123'
      };

      const result = validationManager.validateLoginRequest(invalidLoginRequest);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateUserProfile', () => {
    it('should validate a correct user profile', () => {
      const validProfile = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User'
      };

      const result = validationManager.validateUserProfile(validProfile);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validProfile);
    });

    it('should validate a profile without optional name', () => {
      const validProfile = {
        id: 'user123',
        email: 'test@example.com'
      };

      const result = validationManager.validateUserProfile(validProfile);
      expect(result.success).toBe(true);
    });

    it('should fail validation for missing id', () => {
      const invalidProfile = {
        email: 'test@example.com',
        name: 'Test User'
      };

      const result = validationManager.validateUserProfile(invalidProfile);
      expect(result.success).toBe(false);
    });
  });

  describe('validateLoginResponse', () => {
    it('should validate a correct login response', () => {
      const validResponse = {
        status: 200,
        message: 'Login successful',
        data: {
          accessToken: 'access_token_abc123',
          refreshToken: 'refresh_token_def456'
        }
      };

      const result = validationManager.validateLoginResponse(validResponse);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('validateAuthSession', () => {
    it('should validate a full authentication session', () => {
      const validSession = {
        accessToken: 'access_token_abc123',
        refreshToken: 'refresh_token_def456',
        profile: {
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User'
        }
      };

      const result = validationManager.validateAuthSession(validSession);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validSession);
    });

    it('should validate a minimal session with only access token', () => {
      const validSession = {
        accessToken: 'access_token_abc123'
      };

      const result = validationManager.validateAuthSession(validSession);
      expect(result.success).toBe(true);
    });
  });

  describe('validateRegisterRequest', () => {
    it('should validate a correct register request', () => {
      const validRegisterRequest = {
        email: 'test@example.com',
        password: 'securePassword123'
      };

      const result = validationManager.validateRegisterRequest(validRegisterRequest);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.email).toBe('test@example.com');
      expect(result.data!.password).toBe('securePassword123');
    });

    it('should fail validation for invalid email in register', () => {
      const invalidRegisterRequest = {
        email: 'invalid-email',
        password: 'securePassword123'
      };

      const result = validationManager.validateRegisterRequest(invalidRegisterRequest);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail validation for short password in register', () => {
      const invalidRegisterRequest = {
        email: 'test@example.com',
        password: '123'
      };

      const result = validationManager.validateRegisterRequest(invalidRegisterRequest);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateRequestOtpRequest', () => {
    it('should validate a correct OTP request', () => {
      const validOtpRequest = {
        email: 'test@example.com'
      };

      const result = validationManager.validateRequestOtpRequest(validOtpRequest);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.email).toBe('test@example.com');
    });

    it('should fail validation for invalid email in OTP request', () => {
      const invalidOtpRequest = {
        email: 'invalid-email'
      };

      const result = validationManager.validateRequestOtpRequest(invalidOtpRequest);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateVerifyOtpRequest', () => {
    it('should validate a correct OTP verification request', () => {
      const validVerifyRequest = {
        email: 'test@example.com',
        otp: '123456'
      };

      const result = validationManager.validateVerifyOtpRequest(validVerifyRequest);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.email).toBe('test@example.com');
      expect(result.data!.otp).toBe('123456');
    });

    it('should fail validation for invalid OTP format - too short', () => {
      const invalidVerifyRequest = {
        email: 'test@example.com',
        otp: '123' // Only 3 digits instead of 4-6
      };

      const result = validationManager.validateVerifyOtpRequest(invalidVerifyRequest);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail validation for invalid OTP format - non-digits', () => {
      const invalidVerifyRequest = {
        email: 'test@example.com',
        otp: 'abcd12' // Contains non-digits
      };

      const result = validationManager.validateVerifyOtpRequest(invalidVerifyRequest);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateCompleteRegistrationRequest', () => {
    it('should validate a correct complete registration request', () => {
      const validCompleteRegistration = {
        actionToken: 'very-long-action-token-1234567890', // At least 20 chars
        newPassword: 'securePassword123'
      };

      const result = validationManager.validateCompleteRegistrationRequest(validCompleteRegistration);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.actionToken).toBe('very-long-action-token-1234567890');
      expect(result.data!.newPassword).toBe('securePassword123');
    });

    it('should fail validation for short password in complete registration', () => {
      const invalidCompleteRegistration = {
        actionToken: 'very-long-action-token-1234567890',
        newPassword: '123' // Less than 8 chars
      };

      const result = validationManager.validateCompleteRegistrationRequest(invalidCompleteRegistration);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail validation for short action token in complete registration', () => {
      const invalidCompleteRegistration = {
        actionToken: 'short', // Less than 20 chars
        newPassword: 'securePassword123'
      };

      const result = validationManager.validateCompleteRegistrationRequest(invalidCompleteRegistration);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateCompletePasswordResetRequest', () => {
    it('should validate a correct complete password reset request', () => {
      const validCompleteReset = {
        actionToken: 'very-long-action-token-1234567890', // At least 20 chars
        newPassword: 'securePassword123'
      };

      const result = validationManager.validateCompletePasswordResetRequest(validCompleteReset);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.actionToken).toBe('very-long-action-token-1234567890');
      expect(result.data!.newPassword).toBe('securePassword123');
    });

    it('should fail validation for short password in complete password reset', () => {
      const invalidCompleteReset = {
        actionToken: 'very-long-action-token-1234567890',
        newPassword: '123' // Less than 8 chars
      };

      const result = validationManager.validateCompletePasswordResetRequest(invalidCompleteReset);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail validation for short action token in complete password reset', () => {
      const invalidCompleteReset = {
        actionToken: 'short', // Less than 20 chars
        newPassword: 'securePassword123'
      };

      const result = validationManager.validateCompletePasswordResetRequest(invalidCompleteReset);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateChangePasswordRequest', () => {
    it('should validate a correct change password request', () => {
      const validChangePassword = {
        email: 'test@example.com',
        newPassword: 'newPassword123'
      };

      const result = validationManager.validateChangePasswordRequest(validChangePassword);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.email).toBe('test@example.com');
      expect(result.data!.newPassword).toBe('newPassword123');
    });

    it('should fail validation for short new password', () => {
      const invalidChangePassword = {
        email: 'test@example.com',
        newPassword: '123'
      };

      const result = validationManager.validateChangePasswordRequest(invalidChangePassword);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateDeleteAccountRequest', () => {
    it('should validate a correct delete account request', () => {
      const validDeleteRequest = {
        email: 'test@example.com'
      };

      const result = validationManager.validateDeleteAccountRequest(validDeleteRequest);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.email).toBe('test@example.com');
    });

    it('should fail validation for invalid email in delete account', () => {
      const invalidDeleteRequest = {
        email: 'invalid-email'
      };

      const result = validationManager.validateDeleteAccountRequest(invalidDeleteRequest);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateRefreshRequest', () => {
    it('should validate a correct refresh request', () => {
      const validRefreshRequest = {
        refreshToken: 'refresh_token_abc123'
      };

      const result = validationManager.validateRefreshRequest(validRefreshRequest);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.refreshToken).toBe('refresh_token_abc123');
    });

    it('should fail validation for empty refresh token', () => {
      const invalidRefreshRequest = {
        refreshToken: ''
      };

      const result = validationManager.validateRefreshRequest(invalidRefreshRequest);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateRefreshResponse', () => {
    it('should validate a correct refresh response', () => {
      const validResponse = {
        status: 200,
        message: 'Token refreshed successfully',
        data: {
          accessToken: 'new_access_token_abc123',
          refreshToken: 'new_refresh_token_def456'
        }
      };

      const result = validationManager.validateRefreshResponse(validResponse);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('validateApiResponse', () => {
    it('should validate a correct API response', () => {
      const validResponse = {
        status: 200,
        message: 'Success',
        data: {
          someData: 'value'
        }
      };

      const result = validationManager.validateApiResponse(validResponse);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should validate different status codes', () => {
      const validResponse = {
        status: 201,
        message: 'Created',
        data: {
          id: '123'
        }
      };

      const result = validationManager.validateApiResponse(validResponse);
      expect(result.success).toBe(true);
    });
  });

  describe('validateErrorResponse', () => {
    it('should validate a correct error response', () => {
      const validErrorResponse = {
        status: 400,
        error: 'Bad request',
        errorId: 'err-12345',
        message: 'Something went wrong',
        path: '/api/login'
      };

      const result = validationManager.validateErrorResponse(validErrorResponse);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe(400);
    });

    it('should fail validation for incorrect error response format', () => {
      const invalidErrorResponse = {
        status: 200, // Success status in error response
        message: 'Success',
        data: 'some data' // Should have error field instead of data
      };

      const result = validationManager.validateErrorResponse(invalidErrorResponse);
      expect(result.success).toBe(false);
    });

    it('should fail validation for missing required fields in error response', () => {
      const invalidErrorResponse = {
        status: 400,
        error: 'Bad request',
        // Missing errorId, message, and path
      };

      const result = validationManager.validateErrorResponse(invalidErrorResponse);
      expect(result.success).toBe(false);
    });
  });

  describe('parseWithSchema', () => {
    it('should parse data with a given schema successfully', () => {
      const { LoginRequestSchema } = require('../schemas/validationSchemas');
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const result = validationManager.parseWithSchema(LoginRequestSchema, validData);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should return error when parsing fails', () => {
      const { LoginRequestSchema } = require('../schemas/validationSchemas');
      const invalidData = {
        email: 'invalid-email',
        password: '123'
      };

      const result = validationManager.parseWithSchema(LoginRequestSchema, invalidData);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});