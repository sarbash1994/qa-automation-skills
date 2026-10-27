---
name: qa-ui-e2e-tests
description: Design, write and stabilise browser end-to-end and UI test suites with Playwright Test (TypeScript) or WebdriverIO v9 - locator strategy (roles, labels, test ids), Page Objects and custom fixtures, authentication via storage state, cross-browser and responsive projects, visual regression with toHaveScreenshot, axe accessibility checks, UI-to-backend cross-checks, resilient navigation of volatile A/B-tested funnels, BrowserStack for the web matrix. Use when the user wants e2e or UI tests written, reviewed or made less flaky, asks about Page Objects, locators or selectors, Playwright fixtures or config, storage-state login, WebdriverIO, or migrating a Cypress/Selenium suite. Not for driving a browser interactively to check or debug a page (a browser-automation or webapp-testing skill does that), nor for API-only or mobile-device suites (see the sibling qa skills).
---

# UI and E2E Tests

Target: few, high-value browser journeys that run in parallel, authenticate once, seed data through the API, locate elements the way users do, and fail with a trace that explains itself. Everything below follows the Playwright team's own best-practice guidance plus hard-won patterns for hostile targets; `references/` has complete code. References to sibling skills apply only when they are installed; otherwise continue with this skill and the project's conventions.

## 0. Official documentation and the reply

Look up official documentation when it pays, not on every answer: when you are not certain an option, flag, action input or capability key exists in the installed version, when the installed major is newer than the one you know well, when something failed or behaved unexpectedly, or when the user asks for sources. Installed types or source, a type-check and `--help` are cheaper evidence and often enough. Check first: GitHub Pages actions' current majors and inputs, recently added Playwright options, WDIO BrowserStack service keys. Triggers, the "Check first" list and the URL map: `references/official-docs.md`.

In the reply, name each page you used (title or URL) next to the claim it confirms, mark details you were unsure of and could not check as unverified, and list every file you created or changed, including lockfiles, config and shared helpers, with one line on why. When you notice something outside the request that should change (another spec, a leaked secret, a broken script), report it and offer the change instead of making it; edit beyond the request only when the requested work cannot be correct without it, and say so.

## 1. Scope the browser layer deliberately

- Browser tests prove **user-visible behaviour of critical journeys** and rendering across engines. Validation rules, permissions, pagination and data contracts belong in API tests; decision logic belongs in unit tests. Each E2E test should be defensible as "a user would notice this".
- One UI login test; everything else authenticates via storage state or API token (`references/auth-and-state.md`).
- Seed and clean up data through the API (fixtures), never by clicking through forms you are not testing.
- Do not test third-party sites (payment pages, OAuth providers, analytics vendors) in the browser; mock them at the network boundary (`page.route`, sandbox accounts, test modes).
- Cross-browser: run the same specs as projects per engine when rendering matters; one engine when the check is a business flow with side effects.

## 2. Locator strategy (in order of preference)

1. `getByRole(role, { name })` with the real accessible name (any language) - mirrors users and assistive tech.
2. `getByLabel`, `getByPlaceholder`, `getByText` for form fields and copy that is part of the contract.
3. `getByTestId` / a project attribute hook (`data-testid`, `data-qa`) when roles are ambiguous or the app randomises ids and classes. Ask the dev team for hooks on choice buttons and primary actions; this is a testability requirement, not a favour.
4. Chaining and filtering: `list.getByRole('listitem').filter({ hasText: title }).getByRole('checkbox')`.
5. Never: CSS classes (Tailwind, hashed modules), generated ids, XPath by position, `.first()`/`.nth()` without a filter and a comment.

Web-first assertions only (`await expect(locator).toBeVisible()`, `toHaveText`, `toHaveURL`, `toHaveCount`); no `isVisible()` checks as assertions, no `waitForTimeout`, no `networkidle` as a synchronisation primitive. Wait for an app-produced readiness signal (a server-populated field becomes non-empty, a heading appears).

## 3. Page Objects and fixtures that stay thin

- `BasePage` holds the hook helper (`ui(name)`), navigation and one-time state seeding; each `XPage` has `readonly` locators and short verb methods (`open`, `login`, `addTodo`) that end with the expectation proving the action landed. Queries return `Locator` (`todoByTitle(title)`), not booleans.
- Assertions about business outcomes live in tests, not in page methods.
- Provide pages through fixtures (`test.extend<{ dashboardPage: DashboardPage }>`), composed on top of API fixtures so a UI test can seed state and cross-check backend streams (analytics, audit) in the same test.
- Browser hygiene belongs in a `page` fixture override: disable CSS animations via `addInitScript`, pin feature flags/A-B variants before any page script, set `locale`/`timezoneId`/`colorScheme` in config.
- Skip per-screen Page Objects when the set of screens is not stable (A/B funnels); organise by interaction shape instead (`references/resilient-navigation.md`).

Full code: `references/playwright-pom-and-fixtures.md`.

## 4. Configuration defaults

`fullyParallel: true`, `forbidOnly: !!CI`, `retries: CI ? 2 : 0` (0 when runs have side effects), `workers` default locally and per-runner in CI, `timeout` 30-60 s, `expect.timeout` 5-10 s, `trace: 'on-first-retry'` (or `retain-on-failure`), `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`, `baseURL` from config, `webServer` with `reuseExistingServer: !CI`, projects: `setup` (auth) → `chromium`/`firefox`/`webkit` → optional `mobile-chrome` (`devices['Pixel 7']`), `mobile-safari` (`devices['iPhone 14']`). Reporters: `html` + `list` + `allure-playwright` + `github` in CI; `blob` when sharding. Update Playwright frequently; browsers ship with it.

Published reports (GitHub Pages or any shared host): the HTML report titles every `fill` step with its value, even with recording off, and traces, videos and screenshots record typed values and the screen. Keep the login out of the published run: log in through the API, or run the `setup` project in its own invocation with a console reporter and the tests with `--no-deps`; keep recording off on `setup`, and say in the reply that the report is public. If other tests in the project type credentials (a hard-coded form login), list them as a leak into the published report and offer the fix; do not rewrite them unasked. The deploy job runs only when a report exists and only for `main`; the test job keeps the report as a regular artifact on every run. Workflow and config shape: `references/reports-and-pages.md`.

## 5. Flake control

- Isolation: default per-test context; unique data per test; no ordering dependencies; shared users only for non-destructive reads, restored via API when a test toggles them.
- Readiness: assert on the element you are about to use; after navigation wait for a URL or a heading, not for the network.
- Overlays: dismiss cookie banners/exit-intent popups in a fixture or before each step; prefer disabling them via a test flag or cookie.
- Dialogs: scope searches to `dialog[open]` when one is present; background elements stay "visible" under a modal and clicks hang on "subtree intercepts pointer events".
- Transitions: disable animations; bound secondary reads (`getAttribute`, `inputValue`) with short timeouts when they may hit an outgoing screen.
- Fixed waits are allowed only as a documented settle window with a reason and a number that was measured.
- Quarantine flaky tests with `test.fixme`/`test.fail` + ticket, not `skip`; review the trace before touching the test.

## 6. Visual, responsive and accessibility checks

- `expect(page).toHaveScreenshot()` with committed baselines per project, `maxDiffPixelRatio` small, masks for dynamic regions, animations disabled; update baselines deliberately (`--update-snapshots`) in a reviewed PR. Screenshots nobody compares are not tests.
- Responsive: separate projects with device descriptors; assert layout facts (no horizontal scroll: `scrollWidth <= clientWidth`, drawer vs inline nav via `isMobile`).
- Accessibility: `@axe-core/playwright` scan on key pages with a documented rule set; fail on serious/critical, report the rest.
- Console hygiene: collect `console.error` and `pageerror` in a fixture with an allow-list; fail on unexpected errors.

Details: `references/visual-responsive-a11y.md`.

## 7. Volatile targets (A/B tests, weekly redesigns, no test hooks)

Classify each screen by **interaction archetype** (single-choice, multi-choice, text-form, slot-picker, interstitial, terminal) and act on the shape; record the business step only for the report. Terminal detection uses URL patterns and on-screen markers as independent signals. Observe what happened after acting (fingerprint of path + heading + control count) and react: auto-advanced, enabled advance control, disabled control → pick a *different* option. Fail loudly with the screen state attached on an unknown shape. An LLM may classify an unknown screen into a known archetype but never drives actions; count its calls in the report. Side effects decide operating mode: no retries, scheduled synthetic runs, cleanup in `finally` with the id resolved from the session even when traversal throws. Complete pattern: `references/resilient-navigation.md`.

## 8. WebdriverIO and BrowserStack

Choose WDIO when you need Appium and web in one runner, an existing Selenium grid, or BrowserStack-native reporting. Same architecture (page objects, fixtures via hooks/services, env config). `@wdio/browserstack-service` with `user`/`key` from env, `browserstackLocal` for private targets, `testReporting` for the observability dashboard, capabilities as `{ browserName, 'bstack:options': {...} }` with `buildName` from CI. Playwright on BrowserStack runs over CDP with capabilities in the connect URL or via the BrowserStack SDK. Details and templates: `references/wdio-and-browserstack.md`.

## 9. Review checklist for a UI spec

- Logic-free spec: no branches, loops, try/catch or helper definitions in the file; literal expectations; one behaviour per test (tables and named lifecycle tests excepted); no coupling between tests; no noise. Full rules and lint: `qa-automation-architect/references/test-code-rules.md`.
- Title names the user-visible outcome; the test would be noticed by a user if it failed.
- No UI login except the login test; state seeded via API/fixtures.
- Locators by role/label/test id; no class/position selectors.
- Web-first assertions; no `waitForTimeout`/`networkidle`; readiness via app signals.
- Page methods thin; business assertions in the test.
- Shared state restored via API; unique data.
- Trace/screenshot settings make the failure debuggable; artefacts attached where useful.
- Published reports: the login is not part of the published run (API login, or `setup` run separately and the tests with `--no-deps`); deploy guarded on a report existing and on `main`.
