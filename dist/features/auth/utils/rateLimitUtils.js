"use strict";
/**
 * Rate limiting utilities for authentication endpoints
 * Uses a simple in-memory approach without background processes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimiter = exports.DEFAULT_RATE_LIMITS = exports.RateLimiter = void 0;
class RateLimiter {
    constructor() {
        this.attempts = new Map();
    }
    check(key, options) {
        const now = Date.now();
        const state = this.attempts.get(key);
        // Clean up expired entries before checking
        this.cleanupExpired(now);
        if (!state) {
            // First attempt
            this.attempts.set(key, {
                count: 1,
                resetTime: now + options.windowMs
            });
            return { allowed: true };
        }
        if (now >= state.resetTime) {
            // Window has passed, reset
            this.attempts.set(key, {
                count: 1,
                resetTime: now + options.windowMs
            });
            return { allowed: true };
        }
        if (state.count >= options.maxAttempts) {
            // Rate limit exceeded
            return {
                allowed: false,
                resetTime: state.resetTime
            };
        }
        // Increment count
        this.attempts.set(key, {
            count: state.count + 1,
            resetTime: state.resetTime
        });
        return { allowed: true };
    }
    cleanupExpired(now) {
        // Clean up expired entries
        for (const [key, state] of this.attempts.entries()) {
            if (now >= state.resetTime) {
                this.attempts.delete(key);
            }
        }
    }
    reset(key) {
        this.attempts.delete(key);
    }
}
exports.RateLimiter = RateLimiter;
// Default rate limiting options
exports.DEFAULT_RATE_LIMITS = {
    login: {
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000 // 15 minutes
    },
    otpRequest: {
        maxAttempts: 3,
        windowMs: 5 * 60 * 1000 // 5 minutes
    },
    registration: {
        maxAttempts: 10,
        windowMs: 60 * 60 * 1000 // 1 hour
    }
};
// Global rate limiter instance
exports.authRateLimiter = new RateLimiter();
