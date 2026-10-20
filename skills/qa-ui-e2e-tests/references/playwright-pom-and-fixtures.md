# Playwright: Page Objects, fixtures and config

> Snippets show the shape of a good setup, not a copy-paste source of truth. Option names and defaults drift between releases: confirm each one against the official page listed in `official-docs.md` for the version installed in the project before using it, and cite that page.

## Config

```ts
import { defineConfig, devices } from '@playwright/test';
import { ENV } from './src/config/env';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,          // 0 when a passing run has side effects
  workers: process.env.CI ? 4 : undefined,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['html', { open: 'never' }], ['list'],
    ['allure-playwright', { detail: true, resultsDir: 'allure-results', globalLabels: [{ name: 'layer', value: 'e2e' }] }],
    ...(process.env.CI ? [['github'] as const, ['blob'] as const] : []),
  ],
  use: {
    baseURL: ENV.baseURL,
    extraHTTPHeaders: ENV.apiKey ? { 'X-Api-Key': ENV.apiKey } : {},   // a context-level header also reaches the SPA's own fetch calls
    locale: 'en-US', timezoneId: 'UTC', colorScheme: 'light',
    trace: 'on-first-retry', screenshot: 'only-on-failure', video: 'retain-on-failure',
    actionTimeout: 15_000,
  },
  webServer: process.env.E2E_START_SERVER ? { command: 'npm run dev', url: ENV.baseURL, reuseExistingServer: !process.env.CI, timeout: 120_000 } : undefined,
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    { name: 'api', testDir: './tests/api' },
    { name: 'chromium', testDir: './tests/e2e', use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' }, dependencies: ['setup'] },
    { name: 'firefox',  testDir: './tests/e2e', use: { ...devices['Desktop Firefox'], storageState: 'playwright/.auth/user.json' }, dependencies: ['setup'] },
    { name: 'webkit',   testDir: './tests/e2e', use: { ...devices['Desktop Safari'], storageState: 'playwright/.auth/user.json' }, dependencies: ['setup'] },
    { name: 'mobile-chrome', testDir: './tests/e2e', grep: /@mobile/, use: { ...devices['Pixel 7'] }, dependencies: ['setup'] },
  ],
});
```

## BasePage

```ts
export abstract class BasePage {
  constructor(protected readonly page: Page) {}
  /** Attribute hook; immune to randomised ids/classes. Prefer getByRole when a role+name exists. */
  protected ui(name: string): Locator { return this.page.getByTestId(name); }   // testIdAttribute configurable in use.testIdAttribute
  async goto(path: string) { await this.page.goto(path); }
}
```

Set `use.testIdAttribute: 'data-qa'` in config when the app uses a non-default attribute.

## A page

```ts
export class DashboardPage extends BasePage {
  readonly todoInput = this.page.getByRole('textbox', { name: 'New note' });
  readonly addButton = this.page.getByRole('button', { name: 'Add' });
  readonly list = this.ui('todos-list');
  readonly deleteDialog = this.page.getByRole('dialog', { name: 'Delete note' });

  async open() {
    await this.goto('/dashboard');
    await expect(this.todoInput).toBeVisible();          // readiness, not business assertion
  }
  todoByTitle(title: string): Locator { return this.list.getByRole('listitem').filter({ hasText: title }); }
  async addTodo(title: string) {
    await this.todoInput.fill(title);
    await this.addButton.click();
    await expect(this.todoByTitle(title)).toBeVisible();  // proves the action landed
  }
  async deleteTodo(title: string) {
    await this.todoByTitle(title).getByRole('button', { name: `Delete ${title}` }).click();
    await this.deleteDialog.getByRole('button', { name: 'Confirm' }).click();
    await expect(this.todoByTitle(title)).toHaveCount(0);
  }
}
```

Rules: locators as `readonly` fields; methods are verbs; queries return `Locator`; only readiness/landing expectations inside; business assertions in the spec.

## Fixtures

```ts
// src/fixtures/e2e-fixtures.ts
import { test as apiTest, expect } from './test-fixtures';     // api, adminApi, sharedUser, analytics ...

type Pages = { loginPage: LoginPage; dashboardPage: DashboardPage; profilePage: ProfilePage };

export const test = apiTest.extend<Pages & { consoleErrors: string[] }>({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {                       // browser hygiene for every document
      const style = document.createElement('style');
      style.textContent = '*,*::before,*::after{transition-duration:0s!important;animation-duration:0s!important;animation-delay:0s!important}';
      document.head.appendChild(style);
    });
    await use(page);
  },
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    const ignore = [/favicon/, /ResizeObserver/, /third-party-analytics/];
    page.on('console', m => { if (m.type() === 'error' && !ignore.some(r => r.test(m.text()))) errors.push(m.text()); });
    page.on('pageerror', e => errors.push(e.message));
    await use(errors);
    expect.soft(errors, 'unexpected console errors').toEqual([]);
  },
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  dashboardPage: async ({ page }, use) => use(new DashboardPage(page)),
  profilePage: async ({ page }, use) => use(new ProfilePage(page)),
});
export { expect };
```

## Spec

```ts
test.describe('Todos @e2e', () => {
  test('creates, completes and deletes a note', async ({ dashboardPage }) => {
    const title = `note-${uniqueSuffix()}`;
    await dashboardPage.open();
    await dashboardPage.addTodo(title);
    await dashboardPage.todoByTitle(title).getByRole('checkbox').check();
    await expect(dashboardPage.todoByTitle(title).getByRole('checkbox')).toBeChecked();
    await dashboardPage.deleteTodo(title);
  });

  test('a note created in the UI is captured by analytics', async ({ dashboardPage, analytics, sharedUser }) => {
    await sharedUser.api.patchProfile({ internalAnalyticsConsent: true });     // precondition via API
    const before = await analytics.count({ email: sharedUser.credentials.email, type: 'todoCreate' });
    await dashboardPage.open();
    await dashboardPage.addTodo(`tracked-${uniqueSuffix()}`);
    const events = await analytics.waitForCount({ email: sharedUser.credentials.email, type: 'todoCreate' }, before + 1);
    expect(events.at(-1)?.status).toBe('success');
  });
});
```

## Steps and attachments

Use `test.step('name', async () => ...)` for multi-stage journeys so the report and trace read as the user story; attach artefacts a failure needs (`testInfo.attach('funnel-path.json', { body, contentType: 'application/json' })`); add `testInfo.annotations.push({ type: 'run-identity', description: email })` so leftovers are traceable.

## Network control

`page.route('**/api/payments/**', r => r.fulfill({ json: stub }))` for third-party or non-deterministic dependencies; `page.waitForResponse(r => r.url().includes('/api/todos') && r.ok())` to synchronise on a specific request when no UI signal exists; HAR recording (`routeFromHAR`) for stable replay of read-only data.

## ESLint

`eslint-plugin-playwright` recommended config: forbids `waitForTimeout`, `page.$`, missing awaits on expects, `.first()`/`.nth()` via `no-nth-methods`, conditionals in tests. Pair with `tsc --noEmit`.
