import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    silent: true,
    onConsoleLog: () => false,
    dangerouslyIgnoreUnhandledErrors: true,
    maxWorkers: 1,
    hookTimeout: 30000,
    testTimeout: 30000,
    teardownTimeout: 10000,
  },
});
