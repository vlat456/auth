import axios from "axios";
import { handleApiError, withErrorHandling } from "./errorHandler";

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
      
      expect(() => handleApiError(axiosError)).toThrow("Server exploded");
    });

    it("should fall back to axios error message when no server message", () => {
      const axiosError = {
        response: { data: { other: "data" } },
        message: "Axios error occurred",
      };
      mockedAxios.isAxiosError.mockReturnValue(true);
      
      expect(() => handleApiError(axiosError)).toThrow("Axios error occurred");
    });

    it("should throw generic message when no meaningful message exists", () => {
      const axiosError = {
        response: { data: {} },
        message: "",
      };
      mockedAxios.isAxiosError.mockReturnValue(true);
      
      expect(() => handleApiError(axiosError)).toThrow("An unexpected error occurred");
    });

    it("should throw generic message when not an Axios error", () => {
      mockedAxios.isAxiosError.mockReturnValue(false);
      
      expect(() => handleApiError(new Error("boom"))).toThrow("An unexpected error occurred");
    });

    it("should throw generic message for non-axios error", () => {
      mockedAxios.isAxiosError.mockReturnValue(false);
      
      expect(() => handleApiError("some string error")).toThrow("An unexpected error occurred");
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
  });
});