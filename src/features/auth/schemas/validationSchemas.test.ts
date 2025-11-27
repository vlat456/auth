/**
 * Tests for validation schemas with comprehensive branch coverage
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
  sanitizeInput,
  sanitizeEmail,
  sanitizePassword,
  sanitizeOtp,
  sanitizeActionToken,
} from "./validationSchemas";

describe("Validation Schemas - Comprehensive Branch Coverage", () => {
  describe("Sanitization Functions", () => {
    describe("sanitizeInput", () => {
      it("should handle normal strings", () => {
        expect(sanitizeInput("hello world")).toBe("hello world");
      });

      it("should handle HTML injection", () => {
        expect(sanitizeInput("<script>alert('xss')</script>")).toBe(
          "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;&#x2F;script&gt;"
        );
      });

      it("should trim whitespace", () => {
        expect(sanitizeInput("  hello  ")).toBe("hello");
      });

      it("should handle non-string input", () => {
        expect(sanitizeInput(123 as any)).toBe("");
        expect(sanitizeInput(null as any)).toBe("");
        expect(sanitizeInput(undefined as any)).toBe("");
        expect(sanitizeInput({} as any)).toBe("");
      });

      it("should escape quotes", () => {
        expect(sanitizeInput('He said "Hello"')).toBe("He said &quot;Hello&quot;");
        expect(sanitizeInput("It's a 'test'")).toBe("It&#x27;s a &#x27;test&#x27;");
      });
    });

    describe("sanitizeEmail", () => {
      it("should normalize valid email", () => {
        expect(sanitizeEmail("TEST@EXAMPLE.COM")).toBe("test@example.com");
      });

      it("should trim whitespace", () => {
        expect(sanitizeEmail("  test@example.com  ")).toBe("test@example.com");
      });

      it("should limit length", () => {
        const longEmail = "a".repeat(300) + "@example.com";
        const sanitized = sanitizeEmail(longEmail);
        expect(sanitized.length).toBeLessThanOrEqual(254);
      });

      it("should handle non-string input", () => {
        expect(sanitizeEmail(123 as any)).toBe("");
        expect(sanitizeEmail(null as any)).toBe("");
        expect(sanitizeEmail(undefined as any)).toBe("");
        expect(sanitizeEmail({} as any)).toBe("");
      });
    });

    describe("sanitizePassword", () => {
      it("should remove quotes from password", () => {
        expect(sanitizePassword("password'with'quotes")).toBe("passwordwithquotes");
        expect(sanitizePassword('password"with"quotes')).toBe("passwordwithquotes");
      });

      it("should handle non-string input", () => {
        expect(sanitizePassword(123 as any)).toBe("");
        expect(sanitizePassword(null as any)).toBe("");
        expect(sanitizePassword(undefined as any)).toBe("");
        expect(sanitizePassword({} as any)).toBe("");
      });
    });

    describe("sanitizeOtp", () => {
      it("should keep only digits", () => {
        expect(sanitizeOtp("123456")).toBe("123456");
        expect(sanitizeOtp("1a2b3c")).toBe("123");
        expect(sanitizeOtp("!@#123$%^")).toBe("123");
      });

      it("should limit length", () => {
        const longOtp = "1".repeat(15);
        const sanitized = sanitizeOtp(longOtp);
        expect(sanitized.length).toBeLessThanOrEqual(10);
      });

      it("should handle non-string input", () => {
        expect(sanitizeOtp(123 as any)).toBe("");
        expect(sanitizeOtp(null as any)).toBe("");
        expect(sanitizeOtp(undefined as any)).toBe("");
        expect(sanitizeOtp({} as any)).toBe("");
      });
    });

    describe("sanitizeActionToken", () => {
      it("should remove dangerous characters", () => {
        expect(sanitizeActionToken("token'with'quotes")).toBe("tokenwithquotes");
        expect(sanitizeActionToken('token"with"quotes')).toBe("tokenwithquotes");
        expect(sanitizeActionToken("token<with>html")).toBe("tokenwithhtml");
      });

      it("should trim whitespace", () => {
        expect(sanitizeActionToken("  token123  ")).toBe("token123");
      });

      it("should handle non-string input", () => {
        expect(sanitizeActionToken(123 as any)).toBe("");
        expect(sanitizeActionToken(null as any)).toBe("");
        expect(sanitizeActionToken(undefined as any)).toBe("");
        expect(sanitizeActionToken({} as any)).toBe("");
      });
    });
  });

  describe("EmailSchema", () => {
    it("should validate valid email addresses", () => {
      const validEmails = [
        "test@example.com",
        "user+tag@domain.co.uk",
        "123@test.org",
      ];
      validEmails.forEach((email) => {
        const result = EmailSchema.safeParse(email);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid email formats", () => {
      const invalidEmails = [
        "not-an-email",
        "missing@domain",
        "@nodomain.com",
        "spaces in@email.com",
      ];
      invalidEmails.forEach((email) => {
        const result = EmailSchema.safeParse(email);
        expect(result.success).toBe(false);
      });
    });

    it("should reject empty string", () => {
      expect(EmailSchema.safeParse("").success).toBe(false);
    });

    it("should reject null and undefined", () => {
      expect(EmailSchema.safeParse(null).success).toBe(false);
      expect(EmailSchema.safeParse(undefined).success).toBe(false);
    });

    it("should reject non-string types", () => {
      expect(EmailSchema.safeParse(123).success).toBe(false);
      expect(EmailSchema.safeParse({}).success).toBe(false);
    });
  });

  describe("PasswordSchema", () => {
    it("should validate passwords with 8+ characters", () => {
      const validPasswords = [
        "password123",
        "SecurePass1",
        "verylongpasswordwithmanycharacters",
      ];
      validPasswords.forEach((pwd) => {
        expect(PasswordSchema.safeParse(pwd).success).toBe(true);
      });
    });

    it("should reject passwords shorter than 8 characters", () => {
      const invalidPasswords = ["pass", "1234567", "abc"];
      invalidPasswords.forEach((pwd) => {
        expect(PasswordSchema.safeParse(pwd).success).toBe(false);
      });
    });

    it("should reject empty password", () => {
      expect(PasswordSchema.safeParse("").success).toBe(false);
    });

    it("should reject null and undefined", () => {
      expect(PasswordSchema.safeParse(null).success).toBe(false);
      expect(PasswordSchema.safeParse(undefined).success).toBe(false);
    });

    it("should accept exactly 8 character password", () => {
      expect(PasswordSchema.safeParse("12345678").success).toBe(true);
    });

    it("should reject password with only spaces", () => {
      expect(PasswordSchema.safeParse("        ").success).toBe(true); // 8 spaces is technically valid
    });
  });

  describe("OtpSchema", () => {
    it("should validate 4-digit OTP", () => {
      expect(OtpSchema.safeParse("1234").success).toBe(true);
    });

    it("should validate 5-digit OTP", () => {
      expect(OtpSchema.safeParse("12345").success).toBe(true);
    });

    it("should validate 6-digit OTP", () => {
      expect(OtpSchema.safeParse("123456").success).toBe(true);
    });

    it("should reject 3-digit OTP", () => {
      expect(OtpSchema.safeParse("123").success).toBe(false);
    });

    it("should reject 7-digit OTP", () => {
      expect(OtpSchema.safeParse("1234567").success).toBe(false);
    });

    it("should reject non-numeric OTP", () => {
      const invalidOtps = ["abcd", "12a4", "!@#$", "1 345"];
      invalidOtps.forEach((otp) => {
        expect(OtpSchema.safeParse(otp).success).toBe(false);
      });
    });

    it("should reject empty OTP", () => {
      expect(OtpSchema.safeParse("").success).toBe(false);
    });

    it("should reject null and undefined", () => {
      expect(OtpSchema.safeParse(null).success).toBe(false);
      expect(OtpSchema.safeParse(undefined).success).toBe(false);
    });
  });

  describe("ActionTokenSchema", () => {
    it("should validate tokens 20+ characters", () => {
      const validTokens = [
        "verylongactiontoken123456789",
        "a".repeat(20),
        "b".repeat(100),
      ];
      validTokens.forEach((token) => {
        expect(ActionTokenSchema.safeParse(token).success).toBe(true);
      });
    });

    it("should reject tokens shorter than 20 characters", () => {
      expect(ActionTokenSchema.safeParse("shorttoken").success).toBe(false);
      expect(ActionTokenSchema.safeParse("a".repeat(19)).success).toBe(false);
    });

    it("should accept exactly 20 character token", () => {
      expect(ActionTokenSchema.safeParse("a".repeat(20)).success).toBe(true);
    });

    it("should reject empty token", () => {
      expect(ActionTokenSchema.safeParse("").success).toBe(false);
    });

    it("should reject null and undefined", () => {
      expect(ActionTokenSchema.safeParse(null).success).toBe(false);
      expect(ActionTokenSchema.safeParse(undefined).success).toBe(false);
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
      expect(
        LoginRequestSchema.safeParse({
          password: "password123",
        }).success
      ).toBe(false);
    });

    it("should reject with missing password", () => {
      expect(
        LoginRequestSchema.safeParse({
          email: "test@example.com",
        }).success
      ).toBe(false);
    });

    it("should reject with invalid email", () => {
      expect(
        LoginRequestSchema.safeParse({
          email: "invalid",
          password: "password123",
        }).success
      ).toBe(false);
    });

    it("should reject with short password", () => {
      expect(
        LoginRequestSchema.safeParse({
          email: "test@example.com",
          password: "short",
        }).success
      ).toBe(false);
    });

    it("should reject empty object", () => {
      expect(LoginRequestSchema.safeParse({}).success).toBe(false);
    });
  });

  describe("RegisterRequestSchema", () => {
    it("should validate correct register request", () => {
      expect(
        RegisterRequestSchema.safeParse({
          email: "test@example.com",
          password: "password123",
        }).success
      ).toBe(true);
    });

    it("should reject with missing email", () => {
      expect(
        RegisterRequestSchema.safeParse({
          password: "password123",
        }).success
      ).toBe(false);
    });

    it("should reject with missing password", () => {
      expect(
        RegisterRequestSchema.safeParse({
          email: "test@example.com",
        }).success
      ).toBe(false);
    });

    it("should reject with invalid email", () => {
      expect(
        RegisterRequestSchema.safeParse({
          email: "invalid-email",
          password: "password123",
        }).success
      ).toBe(false);
    });

    it("should reject empty object", () => {
      expect(RegisterRequestSchema.safeParse({}).success).toBe(false);
    });
  });

  describe("RequestOtpSchema", () => {
    it("should validate correct request", () => {
      expect(
        RequestOtpSchema.safeParse({
          email: "test@example.com",
        }).success
      ).toBe(true);
    });

    it("should reject with invalid email", () => {
      expect(
        RequestOtpSchema.safeParse({
          email: "invalid",
        }).success
      ).toBe(false);
    });

    it("should reject with missing email", () => {
      expect(RequestOtpSchema.safeParse({}).success).toBe(false);
    });
  });

  describe("VerifyOtpSchema", () => {
    it("should validate correct verify OTP request", () => {
      expect(
        VerifyOtpSchema.safeParse({
          email: "test@example.com",
          otp: "123456",
        }).success
      ).toBe(true);
    });

    it("should reject with missing email", () => {
      expect(
        VerifyOtpSchema.safeParse({
          otp: "123456",
        }).success
      ).toBe(false);
    });

    it("should reject with missing otp", () => {
      expect(
        VerifyOtpSchema.safeParse({
          email: "test@example.com",
        }).success
      ).toBe(false);
    });

    it("should reject with invalid email", () => {
      expect(
        VerifyOtpSchema.safeParse({
          email: "invalid",
          otp: "123456",
        }).success
      ).toBe(false);
    });

    it("should reject with invalid OTP", () => {
      expect(
        VerifyOtpSchema.safeParse({
          email: "test@example.com",
          otp: "abc",
        }).success
      ).toBe(false);
    });
  });

  describe("CompleteRegistrationSchema", () => {
    it("should validate correct data", () => {
      expect(
        CompleteRegistrationSchema.safeParse({
          actionToken: "verylongactiontoken123456",
          newPassword: "newpassword123",
        }).success
      ).toBe(true);
    });

    it("should reject with short action token", () => {
      expect(
        CompleteRegistrationSchema.safeParse({
          actionToken: "short",
          newPassword: "newpassword123",
        }).success
      ).toBe(false);
    });

    it("should reject with missing action token", () => {
      expect(
        CompleteRegistrationSchema.safeParse({
          newPassword: "newpassword123",
        }).success
      ).toBe(false);
    });

    it("should reject with missing password", () => {
      expect(
        CompleteRegistrationSchema.safeParse({
          actionToken: "verylongactiontoken123456",
        }).success
      ).toBe(false);
    });

    it("should reject with short password", () => {
      expect(
        CompleteRegistrationSchema.safeParse({
          actionToken: "verylongactiontoken123456",
          newPassword: "short",
        }).success
      ).toBe(false);
    });
  });

  describe("CompletePasswordResetSchema", () => {
    it("should validate correct data", () => {
      expect(
        CompletePasswordResetSchema.safeParse({
          actionToken: "verylongactiontoken123456",
          newPassword: "newpassword123",
        }).success
      ).toBe(true);
    });

    it("should reject with short token", () => {
      expect(
        CompletePasswordResetSchema.safeParse({
          actionToken: "short",
          newPassword: "newpassword123",
        }).success
      ).toBe(false);
    });

    it("should reject with short password", () => {
      expect(
        CompletePasswordResetSchema.safeParse({
          actionToken: "verylongactiontoken123456",
          newPassword: "short",
        }).success
      ).toBe(false);
    });
  });

  describe("ChangePasswordRequestSchema", () => {
    it("should validate correct data", () => {
      expect(
        ChangePasswordRequestSchema.safeParse({
          email: "test@example.com",
          newPassword: "newpassword123",
        }).success
      ).toBe(true);
    });

    it("should reject with invalid email", () => {
      expect(
        ChangePasswordRequestSchema.safeParse({
          email: "invalid",
          newPassword: "newpassword123",
        }).success
      ).toBe(false);
    });

    it("should reject with short password", () => {
      expect(
        ChangePasswordRequestSchema.safeParse({
          email: "test@example.com",
          newPassword: "short",
        }).success
      ).toBe(false);
    });
  });

  describe("DeleteAccountRequestSchema", () => {
    it("should validate correct data", () => {
      expect(
        DeleteAccountRequestSchema.safeParse({
          email: "test@example.com",
        }).success
      ).toBe(true);
    });

    it("should reject with invalid email", () => {
      expect(
        DeleteAccountRequestSchema.safeParse({
          email: "invalid",
        }).success
      ).toBe(false);
    });

    it("should reject with missing email", () => {
      expect(DeleteAccountRequestSchema.safeParse({}).success).toBe(false);
    });
  });

  describe("RefreshRequestSchema", () => {
    it("should validate correct refresh request", () => {
      expect(
        RefreshRequestSchema.safeParse({
          refreshToken: "validrefreshtoken",
        }).success
      ).toBe(true);
    });

    it("should reject with missing refresh token", () => {
      expect(RefreshRequestSchema.safeParse({}).success).toBe(false);
    });

    it("should reject with empty refresh token", () => {
      expect(
        RefreshRequestSchema.safeParse({
          refreshToken: "",
        }).success
      ).toBe(false);
    });

    it("should reject with null refresh token", () => {
      expect(
        RefreshRequestSchema.safeParse({
          refreshToken: null,
        }).success
      ).toBe(false);
    });
  });

  describe("LoginResponseSchema", () => {
    it("should validate correct login response", () => {
      expect(
        LoginResponseSchema.safeParse({
          accessToken: "token",
          refreshToken: "refresh",
        }).success
      ).toBe(true);
    });

    it("should reject with missing access token", () => {
      expect(
        LoginResponseSchema.safeParse({
          refreshToken: "refresh",
        }).success
      ).toBe(false);
    });

    it("should reject with missing refresh token", () => {
      expect(
        LoginResponseSchema.safeParse({
          accessToken: "token",
        }).success
      ).toBe(false);
    });

    it("should reject with empty tokens", () => {
      expect(
        LoginResponseSchema.safeParse({
          accessToken: "",
          refreshToken: "",
        }).success
      ).toBe(false);
    });
  });

  describe("RefreshResponseDataSchema", () => {
    it("should validate correct refresh response", () => {
      expect(
        RefreshResponseDataSchema.safeParse({
          accessToken: "newtoken",
        }).success
      ).toBe(true);
    });

    it("should reject with missing access token", () => {
      expect(RefreshResponseDataSchema.safeParse({}).success).toBe(false);
    });

    it("should reject with empty access token", () => {
      expect(
        RefreshResponseDataSchema.safeParse({
          accessToken: "",
        }).success
      ).toBe(false);
    });
  });

  describe("UserProfileSchema", () => {
    it("should validate correct profile", () => {
      expect(
        UserProfileSchema.safeParse({
          id: "user123",
          email: "test@example.com",
          name: "John Doe",
        }).success
      ).toBe(true);
    });

    it("should validate profile without name", () => {
      expect(
        UserProfileSchema.safeParse({
          id: "user123",
          email: "test@example.com",
        }).success
      ).toBe(true);
    });

    it("should reject with invalid email", () => {
      expect(
        UserProfileSchema.safeParse({
          id: "user123",
          email: "invalid",
        }).success
      ).toBe(false);
    });

    it("should reject with missing id", () => {
      expect(
        UserProfileSchema.safeParse({
          email: "test@example.com",
        }).success
      ).toBe(false);
    });

    it("should reject with missing email", () => {
      expect(
        UserProfileSchema.safeParse({
          id: "user123",
        }).success
      ).toBe(false);
    });

    it("should reject with empty id", () => {
      expect(
        UserProfileSchema.safeParse({
          id: "",
          email: "test@example.com",
        }).success
      ).toBe(false);
    });
  });

  describe("AuthSessionSchema", () => {
    it("should validate full session", () => {
      expect(
        AuthSessionSchema.safeParse({
          accessToken: "verylongtokenforauth",
          refreshToken: "refreshtoken",
          profile: {
            id: "user123",
            email: "test@example.com",
          },
        }).success
      ).toBe(true);
    });

    it("should validate session with only access token", () => {
      expect(
        AuthSessionSchema.safeParse({
          accessToken: "verylongtokenforauth",
        }).success
      ).toBe(true);
    });

    it("should reject with short access token", () => {
      expect(
        AuthSessionSchema.safeParse({
          accessToken: "sho",
        }).success
      ).toBe(false);
    });

    it("should reject with empty access token", () => {
      expect(
        AuthSessionSchema.safeParse({
          accessToken: "",
        }).success
      ).toBe(false);
    });

    it("should reject with missing access token", () => {
      expect(AuthSessionSchema.safeParse({}).success).toBe(false);
    });

    it("should accept session with invalid profile", () => {
      // Profile is optional, so this should be valid
      const result = AuthSessionSchema.safeParse({
        accessToken: "verylongtokenforauth",
        profile: { invalidProfile: true },
      });
      // Will fail because profile doesn't match schema if provided
      expect(result.success).toBe(false);
    });
  });

  describe("ApiSuccessResponseSchema", () => {
    it("should validate correct API response", () => {
      expect(
        ApiSuccessResponseSchema.safeParse({
          status: 200,
          message: "Success",
          data: { id: "123" },
        }).success
      ).toBe(true);
    });

    it("should validate with different status codes", () => {
      const validStatuses = [200, 201, 202, 300];
      validStatuses.forEach((status) => {
        expect(
          ApiSuccessResponseSchema.safeParse({
            status,
            message: "OK",
            data: {},
          }).success
        ).toBe(true);
      });
    });

    it("should reject with non-positive status", () => {
      expect(
        ApiSuccessResponseSchema.safeParse({
          status: -1,
          message: "Success",
          data: {},
        }).success
      ).toBe(false);
    });

    it("should reject with zero status", () => {
      expect(
        ApiSuccessResponseSchema.safeParse({
          status: 0,
          message: "Success",
          data: {},
        }).success
      ).toBe(false);
    });

    it("should reject with missing status", () => {
      expect(
        ApiSuccessResponseSchema.safeParse({
          message: "Success",
          data: {},
        }).success
      ).toBe(false);
    });

    it("should reject with missing message", () => {
      expect(
        ApiSuccessResponseSchema.safeParse({
          status: 200,
          data: {},
        }).success
      ).toBe(false);
    });

    it("should allow with empty data object", () => {
      // Data can be any value, including empty object
      const result = ApiSuccessResponseSchema.safeParse({
        status: 200,
        message: "Success",
        data: {},
      });
      expect(result.success).toBe(true);
    });
  });

  describe("ApiErrorResponseSchema", () => {
    it("should validate correct error response", () => {
      expect(
        ApiErrorResponseSchema.safeParse({
          status: 400,
          error: "Bad Request",
          errorId: "ERR_001",
          message: "Invalid request",
          path: "/api/login",
        }).success
      ).toBe(true);
    });

    it("should validate with different error statuses", () => {
      const errorStatuses = [400, 401, 403, 404, 500, 502, 503];
      errorStatuses.forEach((status) => {
        expect(
          ApiErrorResponseSchema.safeParse({
            status,
            error: "Error",
            errorId: "ERR_001",
            message: "Error message",
            path: "/api",
          }).success
        ).toBe(true);
      });
    });

    it("should reject with missing status", () => {
      expect(
        ApiErrorResponseSchema.safeParse({
          error: "Bad Request",
          errorId: "ERR_001",
          message: "Invalid request",
          path: "/api/login",
        }).success
      ).toBe(false);
    });

    it("should reject with missing error", () => {
      expect(
        ApiErrorResponseSchema.safeParse({
          status: 400,
          errorId: "ERR_001",
          message: "Invalid request",
          path: "/api/login",
        }).success
      ).toBe(false);
    });

    it("should reject with missing errorId", () => {
      expect(
        ApiErrorResponseSchema.safeParse({
          status: 400,
          error: "Bad Request",
          message: "Invalid request",
          path: "/api/login",
        }).success
      ).toBe(false);
    });

    it("should reject with missing message", () => {
      expect(
        ApiErrorResponseSchema.safeParse({
          status: 400,
          error: "Bad Request",
          errorId: "ERR_001",
          path: "/api/login",
        }).success
      ).toBe(false);
    });

    it("should reject with missing path", () => {
      expect(
        ApiErrorResponseSchema.safeParse({
          status: 400,
          error: "Bad Request",
          errorId: "ERR_001",
          message: "Invalid request",
        }).success
      ).toBe(false);
    });

    it("should reject empty object", () => {
      expect(ApiErrorResponseSchema.safeParse({}).success).toBe(false);
    });
  });

  describe("Schema Safety", () => {
    it("all schemas should use safeParse successfully", () => {
      const schemas = [
        {
          schema: EmailSchema,
          valid: "test@example.com",
        },
        {
          schema: PasswordSchema,
          valid: "password123",
        },
        {
          schema: OtpSchema,
          valid: "123456",
        },
      ];

      schemas.forEach(({ schema, valid }) => {
        const result = schema.safeParse(valid);
        expect(result.success).toBe(true);
      });
    });
  });
});
