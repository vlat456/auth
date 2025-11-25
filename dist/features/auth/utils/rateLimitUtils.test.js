"use strict";
/**
 * Tests for rateLimitUtils - Rate limiting functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
const rateLimitUtils_1 = require("./rateLimitUtils");
describe("RateLimiter", () => {
    let limiter;
    beforeEach(() => {
        limiter = new rateLimitUtils_1.RateLimiter();
    });
    describe("check", () => {
        it("should allow first attempt", () => {
            const result = limiter.check("user1", rateLimitUtils_1.DEFAULT_RATE_LIMITS.login);
            expect(result.allowed).toBe(true);
            expect(result.resetTime).toBeUndefined();
        });
        it("should allow multiple attempts within limit", () => {
            const options = { maxAttempts: 3, windowMs: 60000 };
            expect(limiter.check("user1", options).allowed).toBe(true);
            expect(limiter.check("user1", options).allowed).toBe(true);
            expect(limiter.check("user1", options).allowed).toBe(true);
        });
        it("should reject attempt when max attempts exceeded", () => {
            const options = { maxAttempts: 2, windowMs: 60000 };
            expect(limiter.check("user1", options).allowed).toBe(true);
            expect(limiter.check("user1", options).allowed).toBe(true);
            const result = limiter.check("user1", options);
            expect(result.allowed).toBe(false);
            expect(result.resetTime).toBeDefined();
        });
        it("should return reset time when rate limited", () => {
            const options = { maxAttempts: 1, windowMs: 5000 };
            limiter.check("user1", options);
            const result = limiter.check("user1", options);
            expect(result.allowed).toBe(false);
            expect(result.resetTime).toBeDefined();
            expect(result.resetTime).toBeGreaterThan(Date.now());
        });
        it("should reset counter after window expires", () => {
            const options = { maxAttempts: 1, windowMs: 100 };
            limiter.check("user1", options);
            expect(limiter.check("user1", options).allowed).toBe(false);
            // Wait for window to expire
            jest.useFakeTimers();
            jest.advanceTimersByTime(150);
            expect(limiter.check("user1", options).allowed).toBe(true);
            jest.useRealTimers();
        });
        it("should handle multiple keys separately", () => {
            const options = { maxAttempts: 1, windowMs: 60000 };
            expect(limiter.check("user1", options).allowed).toBe(true);
            expect(limiter.check("user2", options).allowed).toBe(true);
            // Both should now be rate limited since both have 1 attempt
            expect(limiter.check("user1", options).allowed).toBe(false);
            expect(limiter.check("user2", options).allowed).toBe(false);
        });
        it("should increment count correctly", () => {
            const options = { maxAttempts: 5, windowMs: 60000 };
            for (let i = 1; i <= 5; i++) {
                const result = limiter.check("user1", options);
                expect(result.allowed).toBe(true);
            }
            expect(limiter.check("user1", options).allowed).toBe(false);
        });
        it("should clean up expired entries", () => {
            const options = { maxAttempts: 1, windowMs: 100 };
            limiter.check("user1", options);
            limiter.check("user2", options);
            jest.useFakeTimers();
            jest.advanceTimersByTime(150);
            // Calling check on a new user should trigger cleanup
            limiter.check("user3", options);
            // After cleanup, user1 should be able to attempt again
            expect(limiter.check("user1", options).allowed).toBe(true);
            jest.useRealTimers();
        });
        it("should handle edge case near reset time", () => {
            const options = { maxAttempts: 1, windowMs: 100 };
            const check1 = limiter.check("user1", options);
            expect(check1.allowed).toBe(true);
            const check2 = limiter.check("user1", options);
            expect(check2.allowed).toBe(false);
            expect(check2.resetTime).toBeDefined();
        });
        it("should support different window sizes", () => {
            const shortWindow = { maxAttempts: 1, windowMs: 50 };
            const longWindow = { maxAttempts: 1, windowMs: 5000 };
            limiter.check("user1", shortWindow);
            limiter.check("user2", longWindow);
            jest.useFakeTimers();
            jest.advanceTimersByTime(100);
            // user1 window expired
            expect(limiter.check("user1", shortWindow).allowed).toBe(true);
            // user2 window still active
            expect(limiter.check("user2", longWindow).allowed).toBe(false);
            jest.useRealTimers();
        });
    });
    describe("reset", () => {
        it("should reset rate limit for a key", () => {
            const options = { maxAttempts: 1, windowMs: 60000 };
            limiter.check("user1", options);
            expect(limiter.check("user1", options).allowed).toBe(false);
            limiter.reset("user1");
            expect(limiter.check("user1", options).allowed).toBe(true);
        });
        it("should not affect other keys when resetting", () => {
            const options = { maxAttempts: 1, windowMs: 60000 };
            limiter.check("user1", options);
            limiter.check("user2", options);
            limiter.reset("user1");
            expect(limiter.check("user1", options).allowed).toBe(true);
            expect(limiter.check("user2", options).allowed).toBe(false);
        });
        it("should handle resetting non-existent key", () => {
            expect(() => limiter.reset("nonexistent")).not.toThrow();
        });
        it("should allow re-attempting after reset", () => {
            const options = { maxAttempts: 2, windowMs: 60000 };
            limiter.check("user1", options);
            limiter.check("user1", options);
            expect(limiter.check("user1", options).allowed).toBe(false);
            limiter.reset("user1");
            expect(limiter.check("user1", options).allowed).toBe(true);
            expect(limiter.check("user1", options).allowed).toBe(true);
            expect(limiter.check("user1", options).allowed).toBe(false);
        });
    });
    describe("cleanupExpired", () => {
        it("should clean up expired entries during check", () => {
            const options = { maxAttempts: 1, windowMs: 100 };
            limiter.check("user1", options);
            jest.useFakeTimers();
            jest.advanceTimersByTime(150);
            // This check should trigger cleanup
            limiter.check("user2", options);
            // user1 should now be removable and ready for new attempt
            const result = limiter.check("user1", options);
            expect(result.allowed).toBe(true);
            jest.useRealTimers();
        });
    });
});
describe("DEFAULT_RATE_LIMITS", () => {
    it("should define login rate limits", () => {
        expect(rateLimitUtils_1.DEFAULT_RATE_LIMITS.login).toBeDefined();
        expect(rateLimitUtils_1.DEFAULT_RATE_LIMITS.login.maxAttempts).toBe(5);
        expect(rateLimitUtils_1.DEFAULT_RATE_LIMITS.login.windowMs).toBe(15 * 60 * 1000);
    });
    it("should define OTP request rate limits", () => {
        expect(rateLimitUtils_1.DEFAULT_RATE_LIMITS.otpRequest).toBeDefined();
        expect(rateLimitUtils_1.DEFAULT_RATE_LIMITS.otpRequest.maxAttempts).toBe(3);
        expect(rateLimitUtils_1.DEFAULT_RATE_LIMITS.otpRequest.windowMs).toBe(5 * 60 * 1000);
    });
    it("should define registration rate limits", () => {
        expect(rateLimitUtils_1.DEFAULT_RATE_LIMITS.registration).toBeDefined();
        expect(rateLimitUtils_1.DEFAULT_RATE_LIMITS.registration.maxAttempts).toBe(10);
        expect(rateLimitUtils_1.DEFAULT_RATE_LIMITS.registration.windowMs).toBe(60 * 60 * 1000);
    });
});
describe("authRateLimiter", () => {
    beforeEach(() => {
        rateLimitUtils_1.authRateLimiter.reset("test-key");
    });
    it("should be a global RateLimiter instance", () => {
        expect(rateLimitUtils_1.authRateLimiter).toBeInstanceOf(rateLimitUtils_1.RateLimiter);
    });
    it("should work with default rate limits", () => {
        const result1 = rateLimitUtils_1.authRateLimiter.check("test-key", rateLimitUtils_1.DEFAULT_RATE_LIMITS.login);
        expect(result1.allowed).toBe(true);
        // Fill up the limit
        for (let i = 1; i < rateLimitUtils_1.DEFAULT_RATE_LIMITS.login.maxAttempts; i++) {
            rateLimitUtils_1.authRateLimiter.check("test-key", rateLimitUtils_1.DEFAULT_RATE_LIMITS.login);
        }
        // Should now be rate limited
        const resultExceeded = rateLimitUtils_1.authRateLimiter.check("test-key", rateLimitUtils_1.DEFAULT_RATE_LIMITS.login);
        expect(resultExceeded.allowed).toBe(false);
    });
    it("should persist state across multiple checks", () => {
        const options = { maxAttempts: 2, windowMs: 60000 };
        rateLimitUtils_1.authRateLimiter.check("persistent-key", options);
        rateLimitUtils_1.authRateLimiter.check("persistent-key", options);
        const result = rateLimitUtils_1.authRateLimiter.check("persistent-key", options);
        expect(result.allowed).toBe(false);
    });
});
