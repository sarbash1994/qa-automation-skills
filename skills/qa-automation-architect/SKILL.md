---
name: qa-automation-architect
description: Architect, bootstrap, audit and evolve test automation frameworks (API, web UI, mobile) in the JS/TS ecosystem - Playwright, Jest, Vitest, Axios, supertest, WebdriverIO, Appium, Detox, Maestro, Allure, BrowserStack, GitHub Actions. Use whenever the user wants to build a test framework from scratch, do a QA automation take-home, restructure or speed up an existing test suite, cut flakiness, review test code, choose test tools, set up CI reporting (Allure, badges, sharding) or write a test strategy/README. Also use when someone just says "add tests to this project", "our e2e is slow or flaky" or "how should I structure tests". Delegates layer detail to qa-api-tests, qa-ui-e2e-tests and qa-mobile-tests.
---

# QA Automation Architect

Industry best practice for test automation frameworks, written so a reviewer's "why did you build it this way" has an answer for every decision. The rules below are the consensus of the Playwright, WebdriverIO, Jest and Allure teams' own guidance plus widely accepted engineering practice (test pyramid, deterministic tests, contract-first, shift-left). They tell you *what* to decide; the exact option names, defaults and CLI flags of each tool come from its official documentation, looked up at answer time (section 0).

When the request is open-ended (new framework, take-home, "add tests", "our suite is slow") and `qa-automation-orchestrator` is installed, start there: it runs the brainstorm, writes the strategy and plan, and routes tasks here. Sibling skills hold the layer-specific detail. Load the one matching the layer you are about to touch:

- `qa-api-tests` - HTTP clients, schema/contract validation, builders, rate limits, async side effects, supertest, Jest + Axios vs Playwright `request`.
- `qa-ui-e2e-tests` - Playwright locators, Page Objects and fixtures, auth via storage state, WebdriverIO + BrowserStack, resilient navigation of volatile UIs, visual and responsive checks.
- `qa-mobile-tests` - Expo/React Native, Appium + WebdriverIO, Detox, Maestro, BrowserStack App Automate, device matrices.

## 0. Verify against official documentation before answering

Every tool-specific claim in this skill family (an option name, a default, a CLI flag, an action input, a capability key) must be confirmed against the tool's official documentation for the version in use **before** you write config or give an answer. The practices here are stable; the knobs are not. Follow the protocol and the URL map in `references/official-docs.md`:

1. Identify the tool and the installed version (`package.json`, lockfile, `uses:` lines in CI).
2. Read the relevant official page: a documentation MCP (e.g. Context7 `resolve-library-id` → `query-docs`) if available, otherwise fetch the URL from the map; for GitHub Actions read the action's README and the GitHub Docs feature page.
3. Confirm option names, placement and defaults against the page; the page wins over memory.
4. Cite the page in the answer. If it could not be reached, say so and mark the answer unverified.

Examples that always need a lookup: "configure Playwright to produce a report with video" (Videos + Reporters pages), "publish test results to GitHub Pages" (GitHub Pages custom workflow docs + `actions/*pages*` READMEs), "enable Allure history" (Allure v2 vs v3 docs), any BrowserStack capability or SDK setup, any Appium capability.

## 1. Decide what to automate where (test pyramid)

Push every check to the cheapest layer that can prove it:

| Layer | Proves | Cost | Default share |
|---|---|---|---|
| Unit (pure functions, decision logic, parsers) | Logic correctness | ms, no I/O | Most tests |
| Component / integration in-process (supertest against `app`, RTL for components) | Wiring of your own code with mocked infrastructure | fast, deterministic | Many |
| API against a deployed service | Contracts, auth, validation, data isolation | seconds, network | Backbone of e2e confidence |
| Contract (consumer-driven, Pact or OpenAPI-based) | Consumer and provider agree, without running both | fast | Where services are owned by separate teams |
| Browser / device E2E | Critical user journeys end to end, rendering | slow, flaky-prone | Few, high value |
| Visual / a11y / perf | Non-functional regressions | medium | Targeted |

Corollaries: seed state through the API, not the UI; keep one UI login test and authenticate everything else via stored state or API tokens; extract decision logic out of E2E into unit-tested pure functions; do not test third-party sites or services you do not control (mock or stub them at the network boundary).

## 2. Reconnaissance before structure

The constraints you discover decide the architecture. Before writing code, walk the target by hand and record:

- **Auth layers**: independent gates (API key header, JWT, Basic, cookies, CSRF), statelessness, what logout really does, which headers must exist at browser-context level for a SPA to work under automation.
- **Rate limits and quotas**: `RateLimit-*` / `Retry-After` headers; a strict limiter on `/auth/*` forbids "fresh user per test" and forces shared per-worker users.
- **Side effects**: a passing run that creates real users, bookings, emails or charges means no retries, no per-PR runs, mandatory cleanup, greppable test data.
- **Test hooks**: `data-testid`, ARIA roles and names, or nothing stable; randomised ids/classes force attribute hooks; no hooks at all force structural classification and a testability ticket to the dev team.
- **Data isolation**: tenants/namespaces, filterable server-side streams (analytics, audit), well-formed-but-missing ids.
- **Real behaviour of the target**: public stubs echo and never validate; do not invent 400s they cannot return.

Ask the owning team what you cannot discover (cleanup endpoint, A/B pinning, test mode) and let the answers change code, not only the README. Record each finding next to the decision it forced.

## 3. Layering that scales

```
config/          typed, validated env (zod or hand-rolled required()/optional()); fail fast with the remedy in the message
src/core/        HttpClient (never throws on 4xx/5xx), retry policy, logger, SchemaRegistry
src/clients/     one class per service/domain; methods 1:1 with endpoints; HTTP ONLY, no assertions
schemas/         OpenAPI/JSON Schema contracts, outside src/; generated types (openapi-typescript) where possible
src/data/        builders (faker + overrides), unique greppable identifiers, discovered validation rules
src/pages/       Page Objects (UI): readonly locators from roles/test ids + short actions
fixtures/        the ONLY wiring point: test.extend() (Playwright/WDIO) or createApi() (Jest)
tests/<layer>/   api/ e2e/ unit/ visual/ - one file per endpoint group or journey
```

- Dependencies flow through constructors and fixtures; nothing reads `process.env` outside `config/`.
- Clients return raw responses; assertions live in tests; assert-and-parse helpers live in fixtures.
- No helpers named after scenarios; abstraction sits below the client (HTTP, retry, schema), never above it.
- Add a service/session layer only when there is state to manage (token refresh, multi-step auth, caching).
- No shared mutable module state; worker-scoped fixtures own what is shared.
- Split by cost visibly: free unit tests and side-effecting E2E in different directories and runner projects.
- Scaling recipe: new feature = new client method, new schema, maybe a builder, new spec; existing files untouched.

## 4. Determinism and flake control

- Status codes are data: `validateStatus: () => true` or raw `APIResponse`; a `try/catch` negative passes when the call unexpectedly succeeds.
- Use web-first/async assertions (`expect(locator).toBeVisible()`, `expect.poll`, `expect(...).toPass()`) and readiness signals the app produces; never fixed sleeps as synchronisation.
- Poll against a **baseline count** captured before the action, never a wall-clock `since`.
- Isolate tests: fresh browser context per test (default), unique data per test, no inter-test ordering; let `fullyParallel` be the goal and document any serial exception with the reason.
- Authenticate once per worker (storage state file or API token) and reuse; seed state once, not on every navigation.
- Retry only idempotent HTTP calls on 429/5xx with capped, header-honouring backoff; use runner retries (`retries: 1-2` in CI) only for tests without side effects and treat a retry pass as a flake to investigate, not a success.
- Flaky test policy: quarantine with an owner and a deadline (`test.fixme` / `test.fail` with reason), never silent skips; track flake rate per test in the report.
- Freeze time, locale, timezone and viewport in config (`timezoneId`, `locale`, `Date` mocking) so results do not depend on the runner.
- Disable animations in the browser fixture when the target animates; bound secondary DOM reads with short timeouts when elements may belong to an outgoing screen.

## 5. Defects, skips and known issues

Encode each confirmed defect as a test asserting the *correct* behaviour, marked `test.fail(true, 'reason + ticket')` (Playwright) or `it.failing` (Jest). The suite stays green, the gap is visible, and a fix produces an "unexpected pass" that prompts cleanup. Mirror the list in README "Findings" with a ticket link. Prefer this over `skip` and over commenting out.

## 6. Working on an existing project

Run `references/audit-checklist.md` first. Keep trust by changing in slices that each leave the suite green:

1. Read scripts, runner config and CI; run once; record time, failures, retries consumed.
2. Map the current code onto the layering above; name what is harmful (sleeps, UI login per test, positional selectors, config everywhere) and what is missing (builders, schemas, fixtures, lint gate).
3. Introduce the HTTP wrapper and fixtures first; move spec files onto them one at a time; delete old helpers last. Never restructure and rewrite assertions in the same PR.
4. Speed: worker fixtures, storage state auth, API seeding, `fullyParallel`, CI sharding (`--shard`, blob reporter + `merge-reports`), browser caching, `reuseExistingServer` locally.
5. Readability: outcome-style titles, call-then-assert bodies, comments that record the live observation behind each non-obvious decision.
6. Add the lint gate (`tsc --noEmit`, ESLint with `eslint-plugin-playwright`/`eslint-plugin-jest`, Prettier) and a short TESTING.md so the next person does not undo the work.

## 7. Tool decisions

| Need | Default | Why |
|---|---|---|
| New API suite | Playwright test runner + `request` fixture (TS strict) | fixtures, parallelism, reporters, `test.fail`, same runner as E2E |
| Team lives in Jest, or brief says Jest/Axios | Jest + Axios, same layering, `it.failing` for defects | familiar runner |
| Routes you own (Express/Next) | Jest or Vitest + supertest against exported `app`, infra mocked | no network, deterministic |
| Service-to-service contracts | Pact (consumer-driven) or OpenAPI validation in CI | catches breaking changes without running both sides |
| Web UI | Playwright, projects per browser, storage-state auth | auto-wait, trace viewer, request context in one runner |
| Selenium grid / BrowserStack-centric / native mobile with web in one runner | WebdriverIO v9 + `@wdio/browserstack-service` | Appium and web in one framework |
| React Native E2E | Detox (gray-box sync) or Maestro (YAML, fast to write) ; Appium for cross-platform real-device clouds | see `qa-mobile-tests` |
| Volatile / A/B tested UI | Archetype navigator over per-screen POM | POM assumes a stable screen set |
| Reporting | Runner HTML + Allure 3 (`historyPath` for trends) published to Pages; JUnit for dashboards | trends and one report for all layers |

Verify option names and the current recommended setup against the official docs (section 0, `references/official-docs.md`) before writing config; these libraries move faster than any training data.

## 8. Deliverable checklist

- `.env.example` with every variable, origin and optionality; secrets only in CI Secrets; non-secret defaults via `vars.X || 'default'`.
- Scripts per layer: `test:unit`, `test:api`, `test:e2e`, `test:e2e:<browser>`, `report`, `allure:serve`, `lint`, `typecheck`.
- CI: matrix per project (and `--shard` when a project is long), `fail-fast: false`, artifacts `if: ${{ !cancelled() }}`, merged report with history and badge (`references/ci-and-reporting.md`).
- Quality gates: typecheck + lint on PR; flake budget; coverage thresholds only for modules with dedicated unit tests.
- README per `references/readme-template.md`: TL;DR, recon, architecture + design choices, coverage, findings, CI, and the reflective sections (why this way, what was given up, next steps, scaling).
- Code style per `references/conventions.md`.
- Every tool-specific setting in the deliverable traced to an official doc page read during the task (section 0).
