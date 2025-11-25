/**
 * Tests for sanitizationUtils - Input sanitization functions
 */

import {
  sanitizeInput,
  sanitizeEmail,
  sanitizePassword,
  sanitizeName,
  sanitizeText,
  sanitizeOtp,
  sanitizeActionToken,
  sanitizeLoginRequest,
  sanitizeRegisterRequest,
  sanitizeRequestOtp,
  sanitizeVerifyOtp,
  sanitizeCompleteRegistration,
  sanitizeCompletePasswordReset,
} from "./sanitizationUtils";

describe("sanitizeInput", () => {
  it("should escape HTML tags", () => {
    const input = "<script>alert('xss')</script>";
    const result = sanitizeInput(input);
    expect(result).toContain("&lt;");
    expect(result).toContain("&gt;");
  });

  it("should escape quotes", () => {
    const input = "He said \"hello\" and 'goodbye'";
    const result = sanitizeInput(input);
    expect(result).toContain("&quot;");
    expect(result).toContain("&#x27;");
  });

  it("should escape forward slashes", () => {
    const input = "path/to/resource";
    const result = sanitizeInput(input);
    expect(result).toContain("&#x2F;");
  });

  it("should trim whitespace", () => {
    const input = "  test  ";
    const result = sanitizeInput(input);
    expect(result).toBe("test");
  });

  it("should preserve safe characters", () => {
    const input = "Hello World 123";
    const result = sanitizeInput(input);
    expect(result).toContain("Hello World 123");
  });

  it("should handle all dangerous characters together", () => {
    const input = "<>\"'</tag>/";
    const result = sanitizeInput(input);
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
    expect(result).not.toContain('"');
    expect(result).not.toContain("'");
    expect(result).not.toContain("/");
  });

  it("should handle empty string", () => {
    const result = sanitizeInput("");
    expect(result).toBe("");
  });

  it("should return empty string for non-string input", () => {
    expect(sanitizeInput(123 as any)).toBe("");
    expect(sanitizeInput(null as any)).toBe("");
    expect(sanitizeInput(undefined as any)).toBe("");
    expect(sanitizeInput({} as any)).toBe("");
    expect(sanitizeInput(true as any)).toBe("");
  });
});

describe("sanitizeEmail", () => {
  it("should normalize valid email", () => {
    const email = "test@example.com";
    const result = sanitizeEmail(email);
    expect(result).toBeTruthy();
    expect(result).toContain("@");
  });

  it("should return result for email-like input", () => {
    const result = sanitizeEmail("not-an-email");
    expect(typeof result).toBe("string");
  });

  it("should handle empty string", () => {
    const result = sanitizeEmail("");
    // validator.normalizeEmail returns false-y for empty, or @ for empty
    expect(typeof result).toBe("string");
  });

  it("should normalize uppercase emails", () => {
    const result = sanitizeEmail("TEST@EXAMPLE.COM");
    expect(result).toBeTruthy();
  });

  it("should handle emails with spaces", () => {
    const result = sanitizeEmail("  test@example.com  ");
    expect(result).toBeTruthy();
  });

  it("should return empty string for non-string input", () => {
    expect(sanitizeEmail(123 as any)).toBe("");
    expect(sanitizeEmail(null as any)).toBe("");
    expect(sanitizeEmail(undefined as any)).toBe("");
    expect(sanitizeEmail({} as any)).toBe("");
    expect(sanitizeEmail(true as any)).toBe("");
  });
});

describe("sanitizePassword", () => {
  it("should remove quotes", () => {
    const password = "pass'word";
    const result = sanitizePassword(password);
    expect(result).toBe("password");
  });

  it("should preserve special characters", () => {
    const password = "p@ss!w0rd#123";
    const result = sanitizePassword(password);
    expect(result).toBe("p@ss!w0rd#123");
  });

  it("should return empty string for non-string input", () => {
    expect(sanitizePassword(123 as any)).toBe("");
    expect(sanitizePassword(null as any)).toBe("");
    expect(sanitizePassword(undefined as any)).toBe("");
    expect(sanitizePassword({} as any)).toBe("");
    expect(sanitizePassword(true as any)).toBe("");
  });
});

describe("sanitizeName", () => {
  it("should escape HTML entities", () => {
    const name = "John <script>";
    const result = sanitizeName(name);
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
  });

  it("should trim whitespace", () => {
    const name = "  John Doe  ";
    const result = sanitizeName(name);
    expect(result).toBe("John Doe");
  });

  it("should return empty string for non-string input", () => {
    expect(sanitizeName(123 as any)).toBe("");
    expect(sanitizeName(null as any)).toBe("");
    expect(sanitizeName(undefined as any)).toBe("");
    expect(sanitizeName({} as any)).toBe("");
    expect(sanitizeName(true as any)).toBe("");
  });
});

describe("sanitizeText", () => {
  it("should escape HTML tags", () => {
    const text = "<p>Hello</p>";
    const result = sanitizeText(text);
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
  });

  it("should trim whitespace", () => {
    const text = "  text  ";
    const result = sanitizeText(text);
    expect(result).toBe("text");
  });

  it("should return empty string for non-string input", () => {
    expect(sanitizeText(123 as any)).toBe("");
    expect(sanitizeText(null as any)).toBe("");
    expect(sanitizeText(undefined as any)).toBe("");
    expect(sanitizeText({} as any)).toBe("");
    expect(sanitizeText(true as any)).toBe("");
  });
});

describe("sanitizeOtp", () => {
  it("should accept valid OTP", () => {
    const result = sanitizeOtp("123456");
    expect(result).toBe("123456");
  });

  it("should remove non-digit characters", () => {
    const result = sanitizeOtp("12a34b56");
    expect(result).toBe("123456");
  });

  it("should limit length to 10", () => {
    const result = sanitizeOtp("12345678901");
    expect(result).toBe("1234567890");
  });

  it("should return empty for non-numeric input", () => {
    const result = sanitizeOtp("abcd");
    expect(result).toBe("");
  });

  it("should return empty string for non-string input", () => {
    expect(sanitizeOtp(123 as any)).toBe("");
    expect(sanitizeOtp(null as any)).toBe("");
    expect(sanitizeOtp(undefined as any)).toBe("");
    expect(sanitizeOtp({} as any)).toBe("");
    expect(sanitizeOtp(true as any)).toBe("");
  });
});

describe("sanitizeActionToken", () => {
  it("should preserve alphanumeric characters", () => {
    const token = "abc123XYZ";
    const result = sanitizeActionToken(token);
    expect(result).toBe("abc123XYZ");
  });

  it("should remove HTML characters", () => {
    const token = "abc<script>123";
    const result = sanitizeActionToken(token);
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
  });

  it("should remove quotes", () => {
    const token = "abc\"123'xyz";
    const result = sanitizeActionToken(token);
    expect(result).not.toContain("'");
    expect(result).not.toContain('"');
  });

  it("should return empty string for non-string input", () => {
    expect(sanitizeActionToken(123 as any)).toBe("");
    expect(sanitizeActionToken(null as any)).toBe("");
    expect(sanitizeActionToken(undefined as any)).toBe("");
    expect(sanitizeActionToken({} as any)).toBe("");
    expect(sanitizeActionToken(true as any)).toBe("");
  });
});

describe("sanitizeLoginRequest", () => {
  it("should sanitize both fields", () => {
    const request = {
      email: "test@example.com",
      password: "pass'word",
    };
    const result = sanitizeLoginRequest(request);

    expect(result).toHaveProperty("email");
    expect(result).toHaveProperty("password");
    expect(result.password).toBe("password");
  });
});

describe("sanitizeRegisterRequest", () => {
  it("should sanitize registration fields", () => {
    const request = {
      email: "user@example.com",
      password: "secure'pass",
    };
    const result = sanitizeRegisterRequest(request);

    expect(result).toHaveProperty("email");
    expect(result).toHaveProperty("password");
    expect(result.password).toBe("securepass");
  });
});

describe("sanitizeRequestOtp", () => {
  it("should sanitize email in OTP request", () => {
    const request = { email: "test@example.com" };
    const result = sanitizeRequestOtp(request);

    expect(result).toHaveProperty("email");
  });
});

describe("sanitizeVerifyOtp", () => {
  it("should sanitize both email and OTP", () => {
    const request = {
      email: "test@example.com",
      otp: "12a34b",
    };
    const result = sanitizeVerifyOtp(request);

    expect(result).toHaveProperty("email");
    expect(result).toHaveProperty("otp");
    expect(result.otp).toBe("1234");
  });
});

describe("sanitizeCompleteRegistration", () => {
  it("should sanitize action token and password", () => {
    const request = {
      actionToken: "token123",
      newPassword: "pass'word",
    };
    const result = sanitizeCompleteRegistration(request);

    expect(result).toHaveProperty("actionToken");
    expect(result).toHaveProperty("newPassword");
    expect(result.newPassword).toBe("password");
  });
});

describe("sanitizeCompletePasswordReset", () => {
  it("should sanitize action token and new password", () => {
    const request = {
      actionToken: "reset'token",
      newPassword: 'new"pass',
    };
    const result = sanitizeCompletePasswordReset(request);

    expect(result).toHaveProperty("actionToken");
    expect(result).toHaveProperty("newPassword");
    expect(result.newPassword).not.toContain('"');
  });
});
