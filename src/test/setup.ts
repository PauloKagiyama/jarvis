/**
 * Minimal browser stubs for the service-layer tests.
 *
 * ConversationMemoryService touches exactly two browser globals — localStorage
 * and navigator.userAgent — so a pair of stubs is lighter and far less brittle
 * than pulling a full DOM implementation into the test run.
 */

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

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
    this.store.set(key, String(value));
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: new MemoryStorage(),
  writable: true,
});

if (!('navigator' in globalThis)) {
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: 'Chrome on macOS test runner', onLine: true },
    writable: true,
  });
}
