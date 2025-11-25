import axios from "axios";
import { handleApiError, withErrorHandling, ApiError } from "./errorHandler";
import { AuthErrorCode, ErrorMessages } from "./errorCodes";

// Define fail function for tests
const fail = (message: string) => {
  throw new Error(message);
};

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("errorHandler", () => {
  beforeEach(() => {
    mockedAxios.isAxiosError.mockReturnValue(true);
  });

  describe("handleApiError", () => {
    it("should throw server-provided error message", () => {
      const axiosError = {
        response: { data: { message: "Server exploded" } },
        message: "local",
      };
      mockedAxios.isAxiosError.mockReturnValue(true);

      try {
        handleApiError(axiosError);
        fail('Expected ApiError to be thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.message).toBe("Server exploded");
      }
    });

    it("should fall back to axios error message when no server message", () => {
      const axiosError = {
        response: { data: { other: "data" } },
        message: "Axios error occurred",
      };
      mockedAxios.isAxiosError.mockReturnValue(true);

      try {
        handleApiError(axiosError);
        fail('Expected ApiError to be thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.message).toBe("Axios error occurred");
      }
    });

    it("should throw generic message when no meaningful message exists", () => {
      const axiosError = {
        response: { data: {} },
        message: "",
      };
      mockedAxios.isAxiosError.mockReturnValue(true);

      try {
        handleApiError(axiosError);
        fail('Expected ApiError to be thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.message).toBe("An unexpected error occurred");
      }
    });

    it("should throw generic message when not an Axios error", () => {
      mockedAxios.isAxiosError.mockReturnValue(false);

      try {
        handleApiError(new Error("boom"));
        fail('Expected ApiError to be thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.message).toBe("An unexpected error occurred");
      }
    });

    it("should throw generic message for non-axios error", () => {
      mockedAxios.isAxiosError.mockReturnValue(false);

      try {
        handleApiError("some string error");
        fail('Expected ApiError to be thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.message).toBe("An unexpected error occurred");
      }
    });

    it("should handle 400 status with message", () => {
      const axiosError = {
        response: { status: 400, data: { message: "Bad request" } },
        message: "Request failed",
      };
      mockedAxios.isAxiosError.mockReturnValue(true);

      expect(() => handleApiError(axiosError)).toThrow("Bad request");
    });

    it("should handle 401 status", () => {
      const axiosError = {
        response: { status: 401, data: { message: "Unauthorized" } },
        message: "Request failed",
      };
      mockedAxios.isAxiosError.mockReturnValue(true);

      expect(() => handleApiError(axiosError)).toThrow("Unauthorized");
    });

    it("should handle 403 status", () => {
      const axiosError = {
        response: { status: 403, data: { message: "Forbidden" } },
        message: "Request failed",
      };
      mockedAxios.isAxiosError.mockReturnValue(true);

      expect(() => handleApiError(axiosError)).toThrow("Forbidden");
    });

    it("should handle 404 status", () => {
      const axiosError = {
        response: { status: 404, data: { message: "Not found" } },
        message: "Request failed",
      };
      mockedAxios.isAxiosError.mockReturnValue(true);

      expect(() => handleApiError(axiosError)).toThrow("Not found");
    });

    it("should handle 429 rate limit", () => {
      const axiosError = {
        response: { status: 429, data: {} },
        message: "Too many requests",
      };
      mockedAxios.isAxiosError.mockReturnValue(true);

      expect(() => handleApiError(axiosError)).toThrow(
        ErrorMessages[AuthErrorCode.TOO_MANY_REQUESTS]
      );
    });

    it("should handle 500 server error", () => {
      const axiosError = {
        response: { status: 500, data: { error: "Internal error" } },
        message: "Server error",
      };
      mockedAxios.isAxiosError.mockReturnValue(true);

      expect(() => handleApiError(axiosError)).toThrow(
        ErrorMessages[AuthErrorCode.SERVER_ERROR]
      );
    });

    it("should handle 502 bad gateway", () => {
      const axiosError = {
        response: { status: 502, data: {} },
        message: "Bad gateway",
      };
      mockedAxios.isAxiosError.mockReturnValue(true);

      expect(() => handleApiError(axiosError)).toThrow(
        ErrorMessages[AuthErrorCode.SERVER_ERROR]
      );
    });

    it("should handle 503 service unavailable", () => {
      const axiosError = {
        response: { status: 503, data: {} },
        message: "Service unavailable",
      };
      mockedAxios.isAxiosError.mockReturnValue(true);

      expect(() => handleApiError(axiosError)).toThrow(
        ErrorMessages[AuthErrorCode.SERVER_ERROR]
      );
    });

    it("should handle 504 gateway timeout", () => {
      const axiosError = {
        response: { status: 504, data: {} },
        message: "Gateway timeout",
      };
      mockedAxios.isAxiosError.mockReturnValue(true);

      expect(() => handleApiError(axiosError)).toThrow(
        ErrorMessages[AuthErrorCode.SERVER_ERROR]
      );
    });

    it("should handle response without message", () => {
      const axiosError = {
        response: { status: 400, data: {} },
        message: "Network error",
      };
      mockedAxios.isAxiosError.mockReturnValue(true);

      expect(() => handleApiError(axiosError)).toThrow("Network error");
    });

    it("should handle missing response", () => {
      const axiosError = {
        response: undefined,
        message: "Connection timeout",
      };
      mockedAxios.isAxiosError.mockReturnValue(true);

      expect(() => handleApiError(axiosError)).toThrow("Connection timeout");
    });

    it("should handle 500 with internal error message", () => {
      const axiosError = {
        response: { status: 500, data: { error: "Internal server error" } },
        message: "Server error",
      };
      mockedAxios.isAxiosError.mockReturnValue(true);

      expect(() => handleApiError(axiosError)).toThrow(
        ErrorMessages[AuthErrorCode.SERVER_ERROR]
      );
    });

    it("should handle other 5xx errors", () => {
      const axiosError = {
        response: { status: 500, data: { error: "Something went wrong" } },
        message: "Server error",
      };
      mockedAxios.isAxiosError.mockReturnValue(true);

      expect(() => handleApiError(axiosError)).toThrow(
        ErrorMessages[AuthErrorCode.SERVER_ERROR]
      );
    });

    it("should handle unknown status with message", () => {
      const axiosError = {
        response: { status: 418, data: { message: "I'm a teapot" } },
        message: "Weird status",
      };
      mockedAxios.isAxiosError.mockReturnValue(true);

      expect(() => handleApiError(axiosError)).toThrow("I'm a teapot");
    });
  });

  describe("withErrorHandling", () => {
    it("should return the result when function succeeds", async () => {
      const mockFn = jest.fn().mockResolvedValue("success");
      const wrappedFn = withErrorHandling(mockFn);

      const result = await wrappedFn();
      expect(result).toBe("success");
    });

    it("should handle errors from async functions", async () => {
      const axiosError = {
        response: { data: { message: "API Error" } },
        message: "local",
      };
      mockedAxios.isAxiosError.mockReturnValue(true);

      const mockFn = jest.fn().mockRejectedValue(axiosError);
      const wrappedFn = withErrorHandling(mockFn);

      await expect(wrappedFn()).rejects.toThrow("API Error");
    });

    it("should handle errors from sync functions", () => {
      const axiosError = {
        response: { data: { message: "Sync Error" } },
        message: "local",
      };
      mockedAxios.isAxiosError.mockReturnValue(true);

      const mockFn = () => {
        throw axiosError;
      };
      const wrappedFn = withErrorHandling(mockFn);

      expect(() => wrappedFn()).toThrow("Sync Error");
    });

    it("should handle non-axios errors thrown synchronously", () => {
      const mockFn = () => {
        throw new Error("Non-axios sync error");
      };
      const wrappedFn = withErrorHandling(mockFn);

      expect(() => wrappedFn()).toThrow("Non-axios sync error");
    });

    it("should preserve function arguments", async () => {
      const mockFn = jest.fn((a: number, b: string) =>
        Promise.resolve(`${a}${b}`)
      );
      const wrappedFn = withErrorHandling(mockFn);

      const result = await wrappedFn(42, "test");

      expect(mockFn).toHaveBeenCalledWith(42, "test");
      expect(result).toBe("42test");
    });

    it("should work with sync functions that return values", () => {
      const mockFn = jest.fn((x: number) => x * 2);
      const wrappedFn = withErrorHandling(mockFn);

      const result = wrappedFn(21);

      expect(result).toBe(42);
      expect(mockFn).toHaveBeenCalledWith(21);
    });
  });
});
