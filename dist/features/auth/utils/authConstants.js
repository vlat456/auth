"use strict";
/**
 * Path: src/features/auth/utils/authConstants.ts
 *
 * Configuration constants for authentication service
 * Centralized location for timeout values and other config
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SESSION_CHECK_TIMEOUT_MS = exports.AUTH_OPERATION_TIMEOUT_MS = void 0;
/**
 * Timeout for promise-based authentication methods (ms)
 *
 * This timeout protects against the state machine getting stuck:
 * - If auth operation doesn't complete within this time, promise rejects
 * - Prevents UI from appearing frozen indefinitely
 * - Allows graceful error handling and user feedback
 *
 * Scenarios that need timeout:
 * - Network timeout (server not responding)
 * - State machine bug (state transition never triggers)
 * - Concurrent event conflicts (preventing proper state flow)
 *
 * Value: 30 seconds - balance between:
 * - Long enough for slow networks
 * - Short enough to catch real issues
 */
exports.AUTH_OPERATION_TIMEOUT_MS = 30 * 1000; // 30 seconds
/**
 * Timeout for session check on app startup (ms)
 * May include network request + storage read, so slightly longer
 */
exports.SESSION_CHECK_TIMEOUT_MS = 35 * 1000; // 35 seconds
