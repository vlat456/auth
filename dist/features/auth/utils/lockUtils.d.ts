/**
 * A simple mutex implementation to prevent concurrent operations
 */
export declare class Mutex {
    private _locked;
    private _waiting;
    acquire(): Promise<() => void>;
    private _release;
}
/**
 * A decorator that ensures only one instance of an async function runs at a time
 * @param target - The class instance (ignored, for decorator compatibility)
 * @param propertyKey - The method name (ignored, for decorator compatibility)
 * @param descriptor - The property descriptor for the method
 * @returns A descriptor with the locked method
 */
export declare function withLock(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor;
/**
 * A function that wraps an async function with a lock
 * @param fn The async function to wrap
 * @returns A new function that executes the original function with mutual exclusion
 */
export declare function createLockedFunction<T extends (...args: any[]) => Promise<any>>(fn: T): T;
