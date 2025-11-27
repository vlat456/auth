/**
 * Path: src/features/auth/utils/promiseWithTimeout.ts
 *
 * Utility for wrapping state machine subscriptions with timeout protection
 * Prevents promises from hanging indefinitely if state transitions never trigger
 */
import { SnapshotFrom } from "xstate";
import { createAuthMachine } from "../machine/authMachine";
type AuthSnapshot = SnapshotFrom<ReturnType<typeof createAuthMachine>>;
/**
 * Wraps a promise subscription pattern with timeout protection
 *
 * Usage example:
 * ```typescript
 * const promise = promiseWithTimeout(
 *   (subscribe, resolve, reject) => {
 *     const cleanup = subscribe((state) => {
 *       if (state.matches("authorized")) {
 *         cleanup();
 *         resolve(state.context.session!);
 *       }
 *     });
 *     this._send({ type: "LOGIN", payload });
 *   },
 *   30000,
 * );
 * ```
 *
 * Benefits:
 * - Reusable pattern avoids code duplication
 * - Consistent timeout handling across all promise-based methods
 * - Automatic cleanup on timeout (unsubscribe + clearTimeout)
 * - Type-safe wrapper
 */
export declare function promiseWithTimeout<T>(executor: (subscribe: (callback: (state: AuthSnapshot) => void) => () => void, resolve: (value: T) => void, reject: (reason?: unknown) => void) => void, timeoutMs: number): Promise<T>;
/**
 * Helper type for promise subscription callbacks
 * Defines the signature of state callbacks used in promise-based auth methods
 */
export type SubscribeCallback = (state: AuthSnapshot) => void;
/**
 * Helper type for subscription cleanup function
 */
export type Unsubscribe = () => void;
export {};
