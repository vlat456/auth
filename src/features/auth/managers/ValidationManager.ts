/**
 * Path: src/features/auth/managers/ValidationManager.ts
 *
 * Centralized validation manager that consolidates all validation operations
 * throughout the authentication system. This manager handles all Zod-based
 * validation, data sanitization, and validation results consistently.
 */

import {
  LoginRequestSchema,
  RegisterRequestSchema,
  RequestOtpSchema,
  VerifyOtpSchema,
  CompleteRegistrationSchema,
  CompletePasswordResetSchema,
  ChangePasswordRequestSchema,
  DeleteAccountRequestSchema,
  RefreshRequestSchema,
  LoginResponseSchema,
  RefreshResponseDataSchema,
  UserProfileSchema,
  AuthSessionSchema,
  LoginResponseSchemaWrapper,
  RefreshResponseSchemaWrapper,
  ApiSuccessResponseSchema,
  ApiErrorResponseSchema,
} from "../schemas/validationSchemas";
import type {
  LoginRequestDTO,
  RegisterRequestDTO,
  RequestOtpDTO,
  VerifyOtpDTO,
  CompleteRegistrationDTO,
  CompletePasswordResetDTO,
  ChangePasswordRequestDTO,
  DeleteAccountRequestDTO,
  RefreshRequestDTO,
  LoginResponseDTO,
  RefreshResponseData,
  UserProfile,
  AuthSession,
  ApiSuccessResponse,
  ApiErrorResponse
} from "../types";
import type { z } from "zod";

/**
 * Generic validation result type that provides consistent error handling
 */
export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * ValidationManager - Centralized validation service
 *
 * This manager provides a consistent interface for all validation operations
 * in the authentication system, replacing scattered validation calls throughout
 * the codebase.
 */
export class ValidationManager {
  /**
   * Validates a login request payload
   */
  validateLoginRequest(payload: unknown): ValidationResult<LoginRequestDTO> {
    try {
      const result = LoginRequestSchema.safeParse(payload);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return {
        success: false,
        error: result.error.issues.map(issue => issue.message).join(', ')
      };
    } catch (error) {
      return { success: false, error: 'Failed to validate login request' };
    }
  }

  /**
   * Validates a register request payload
   */
  validateRegisterRequest(payload: unknown): ValidationResult<RegisterRequestDTO> {
    try {
      const result = RegisterRequestSchema.safeParse(payload);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return {
        success: false,
        error: result.error.issues.map(issue => issue.message).join(', ')
      };
    } catch (error) {
      return { success: false, error: 'Failed to validate register request' };
    }
  }

  /**
   * Validates an OTP request payload
   */
  validateRequestOtpRequest(payload: unknown): ValidationResult<RequestOtpDTO> {
    try {
      const result = RequestOtpSchema.safeParse(payload);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return {
        success: false,
        error: result.error.issues.map(issue => issue.message).join(', ')
      };
    } catch (error) {
      return { success: false, error: 'Failed to validate OTP request' };
    }
  }

  /**
   * Validates an OTP verification payload
   */
  validateVerifyOtpRequest(payload: unknown): ValidationResult<VerifyOtpDTO> {
    try {
      const result = VerifyOtpSchema.safeParse(payload);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return {
        success: false,
        error: result.error.issues.map(issue => issue.message).join(', ')
      };
    } catch (error) {
      return { success: false, error: 'Failed to validate verify OTP request' };
    }
  }

  /**
   * Validates a complete registration payload
   */
  validateCompleteRegistrationRequest(payload: unknown): ValidationResult<CompleteRegistrationDTO> {
    try {
      const result = CompleteRegistrationSchema.safeParse(payload);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return {
        success: false,
        error: result.error.issues.map(issue => issue.message).join(', ')
      };
    } catch (error) {
      return { success: false, error: 'Failed to validate complete registration request' };
    }
  }

  /**
   * Validates a complete password reset payload
   */
  validateCompletePasswordResetRequest(payload: unknown): ValidationResult<CompletePasswordResetDTO> {
    try {
      const result = CompletePasswordResetSchema.safeParse(payload);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return {
        success: false,
        error: result.error.issues.map(issue => issue.message).join(', ')
      };
    } catch (error) {
      return { success: false, error: 'Failed to validate complete password reset request' };
    }
  }

  /**
   * Validates a change password request payload
   */
  validateChangePasswordRequest(payload: unknown): ValidationResult<ChangePasswordRequestDTO> {
    try {
      const result = ChangePasswordRequestSchema.safeParse(payload);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return {
        success: false,
        error: result.error.issues.map(issue => issue.message).join(', ')
      };
    } catch (error) {
      return { success: false, error: 'Failed to validate change password request' };
    }
  }

  /**
   * Validates a delete account request payload
   */
  validateDeleteAccountRequest(payload: unknown): ValidationResult<DeleteAccountRequestDTO> {
    try {
      const result = DeleteAccountRequestSchema.safeParse(payload);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return {
        success: false,
        error: result.error.issues.map(issue => issue.message).join(', ')
      };
    } catch (error) {
      return { success: false, error: 'Failed to validate delete account request' };
    }
  }

  /**
   * Validates a refresh request payload
   */
  validateRefreshRequest(payload: unknown): ValidationResult<RefreshRequestDTO> {
    try {
      const result = RefreshRequestSchema.safeParse(payload);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return {
        success: false,
        error: result.error.issues.map(issue => issue.message).join(', ')
      };
    } catch (error) {
      return { success: false, error: 'Failed to validate refresh request' };
    }
  }

  /**
   * Validates a login response from the server
   */
  validateLoginResponse(response: unknown): ValidationResult<ApiSuccessResponse<LoginResponseDTO>> {
    try {
      const result = LoginResponseSchemaWrapper.safeParse(response);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return {
        success: false,
        error: result.error.issues.map(issue => issue.message).join(', ')
      };
    } catch (error) {
      return { success: false, error: 'Failed to validate login response' };
    }
  }

  /**
   * Validates a refresh response from the server
   */
  validateRefreshResponse(response: unknown): ValidationResult<ApiSuccessResponse<RefreshResponseData>> {
    try {
      const result = RefreshResponseSchemaWrapper.safeParse(response);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return {
        success: false,
        error: result.error.issues.map(issue => issue.message).join(', ')
      };
    } catch (error) {
      return { success: false, error: 'Failed to validate refresh response' };
    }
  }

  /**
   * Validates a user profile
   */
  validateUserProfile(profile: unknown): ValidationResult<UserProfile> {
    try {
      const result = UserProfileSchema.safeParse(profile);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return {
        success: false,
        error: result.error.issues.map(issue => issue.message).join(', ')
      };
    } catch (error) {
      return { success: false, error: 'Failed to validate user profile' };
    }
  }

  /**
   * Validates an authentication session
   */
  validateAuthSession(session: unknown): ValidationResult<AuthSession> {
    try {
      const result = AuthSessionSchema.safeParse(session);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return {
        success: false,
        error: result.error.issues.map(issue => issue.message).join(', ')
      };
    } catch (error) {
      return { success: false, error: 'Failed to validate auth session' };
    }
  }

  /**
   * Validates a generic API response
   */
  validateApiResponse<T>(response: unknown): ValidationResult<ApiSuccessResponse<T>> {
    try {
      const result = ApiSuccessResponseSchema.safeParse(response);
      if (result.success) {
        return { success: true, data: result.data as ApiSuccessResponse<T> };
      }
      return {
        success: false,
        error: result.error.issues.map(issue => issue.message).join(', ')
      };
    } catch (error) {
      return { success: false, error: 'Failed to validate API response' };
    }
  }

  /**
   * Validates an API error response
   */
  validateErrorResponse(response: unknown): ValidationResult<ApiErrorResponse> {
    try {
      const result = ApiErrorResponseSchema.safeParse(response);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return {
        success: false,
        error: result.error.issues.map(issue => issue.message).join(', ')
      };
    } catch (error) {
      return { success: false, error: 'Failed to validate error response' };
    }
  }

  /**
   * Convenient method to parse data with a specific schema
   */
  parseWithSchema<T extends z.ZodTypeAny>(schema: T, data: unknown): ValidationResult<z.infer<T>> {
    try {
      const result = schema.safeParse(data);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return {
        success: false,
        error: result.error.issues.map(issue => issue.message).join(', ')
      };
    } catch (error) {
      return { success: false, error: 'Failed to parse with schema' };
    }
  }
}