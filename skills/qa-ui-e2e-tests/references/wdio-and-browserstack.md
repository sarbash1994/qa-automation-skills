# WebdriverIO and BrowserStack

> Snippets show the shape of a good setup, not a copy-paste source of truth. Option names and defaults drift between releases: when you are not sure an option exists in the installed version, check it (installed types, a type-check, or the page in `official-docs.md`) before relying on it, and name the page in the reply if you used one.

## When WebdriverIO

Appium and web in one runner; an existing Selenium grid; BrowserStack/Sauce-native reporting; teams already on WDIO. Otherwise Playwright.

## wdio.conf.ts skeleton (v9)

```ts
import type { Options } from '@wdio/types';
export const config: Options.Testrunner = {
  runner: 'local',
  tsConfigPath: './tsconfig.json',
  specs: ['./tests/e2e/**/*.spec.ts'],
  maxInstances: Number(process.env.WDIO_MAX_INSTANCES ?? 5),
  baseUrl: process.env.BASE_URL,
  waitforTimeout: 10_000,
  connectionRetryTimeout: 120_000,
  connectionRetryCount: 3,
  framework: 'mocha',
  mochaOpts: { ui: 'bdd', timeout: 60_000 },
  reporters: ['spec', ['allure', { outputDir: 'allure-results', disableWebdriverStepsReporting: true, disableWebdriverScreenshotsReporting: false }]],
  capabilities: [{ browserName: 'chrome', 'goog:chromeOptions': { args: ['--headless=new', '--window-size=1440,900'] } }],
  afterTest: async (_test, _ctx, { passed }) => { if (!passed) await browser.takeScreenshot(); },
};
```

Page objects: class per screen with getters returning `$()`/`$$()` elements (`get submit() { return $('button[type=submit]') }`), actions awaiting `waitForDisplayed`/`waitForClickable`; use `expect` from `@wdio/globals` (`await expect($(sel)).toBeDisplayed()`); never `browser.pause` outside documented settles. Selectors: `aria/...`, `=Text`, `*=partial`, `[data-testid=...]`.

## BrowserStack Automate (web) via the WDIO service

```ts
import { config as base } from './wdio.conf';
export const config: Options.Testrunner = {
  ...base,
  user: process.env.BROWSERSTACK_USERNAME,
  key: process.env.BROWSERSTACK_ACCESS_KEY,
  hostname: 'hub.browserstack.com',
  services: [['browserstack', {
    browserstackLocal: !!process.env.BS_LOCAL,          // private/staging targets
    testReporting: true,                                  // Test Observability dashboard
    testReportingOptions: { projectName: 'My app web', buildName: process.env.BUILD_NAME ?? 'local' },
  }]],
  commonCapabilities: { 'bstack:options': { projectName: 'My app web', buildName: process.env.BUILD_NAME ?? 'local', debug: true, networkLogs: true } },
  capabilities: [
    { browserName: 'Chrome', 'bstack:options': { os: 'Windows', osVersion: '11', browserVersion: 'latest' } },
    { browserName: 'Safari', 'bstack:options': { os: 'OS X', osVersion: 'Sonoma', browserVersion: 'latest' } },
    { browserName: 'Chrome', 'bstack:options': { deviceName: 'Samsung Galaxy S23', osVersion: '13.0', realMobile: true } },
  ],
};
```

Mark session status with the service (automatic with `testReporting`) or `browser.executeScript('browserstack_executor: {"action":"setSessionStatus","arguments":{"status":"failed","reason":"..."}}')`. Build names must be stable per CI run (`${GITHUB_RUN_ID}`) so sessions group. Credentials only from env/CI secrets.

## Playwright on BrowserStack

Two supported paths: the BrowserStack Node SDK (`browserstack-node-sdk` + `browserstack.yml` listing platforms, `parallelsPerPlatform`, `browserstackLocal`) wrapping `npx playwright test`, or connecting manually with `chromium.connect(\`wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(JSON.stringify(caps))}\`)` in a custom `browser` fixture. Check the current recommendation in BrowserStack docs before wiring; the SDK path changes most often. Keep local runs on local browsers; BrowserStack for the matrix in CI.

## Reading results back

`GET https://api.browserstack.com/automate/builds.json`, `/automate/builds/{id}/sessions.json` with Basic auth `user:key`. Map `passed/done → success`, `failed/error → failure`, else running. Upsert by `hashed_id` to avoid duplicates and to catch status changes between syncs.

## Parallelism and cost

`maxInstances` ≤ your plan's parallel limit; split by spec files; keep the BrowserStack matrix to the engines/devices your analytics show, and run it nightly or on main, not on every PR.
