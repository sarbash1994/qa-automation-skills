---
name: qa-ui-e2e-tests
description: Design, write and stabilise browser end-to-end and UI test suites - Playwright (TypeScript) first, WebdriverIO v9 for Selenium/Appium/BrowserStack needs - covering locator strategy, Page Objects and fixtures, auth via storage state, cross-browser and responsive projects, visual regression (toHaveScreenshot), accessibility (axe), UI-to-backend cross-checks and resilient navigation of volatile A/B-tested funnels. Use whenever the user mentions e2e, UI tests, browser automation, Playwright, WebdriverIO, Cypress migration, Page Object, selectors or locators, flaky UI tests, screenshots, BrowserStack web, or wants to automate a signup, checkout or quiz flow; also to review or refactor an existing UI suite.
---

# UI and E2E Tests

Target: few, high-value browser journeys that run in parallel, authenticate once, seed data through the API, locate elements the way users do, and fail with a trace that explains itself. Everything below follows the Playwright team's own best-practice guidance plus hard-won patterns for hostile targets; `references/` has complete code.

## 0. Verify against official documentation before answering

Playwright, WebdriverIO, Allure, axe and BrowserStack change option names and recommended setups between releases. Before writing `playwright.config.ts`, `wdio.conf.ts`, a CI workflow or a "how do I" answer, read the official page for the installed version (documentation MCP such as Context7 first, otherwise the URL from `references/official-docs.md`), confirm the exact option and its placement, and cite the page. Unreachable docs → say so and mark the answer unverified. Examples that always need a lookup: `use.video`/`use.trace`/`use.screenshot` values and reporter options ("report with video"), `storageState` and project `dependencies`, `toHaveScreenshot` options, `--shard` and `merge-reports`, WDIO BrowserStack service options and `bstack:options` keys, the current BrowserStack SDK path for Playwright, GitHub Pages publishing (GitHub Docs plus the `actions/*pages*` READMEs).

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

- Title names the user-visible outcome; the test would be noticed by a user if it failed.
- No UI login except the login test; state seeded via API/fixtures.
- Locators by role/label/test id; no class/position selectors.
- Web-first assertions; no `waitForTimeout`/`networkidle`; readiness via app signals.
- Page methods thin; business assertions in the test.
- Shared state restored via API; unique data.
- Trace/screenshot settings make the failure debuggable; artefacts attached where useful.
