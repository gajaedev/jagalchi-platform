import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';

expect.extend(matchers);

class TestStorage implements Storage {
  private readonly store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

if (typeof window !== 'undefined') {
  const localStorage = new TestStorage();
  const sessionStorage = new TestStorage();

  Object.defineProperty(globalThis, 'Storage', {
    value: TestStorage,
    configurable: true,
  });
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorage,
    configurable: true,
  });
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: sessionStorage,
    configurable: true,
  });
  Object.defineProperty(window, 'Storage', {
    value: TestStorage,
    configurable: true,
  });
  Object.defineProperty(window, 'localStorage', {
    value: localStorage,
    configurable: true,
  });
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorage,
    configurable: true,
  });
}

afterEach(() => {
  cleanup();
});
