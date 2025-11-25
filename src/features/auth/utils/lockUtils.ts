/**
 * A simple mutex implementation to prevent concurrent operations
 */
export class Mutex {
  private _locked = false;
  private _waiting: Array<() => void> = [];

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      if (!this._locked) {
        this._locked = true;
        resolve(this._release);
      } else {
        this._waiting.push(() => {
          this._locked = true;
          resolve(this._release);
        });
      }
    });
  }

  private _release = () => {
    this._locked = false;
    if (this._waiting.length > 0) {
      const next = this._waiting.shift();
      if (next) next();
    }
  };
}

/**
 * A decorator that ensures only one instance of an async function runs at a time
 * @param target - The class instance (ignored, for decorator compatibility)
 * @param propertyKey - The method name (ignored, for decorator compatibility)
 * @param descriptor - The property descriptor for the method
 * @returns A descriptor with the locked method
 */
export function withLock(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;
  const mutex = new Mutex(); // One mutex per method

  descriptor.value = async function (this: any, ...args: any[]) {
    const release = await mutex.acquire();
    try {
      return await originalMethod.apply(this, args);
    } finally {
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
export function createLockedFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  const mutex = new Mutex();

  return (async function (this: any, ...args: any[]) {
    const release = await mutex.acquire();
    try {
      return await fn.apply(this, args);
    } finally {
      release();
    }
  }) as T;
}