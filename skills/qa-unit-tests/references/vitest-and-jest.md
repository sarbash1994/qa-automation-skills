# Runner recipes: Vitest, Jest, node:test

> Snippets show the shape of a good setup, not a copy-paste source of truth. Option names and defaults drift between releases: confirm each one against the official page listed in `official-docs.md` for the version installed in the project before using it, and cite that page.

## Vitest

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'node',                    // 'jsdom' or 'happy-dom' per file via // @vitest-environment jsdom
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./test/setup.ts'],        // msw server, matchers, env
    restoreMocks: true, clearMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/domain/**'],
      thresholds: { lines: 85, branches: 80, functions: 85, statements: 85 },
    },
  },
});
```

Scripts: `"test": "vitest run"`, `"test:watch": "vitest"`, `"test:coverage": "vitest run --coverage"`. Use `vi.mock('./module', () => ({ fn: vi.fn() }))` (hoisted; factory must not reference outer variables unless via `vi.hoisted`), `vi.useFakeTimers()` + `vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))`, `vi.spyOn(obj, 'method')`. Browser mode (`test.browser`) for components that need real layout; jsdom for most.

## Jest

```ts
// jest.config.ts
import type { Config } from 'jest';
const config: Config = {
  testEnvironment: 'node',                   // 'jsdom' for components; per file: /** @jest-environment jsdom */
  transform: { '^.+\\.(t|j)sx?$': '@swc/jest' },   // or ['ts-jest', { isolatedModules: true }]
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts?(x)', '**/*.test.ts?(x)'],
  setupFiles: ['<rootDir>/test/env.ts'],     // runs before modules load: env vars
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],   // matchers, msw server
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1', '\\.(css|scss)$': '<rootDir>/test/styleMock.js' },
  clearMocks: true, restoreMocks: true,
  collectCoverageFrom: ['src/lib/**/*.ts', 'src/domain/**/*.ts', '!**/*.d.ts'],
  coverageThreshold: { './src/domain/': { lines: 90, branches: 85 } },
  fakeTimers: { enableGlobally: false },
};
export default config;
```

ESM-only dependencies: either `transformIgnorePatterns` exceptions, `moduleNameMapper` to a CJS build, or run Jest with `--experimental-vm-modules`. `test.failing` documents known bugs. `jest.mock` is hoisted above imports; `jest.requireActual` to partially mock. React Native: `preset: 'jest-expo'` (or `react-native`), plus the official mocks for native modules.

## node:test

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugOf } from '../src/slug.js';
test('takes the last path segment', () => { assert.equal(slugOf('https://x/a/b/'), 'b'); });
```

Run `node --test` (add `--test-reporter=junit` for CI); use `mock.timers` and `mock.method` from `node:test` for doubles. Good for dependency-free scripts and tooling repositories.

## Common setup file

```ts
// test/setup.ts
import { afterAll, afterEach, beforeAll } from 'vitest';   // or jest globals
import { server } from './msw-server';
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## TypeScript

Test files type-checked (`tsc --noEmit` includes `**/*.test.ts`); `@types/jest` or Vitest globals typed via `types: ["vitest/globals"]` when `globals: true`; prefer explicit imports over globals in new code.

## Speed

Keep tests isolated so the runner can parallelise files; avoid heavy module-level setup; use `--changed`/`related` modes locally; `--shard` in CI only past the one-minute budget.
