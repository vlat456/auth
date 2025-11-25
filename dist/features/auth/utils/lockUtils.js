"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mutex = void 0;
exports.withLock = withLock;
exports.createLockedFunction = createLockedFunction;
/**
 * A simple mutex implementation to prevent concurrent operations
 */
class Mutex {
    constructor() {
        this._locked = false;
        this._waiting = [];
        this._release = () => {
            this._locked = false;
            if (this._waiting.length > 0) {
                const next = this._waiting.shift();
                if (next)
                    next();
            }
        };
    }
    async acquire() {
        return new Promise((resolve) => {
            if (!this._locked) {
                this._locked = true;
                resolve(this._release);
            }
            else {
                this._waiting.push(() => {
                    this._locked = true;
                    resolve(this._release);
                });
            }
        });
    }
}
exports.Mutex = Mutex;
/**
 * A decorator that ensures only one instance of an async function runs at a time
 * @param target - The class instance (ignored, for decorator compatibility)
 * @param propertyKey - The method name (ignored, for decorator compatibility)
 * @param descriptor - The property descriptor for the method
 * @returns A descriptor with the locked method
 */
function withLock(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    const mutex = new Mutex(); // One mutex per method
    descriptor.value = async function (...args) {
        const release = await mutex.acquire();
        try {
            return await originalMethod.apply(this, args);
        }
        finally {
            release();
        }
    };
    return descriptor;
}
/**
 * A function that wraps an async function with a lock
 * @param fn The async function to wrap
 * @returns A new function that executes the original function with mutual exclusion
 */
function createLockedFunction(fn) {
    const mutex = new Mutex();
    return (async function (...args) {
        const release = await mutex.acquire();
        try {
            return await fn.apply(this, args);
        }
        finally {
            release();
        }
    });
}
