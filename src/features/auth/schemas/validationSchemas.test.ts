/**
 * Tests for validation schemas
 */

import {
  EmailSchema,
  PasswordSchema,
  OtpSchema,
  ActionTokenSchema,
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
  ApiSuccessResponseSchema,
  ApiErrorResponseSchema,
} from "./validationSchemas";

describe("Validation Schemas", () => {
  describe("EmailSchema", () => {
    it("should validate valid email", () => {
      const result = EmailSchema.safeParse("test@example.com");
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = EmailSchema.safeParse("not-an-email");
      expect(result.success).toBe(false);
    });

    it("should reject empty string", () => {
      const result = EmailSchema.safeParse("");
      expect(result.success).toBe(false);
    });
  });

  describe("PasswordSchema", () => {
    it("should validate 8-character password", () => {
      const result = PasswordSchema.safeParse("password123");
      expect(result.success).toBe(true);
    });

    it("should reject password shorter than 8 characters", () => {
      const result = PasswordSchema.safeParse("pass");
      expect(result.success).toBe(false);
    });

    it("should reject empty password", () => {
      const result = PasswordSchema.safeParse("");
      expect(result.success).toBe(false);
    });
  });

  describe("OtpSchema", () => {
    it("should validate 4-digit OTP", () => {
      const result = OtpSchema.safeParse("1234");
      expect(result.success).toBe(true);
    });

    it("should validate 6-digit OTP", () => {
      const result = OtpSchema.safeParse("123456");
      expect(result.success).toBe(true);
    });

    it("should reject 3-digit OTP", () => {
      const result = OtpSchema.safeParse("123");
      expect(result.success).toBe(false);
    });

    it("should reject 7-digit OTP", () => {
      const result = OtpSchema.safeParse("1234567");
      expect(result.success).toBe(false);
    });

    it("should reject non-numeric OTP", () => {
      const result = OtpSchema.safeParse("abcd");
      expect(result.success).toBe(false);
    });
  });

  describe("ActionTokenSchema", () => {
    it("should validate long token", () => {
      const result = ActionTokenSchema.safeParse(
        "verylongactiontoken123456789"
      );
      expect(result.success).toBe(true);
    });

    it("should reject token shorter than 20 characters", () => {
      const result = ActionTokenSchema.safeParse("shorttoken");
      expect(result.success).toBe(false);
    });

    it("should reject empty token", () => {
      const result = ActionTokenSchema.safeParse("");
      expect(result.success).toBe(false);
    });
  });

  describe("LoginRequestSchema", () => {
    it("should validate correct login request", () => {
      const result = LoginRequestSchema.safeParse({
        email: "test@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject with missing email", () => {
      const result = LoginRequestSchema.safeParse({
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject with invalid email", () => {
      const result = LoginRequestSchema.safeParse({
        email: "invalid",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("RegisterRequestSchema", () => {
    it("should validate correct register request", () => {
      const result = RegisterRequestSchema.safeParse({
        email: "test@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject with missing fields", () => {
      const result = RegisterRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("RequestOtpSchema", () => {
    it("should validate correct request", () => {
      const result = RequestOtpSchema.safeParse({
        email: "test@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("should reject with invalid email", () => {
      const result = RequestOtpSchema.safeParse({
        email: "invalid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("VerifyOtpSchema", () => {
    it("should validate correct verify OTP request", () => {
      const result = VerifyOtpSchema.safeParse({
        email: "test@example.com",
        otp: "123456",
      });
      expect(result.success).toBe(true);
    });

    it("should reject with missing otp", () => {
      const result = VerifyOtpSchema.safeParse({
        email: "test@example.com",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("CompleteRegistrationSchema", () => {
    it("should validate correct data", () => {
      const result = CompleteRegistrationSchema.safeParse({
        actionToken: "verylongactiontoken123456",
        newPassword: "newpassword123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject with short action token", () => {
      const result = CompleteRegistrationSchema.safeParse({
        actionToken: "short",
        newPassword: "newpassword123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("CompletePasswordResetSchema", () => {
    it("should validate correct data", () => {
      const result = CompletePasswordResetSchema.safeParse({
        actionToken: "verylongactiontoken123456",
        newPassword: "newpassword123",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("ChangePasswordRequestSchema", () => {
    it("should validate correct data", () => {
      const result = ChangePasswordRequestSchema.safeParse({
        email: "test@example.com",
        newPassword: "newpassword123",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("DeleteAccountRequestSchema", () => {
    it("should validate correct data", () => {
      const result = DeleteAccountRequestSchema.safeParse({
        email: "test@example.com",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("RefreshRequestSchema", () => {
    it("should validate correct refresh request", () => {
      const result = RefreshRequestSchema.safeParse({
        refreshToken: "validrefreshtoken",
      });
      expect(result.success).toBe(true);
    });

    it("should reject with missing refresh token", () => {
      const result = RefreshRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should reject with empty refresh token", () => {
      const result = RefreshRequestSchema.safeParse({
        refreshToken: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("LoginResponseSchema", () => {
    it("should validate correct login response", () => {
      const result = LoginResponseSchema.safeParse({
        accessToken: "token",
        refreshToken: "refresh",
      });
      expect(result.success).toBe(true);
    });

    it("should reject with missing tokens", () => {
      const result = LoginResponseSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("RefreshResponseDataSchema", () => {
    it("should validate correct refresh response", () => {
      const result = RefreshResponseDataSchema.safeParse({
        accessToken: "newtoken",
      });
      expect(result.success).toBe(true);
    });

    it("should reject with missing access token", () => {
      const result = RefreshResponseDataSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("UserProfileSchema", () => {
    it("should validate correct profile", () => {
      const result = UserProfileSchema.safeParse({
        id: "user123",
        email: "test@example.com",
        name: "John Doe",
      });
      expect(result.success).toBe(true);
    });

    it("should validate profile without name", () => {
      const result = UserProfileSchema.safeParse({
        id: "user123",
        email: "test@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("should reject with invalid email", () => {
      const result = UserProfileSchema.safeParse({
        id: "user123",
        email: "invalid",
      });
      expect(result.success).toBe(false);
    });

    it("should reject with missing id", () => {
      const result = UserProfileSchema.safeParse({
        email: "test@example.com",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("AuthSessionSchema", () => {
    it("should validate full session", () => {
      const result = AuthSessionSchema.safeParse({
        accessToken: "verylongtokenforauth",
        refreshToken: "refreshtoken",
        profile: {
          id: "user123",
          email: "test@example.com",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should validate session with only access token", () => {
      const result = AuthSessionSchema.safeParse({
        accessToken: "verylongtokenforauth",
      });
      expect(result.success).toBe(true);
    });

    it("should reject with short access token", () => {
      const result = AuthSessionSchema.safeParse({
        accessToken: "sho", // 3 characters - less than required 5
      });
      expect(result.success).toBe(false);
    });
  });

  describe("ApiSuccessResponseSchema", () => {
    it("should validate correct API response", () => {
      const result = ApiSuccessResponseSchema.safeParse({
        status: 200,
        message: "Success",
        data: { id: "123" },
      });
      expect(result.success).toBe(true);
    });

    it("should reject with non-positive status", () => {
      const result = ApiSuccessResponseSchema.safeParse({
        status: -1,
        message: "Success",
        data: {},
      });
      expect(result.success).toBe(false);
    });

    it("should reject with zero status", () => {
      const result = ApiSuccessResponseSchema.safeParse({
        status: 0,
        message: "Success",
        data: {},
      });
      expect(result.success).toBe(false);
    });
  });

  describe("ApiErrorResponseSchema", () => {
    it("should validate correct error response", () => {
      const result = ApiErrorResponseSchema.safeParse({
        status: 400,
        error: "Bad Request",
        errorId: "ERR_001",
        message: "Invalid request",
        path: "/api/login",
      });
      expect(result.success).toBe(true);
    });

    it("should reject with missing fields", () => {
      const result = ApiErrorResponseSchema.safeParse({
        status: 400,
      });
      expect(result.success).toBe(false);
    });
  });
});
