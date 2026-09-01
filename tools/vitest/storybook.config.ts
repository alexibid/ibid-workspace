import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { storybookAngularVitest } from "@storybook/angular-vite/vitest";
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    silent: true,
    poolOptions: {
      threads: {
        singleThread: true
      }
    },
    onConsoleLog: () => false,
    include: ['src/**/*.spec.ts'],
    exclude: ['node_modules/**', '.claude/**', 'platforms/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/app/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/**/*.stories.ts', 'src/mocks/**', 'src/main.ts']
    },
    projects: [{
      extends: true,
      test: {
        silent: true,
        globals: true,
        environment: 'jsdom',
        onConsoleLog: () => false,
        hookTimeout: 30000,
        testTimeout: 30000,
        teardownTimeout: 10000
      }
    }, {
      extends: true,
      plugins: [
      storybookAngularVitest({}),
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});