import { AsyncLocalStorage } from 'node:async_hooks';

interface DispatchContext {
  bulk: boolean;
}

const storage = new AsyncLocalStorage<DispatchContext>();

export function runBulk<T>(fn: () => Promise<T>): Promise<T> {
  return storage.run({ bulk: true }, fn);
}

export function isBulk(): boolean {
  return !!storage.getStore()?.bulk;
}
