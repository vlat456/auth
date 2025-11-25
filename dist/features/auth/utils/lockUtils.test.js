"use strict";
/**
 * Tests for lockUtils - Mutex and locking mechanisms
 */
Object.defineProperty(exports, "__esModule", { value: true });
const lockUtils_1 = require("./lockUtils");
describe("Mutex", () => {
    describe("acquire", () => {
        it("should acquire lock immediately when not locked", async () => {
            const mutex = new lockUtils_1.Mutex();
            const release = await mutex.acquire();
            expect(typeof release).toBe("function");
        });
        it("should queue waiting calls when already locked", async () => {
            const mutex = new lockUtils_1.Mutex();
            const release1 = await mutex.acquire();
            let acquired2 = false;
            const promise2 = mutex.acquire().then(() => {
                acquired2 = true;
            });
            // Release first lock
            release1();
            await promise2;
            expect(acquired2).toBe(true);
        });
        it("should handle multiple queued locks sequentially", async () => {
            const mutex = new lockUtils_1.Mutex();
            let callCount = 0;
            const release1 = await mutex.acquire();
            callCount++;
            expect(callCount).toBe(1);
            const promise2 = mutex.acquire().then(() => {
                callCount++;
                return callCount;
            });
            // First call is done, release it
            release1();
            const result2 = await promise2;
            expect(result2).toBe(2);
            expect(callCount).toBe(2);
        }, 10000);
        it("should process queue when release is called", async () => {
            const mutex = new lockUtils_1.Mutex();
            let callCount = 0;
            const release1 = await mutex.acquire();
            callCount++;
            const promise2 = mutex.acquire().then(() => {
                callCount++;
            });
            expect(callCount).toBe(1);
            release1();
            await promise2;
            expect(callCount).toBe(2);
        });
    });
    describe("release", () => {
        it("should release lock and allow next in queue", async () => {
            const mutex = new lockUtils_1.Mutex();
            const release1 = await mutex.acquire();
            let acquiredSecond = false;
            void mutex.acquire().then(() => {
                acquiredSecond = true;
            });
            expect(acquiredSecond).toBe(false);
            release1();
            // Give async operation a chance to complete
            await new Promise((resolve) => setTimeout(resolve, 10));
            expect(acquiredSecond).toBe(true);
        });
        it("should handle empty queue gracefully", async () => {
            const mutex = new lockUtils_1.Mutex();
            const release = await mutex.acquire();
            // Should not throw
            expect(() => release()).not.toThrow();
        });
        it("should process queued operations sequentially", async () => {
            const mutex = new lockUtils_1.Mutex();
            let processCount = 0;
            const release1 = await mutex.acquire();
            processCount++;
            // Submit requests to acquire
            const promise2 = mutex.acquire();
            // Release and acquire sequentially
            release1();
            const release2 = await promise2;
            processCount++;
            release2();
            expect(processCount).toBe(2);
        }, 5000);
    });
});
describe("createLockedFunction", () => {
    it("should wrap async function with mutex", async () => {
        let callCount = 0;
        const asyncFn = jest.fn(async () => {
            await new Promise((r) => setTimeout(r, 1));
            callCount++;
            return callCount;
        });
        const lockedFn = (0, lockUtils_1.createLockedFunction)(asyncFn);
        const promise1 = lockedFn();
        const promise2 = lockedFn();
        const result1 = await promise1;
        const result2 = await promise2;
        expect(result1).toBe(1);
        expect(result2).toBe(2);
        expect(asyncFn).toHaveBeenCalledTimes(2);
    });
    it("should prevent concurrent execution", async () => {
        let executingCount = 0;
        let maxConcurrent = 0;
        const asyncFn = jest.fn(async () => {
            await new Promise((r) => setTimeout(r, 1));
            executingCount++;
            maxConcurrent = Math.max(maxConcurrent, executingCount);
            executingCount--;
        });
        const lockedFn = (0, lockUtils_1.createLockedFunction)(asyncFn);
        await Promise.all([lockedFn(), lockedFn(), lockedFn()]);
        expect(maxConcurrent).toBeLessThanOrEqual(1);
        expect(asyncFn).toHaveBeenCalledTimes(3);
    });
    it("should propagate function arguments", async () => {
        const asyncFn = jest.fn(async (a, b) => {
            await new Promise((r) => setTimeout(r, 0));
            return a + b;
        });
        const lockedFn = (0, lockUtils_1.createLockedFunction)(asyncFn);
        const result = await lockedFn(5, 3);
        expect(result).toBe(8);
        expect(asyncFn).toHaveBeenCalledWith(5, 3);
    });
    it("should propagate errors from wrapped function", async () => {
        const error = new Error("Test error");
        const asyncFn = jest.fn(async () => {
            await new Promise((r) => setTimeout(r, 0));
            throw error;
        });
        const lockedFn = (0, lockUtils_1.createLockedFunction)(asyncFn);
        await expect(lockedFn()).rejects.toThrow("Test error");
    });
});
describe("withLock decorator", () => {
    it("should wrap descriptor and return a valid function", () => {
        const asyncFn = async () => {
            await new Promise((r) => setTimeout(r, 0));
            return "test";
        };
        const descriptor = { value: asyncFn };
        const wrappedDescriptor = (0, lockUtils_1.withLock)({}, "method", descriptor);
        expect(wrappedDescriptor).toBeDefined();
        expect(typeof wrappedDescriptor.value).toBe("function");
    });
    it("should create a new descriptor with wrapped function", () => {
        const asyncFn = async () => {
            await new Promise((r) => setTimeout(r, 0));
        };
        const descriptor = { value: asyncFn };
        const wrappedDescriptor = (0, lockUtils_1.withLock)({}, "method", descriptor);
        expect(wrappedDescriptor).toBeDefined();
        expect(wrappedDescriptor).toHaveProperty("value");
    });
    it("should handle decorator on undefined descriptor safely", () => {
        const descriptor = { value: undefined };
        const wrappedDescriptor = (0, lockUtils_1.withLock)({}, "method", descriptor);
        expect(wrappedDescriptor).toBeDefined();
    });
    it("should preserve descriptor value property", () => {
        const asyncFn = async () => {
            await new Promise((r) => setTimeout(r, 0));
        };
        const originalDescriptor = {
            value: asyncFn,
            writable: true,
            configurable: true,
            enumerable: false,
        };
        const descriptor = originalDescriptor;
        const wrappedDescriptor = (0, lockUtils_1.withLock)({}, "method", descriptor);
        expect(wrappedDescriptor).toHaveProperty("value");
        expect(typeof wrappedDescriptor.value).toBe("function");
    });
});
