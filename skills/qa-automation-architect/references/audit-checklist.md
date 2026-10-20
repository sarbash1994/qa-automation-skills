# Audit checklist for an existing test suite

Work through this before proposing changes. Collect evidence (file paths, timings, counts) for each item; the output is a short report with three lists: harmful now, missing, fine as is. Prioritise by how many tests each finding touches.

## A. Orientation (read-only, 15 minutes)

- [ ] `package.json` scripts: which commands exist, which layers they cover, whether a lint/typecheck gate exists (`tsc --noEmit`).
- [ ] Runner config (`playwright.config.*`, `jest.config.*`, `wdio.conf.*`): workers, retries, timeouts, reporters, projects, `webServer`, `use` defaults.
- [ ] CI workflow: what runs on PR vs main vs schedule, matrix shape, artifact uploads, secrets handling, whether reports are published.
- [ ] Run the suite once locally (or read the last 5 CI runs). Record wall time, failing/flaky tests, retries consumed.
- [ ] Count tests per layer and per file; find the largest files and the most duplicated setup.

## B. Architecture smells

| Smell | Evidence to look for | Fix direction |
|---|---|---|
| Config read everywhere | `process.env.X` in clients, pages, tests | One `config/env.ts` with `required()`/`optional()`, derived values computed once |
| Clients that assert | `expect(...)` inside API client or Page Object methods beyond the readiness check | Clients return raw responses; assertions in tests; readiness expectations only in page actions |
| Scenario helpers | `loginAndCreateOrderAndVerify()`, `setupEverything()` | Fixtures for state, builders for data, tests show call + assert |
| Try/catch negatives | `catch (e) { expect(e.response.status).toBe(400) }` | `validateStatus: () => true` or raw `APIResponse`; assert status directly |
| Hand-written payloads per negative case | 12 literal objects differing in one field | Builder with `overrides`, `omit(field)` helpers |
| Shared mutable state | module-level `let token`, `global.user` | Worker-scoped fixtures; per-suite factory in `beforeAll` |
| UI login before every test | `beforeEach` drives the login form | Login once via API per worker, seed the token once, keep one UI login test |
| Sleeps | `waitForTimeout`, `setTimeout` in tests | Readiness signals, baseline-count polling, `expect.poll` |
| `.first()`/`.nth()` by position | `locator('button').first()` with no filter | `getByRole` with name, `filter({ hasText })`, stable attribute hooks |
| Selectors on volatile classes/ids | Tailwind classes, hashed ids, generated ids | Ask dev team for `data-testid`; meanwhile roles/names |
| No schema checks | Only `toHaveProperty` on a few fields | SchemaRegistry (AJV) with `required` + types, `additionalProperties: true` |
| Silent swallowing | `catch {}` around actions that must succeed | Only swallow where a *stale element* is expected; comment why |
| Defects commented out | `// TODO fails, server bug` with `test.skip` | `test.fail(true, reason)` so an unexpected pass is reported |
| Unknown cost of a run | e2e that create real records mixed with unit tests in one dir | Separate directories and runner projects; `retries: 0` where side effects exist |

## C. Speed

- [ ] Expensive setup repeated per test (register, login, seed) → worker-scoped fixtures or storage state.
- [ ] `fullyParallel: false` without a documented reason → check for shared state; isolate and enable.
- [ ] One CI job runs everything → matrix per project/browser on separate runners; also isolates rate-limit budgets.
- [ ] `webServer` without `reuseExistingServer` locally → slow iteration.
- [ ] Trace/video on for every test → `on-first-retry` / `retain-on-failure`.
- [ ] UI used to create data the test only needs to exist → API seeding.
- [ ] Large unit-testable logic only covered by live e2e → extract pure functions, add a unit project.

## D. Readability

- [ ] Test titles read as outcomes ("rejects a todo without a title", not "test todo 3").
- [ ] Tags/annotations per layer (`@api`, `@e2e`, `@defect`) for selective runs and report filtering.
- [ ] Types for domain models derived from real responses (`UserProfile`, `AnalyticsEvent`), including noted inconsistencies.
- [ ] Comments explain why and cite the live observation; magic numbers have a reason next to them.
- [ ] README has run commands, architecture, design choices and findings; `.env.example` complete.

## E. Report format

```
## Audit of <project> test suite (date)

Run: <N> tests, <time>, <flaky count>, CI matrix: <shape>

### Harmful now (fix first)
- <smell> in <paths> (touches <n> tests) → <fix>

### Missing
- ...

### Fine as is
- ...

### Proposed migration slices (each leaves the suite green)
1. ...
```
