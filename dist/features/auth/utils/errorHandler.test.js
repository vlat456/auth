"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const errorHandler_1 = require("./errorHandler");
jest.mock("axios");
const mockedAxios = axios_1.default;
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
            expect(() => (0, errorHandler_1.handleApiError)(axiosError)).toThrow("Server exploded");
        });
        it("should fall back to axios error message when no server message", () => {
            const axiosError = {
                response: { data: { other: "data" } },
                message: "Axios error occurred",
            };
            mockedAxios.isAxiosError.mockReturnValue(true);
            expect(() => (0, errorHandler_1.handleApiError)(axiosError)).toThrow("Axios error occurred");
        });
        it("should throw generic message when no meaningful message exists", () => {
            const axiosError = {
                response: { data: {} },
                message: "",
            };
            mockedAxios.isAxiosError.mockReturnValue(true);
            expect(() => (0, errorHandler_1.handleApiError)(axiosError)).toThrow("An unexpected error occurred");
        });
        it("should throw generic message when not an Axios error", () => {
            mockedAxios.isAxiosError.mockReturnValue(false);
            expect(() => (0, errorHandler_1.handleApiError)(new Error("boom"))).toThrow("An unexpected error occurred");
        });
        it("should throw generic message for non-axios error", () => {
            mockedAxios.isAxiosError.mockReturnValue(false);
            expect(() => (0, errorHandler_1.handleApiError)("some string error")).toThrow("An unexpected error occurred");
        });
    });
    describe("withErrorHandling", () => {
        it("should return the result when function succeeds", async () => {
            const mockFn = jest.fn().mockResolvedValue("success");
            const wrappedFn = (0, errorHandler_1.withErrorHandling)(mockFn);
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
            const wrappedFn = (0, errorHandler_1.withErrorHandling)(mockFn);
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
            const wrappedFn = (0, errorHandler_1.withErrorHandling)(mockFn);
            expect(() => wrappedFn()).toThrow("Sync Error");
        });
    });
});
