# React Native / Expo: cheap layers before device tests

> Snippets show the shape of a good setup, not a copy-paste source of truth. Option names and defaults drift between releases: when you are not sure an option exists in the installed version, check it (installed types, a type-check, or the page in `official-docs.md`) before relying on it, and name the page in the reply if you used one.

## Component and logic tests

- Pure logic (parsers, pricing, offline queue policy, cache keys) in plain unit tests (`node --test`, Vitest or Jest) with no RN imports; this is where most mobile bugs are cheapest to catch.
- Components with `@testing-library/react-native` under `jest-expo` preset: render, `fireEvent`/`userEvent`, query by `getByRole`/`getByLabelText`/`getByTestId`; mock native modules (`expo-secure-store`, `AsyncStorage`) with their official jest mocks.
- Navigation and state flows with a mocked API (`msw`: `setupServer` from `msw/node` under Jest; in the running app `@msw/react-native` for msw 3 or `msw/native` for msw 2) before a single device test.

## Web build smoke with Playwright

Expo web (`expo start --web`) renders the same screens in a browser; Playwright against it catches layout, routing and i18n regressions in seconds and runs on any CI runner. It does not replace device tests for native modules, gestures, permissions and performance.

```js
// playwright.config.js (web build)
module.exports = defineConfig({
  testDir: './tests/web',
  webServer: process.env.CI ? [
    { command: 'npm run dev', cwd: './server', url: 'http://127.0.0.1:3000/health', timeout: 120_000, reuseExistingServer: false },
    { command: 'npx expo start --web --port 8081 --non-interactive', url: 'http://localhost:8081', timeout: 180_000, reuseExistingServer: false, env: { ...process.env, CI: '1', EXPO_NO_TELEMETRY: '1' } },
  ] : undefined,
  use: { baseURL: 'http://localhost:8081', trace: 'on-first-retry', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
```

Assert layout facts per viewport (sidebar vs bottom tabs, no horizontal overflow), route guards, i18n copy, console errors (allow-list), and keep `baseURL` in config rather than literals. `testID` on RN Web becomes `data-testid`, so `getByTestId` works across web and native with one hook.

## Test hooks in RN

Give every interactive element a `testID` (unique, stable, kebab-case: `login-submit`) and a meaningful `accessibilityLabel`/`accessibilityRole`. On iOS Appium reads `testID` as the accessibility id; on Android use `accessibilityLabel` for content-desc or enable `testID` → `resource-id` via RN ≥ 0.64 defaults. Document the convention in the app repo so devs add hooks when they add screens.

## Server side of a mobile product

Mobile apps lean on an API: keep the in-process route tests (`supertest`) and API contract tests in the same repo or pipeline, and let device tests assume a healthy backend seeded via API (`seed:qa` scripts). Keep a Bruno/Postman collection for manual exploration next to the automated clients.
