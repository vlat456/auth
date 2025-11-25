/**
 * Rate limiting utilities for authentication endpoints
 * Uses a simple in-memory approach without background processes
 */
export interface RateLimitOptions {
    maxAttempts: number;
    windowMs: number;
}
export interface RateLimitState {
    count: number;
    resetTime: number;
}
export declare class RateLimiter {
    private attempts;
    check(key: string, options: RateLimitOptions): {
        allowed: boolean;
        resetTime?: number;
    };
    private cleanupExpired;
    reset(key: string): void;
}
export declare const DEFAULT_RATE_LIMITS: {
    login: {
        maxAttempts: number;
        windowMs: number;
    };
    otpRequest: {
        maxAttempts: number;
        windowMs: number;
    };
    registration: {
        maxAttempts: number;
        windowMs: number;
    };
};
export declare const authRateLimiter: RateLimiter;
