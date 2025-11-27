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
});