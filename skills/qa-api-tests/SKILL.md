---
name: qa-api-tests
description: Design, write and review REST/GraphQL API test suites and their client layer - Playwright request fixture, Jest/Vitest + Axios, Jest + supertest for in-process Express/Next routes, Pact or OpenAPI contract tests - with JSON Schema validation (AJV), faker builders, rate-limit-aware retries, baseline-count polling for async side effects (analytics, audit, email, webhooks) and a full negative-test matrix. Use whenever the user asks to test an API, endpoint, backend, webhook, contract or public stub; wants schema validation; fights 429s, flaky async assertions or costly auth setup; mentions Jest, Axios, supertest, AJV, Faker, Pact or OpenAPI in a testing context; or wants an API suite faster and more readable.
---

# API Tests

Target: a spec file that reads as "call the client, assert status and body", above a thin HTTP layer that never throws on status codes, schemas that act as contracts, builders that make every negative case one override away, and polling that does not depend on clocks. Complete per-runner recipes live in `references/`; read the one you need before generating code. References to sibling skills (`qa-automation-architect` for framework-wide structure) apply only when they are installed; otherwise continue with this skill and the project's conventions.

## 0. Official documentation and the reply

Look up official documentation when it pays, not on every answer: when you are not certain an option, flag, action input or capability key exists in the installed version, when the installed major is newer than the one you know well, when something failed or behaved unexpectedly, or when the user asks for sources. Installed types or source, a type-check and `--help` are cheaper evidence and often enough. Check first: Playwright request and fixture options new to you, Jest ESM flags and `test.failing` across majors, AJV and Pact APIs, and the target API's real status codes, headers and limits. Triggers, the "Check first" list and the URL map: `references/official-docs.md`.

In the reply, name each page you used (title or URL) next to the claim it confirms, mark details you were unsure of and could not check as unverified, and list every file you created or changed, including lockfiles, config and shared helpers, with one line on why. When you notice something outside the request that should change (another spec, a leaked secret, a broken script), report it and offer the change instead of making it; edit beyond the request only when the requested work cannot be correct without it, and say so.

## 1. Pick the runner and test type

| Situation | Choice | Recipe |
|---|---|---|
| New suite against a deployed service | Playwright test runner + `request` fixture, TypeScript strict | `references/playwright-request-recipe.md` |
| Team on Jest/Vitest, or brief lists Jest + Axios | Jest/Vitest + Axios instance per service | `references/jest-axios-recipe.md` |
| Routes you own and can import | Jest/Vitest + supertest against the exported `app`, infra mocked | `references/supertest-recipe.md` |
| Services owned by different teams | Consumer-driven contracts (Pact) and/or OpenAPI response validation in both pipelines | `references/contracts-and-schemas.md` |

Keep API tests independent of the browser suite but in the same repo and reporter so one report covers both.

## 2. Recon the API first

Walk endpoints with a real client (curl, Bruno/Postman collection, devtools) and record: auth per endpoint (including endpoints requiring two schemes at once), rate-limit headers (`RateLimit-Policy`, `RateLimit-Reset`, `Retry-After`), exact error bodies and codes, id formats (to craft well-formed-but-missing ids), pagination shape, echoed vs validated fields, type inconsistencies across endpoints. Public stubs (jsonplaceholder, dummyjson, reqres) echo input and do not validate: test what they do and say so in the README instead of inventing 400s.

## 3. HTTP layer rules

- Never throw on 4xx/5xx: Axios `validateStatus: () => true`; Playwright raw `APIResponse`; supertest asserts `.status` directly. A `try/catch` negative passes when the call unexpectedly succeeds.
- Clients return the raw response or a narrow `{ status, data, headers }`; they never parse-and-assert.
- One client class per service; methods map 1:1 to endpoints and take domain arguments (`login(email, password)`, `updateTodo(id, patch)`), not raw configs.
- Context-wide headers (API key, tenant) live on the instance/context; per-user auth is `withToken(token)` returning a new client so anonymous and several user clients coexist in one test.
- Failure-only logging behind an env flag: method, url, status, request and response bodies; redact secrets.
- One retry wrapper applied to every call: retry on 429 (and optionally idempotent 502/503/504) honouring `Retry-After`/`RateLimit-Reset`, max 4 attempts, wait capped (60 s); above the cap throw naming the policy. Strict limiters are designed around with shared fixtures, never waited out.
- Timeouts explicit (15 s default) and configurable; `baseURL` only from config.

## 4. Contracts and schema validation

Validate the success response of every endpoint family against a schema at least once, and every error family (`AuthError`) in negatives. Prefer schemas derived from the provider's OpenAPI (generate types with `openapi-typescript`, validate with AJV or `jest-openapi`-style matchers); hand-write YAML/JSON Schema only for undocumented APIs. Keep schemas outside `src/` as contracts. AJV: `allErrors: true`, `strict: false`, `ajv-formats`; registry compiles once and returns `errors || []`; tests assert `toEqual([])` so a failure prints every violation. `additionalProperties: true` for third-party APIs, `false` for contracts you own. For multi-team services add Pact consumer tests and provider verification in CI. Details: `references/contracts-and-schemas.md`.

## 5. Builders and data

- `build<Entity>(overrides)` with faker defaults (seed faker in CI for reproducibility), `<entity>Without(field)`, `pick` for echoed subsets.
- Unique, greppable identifiers: `${prefix}_${Date.now().toString(36)}${counter}${randomUUID().slice(0,6)}@example.com`. Uniqueness enables filtering server streams down to this test's entity and tracing leftovers.
- Encode discovered validation rules inside builders (normalisation, allowed characters, password policy) and pin them with a unit test.
- Credentials always come from env, including demo credentials the provider publishes: put those values in `.env.example` and the README, never as defaults in code. A missing credential fails fast with a message naming the variable and where to get it. Non-secret settings such as a local base URL may have a default. Never commit `.env`.

## 6. Auth budget and fixtures

First establish how test users come into existence: a registration endpoint, an admin API, a seeded account pool, or only the accounts someone hands you. State the answer in your reply and in the README, because it decides the isolation design. When the API cannot create users:

- All tests share the provided account(s); say so instead of promising fresh users the API cannot make.
- Isolation comes from data, not identity: unique, namespaced entities per test, assertions scoped to what the test created, cleanup in fixture teardown.
- Never mutate the shared account itself (password, profile, settings) unless the test restores it.
- Cross-user checks (ownership, leakage) need a second account provisioned out of band and passed in through env; until it exists, the fixture skips those tests with a reason that names the missing variables (`references/playwright-request-recipe.md`).

When users can be created, default to a **worker-scoped shared user** for non-destructive tests and a **test-scoped fresh user** only where isolation matters (password change, cross-user leakage, observing the registration event itself). Admin login once per worker, with the fixture asserting the role. Keep an unauthenticated client for access-control negatives. Mark quota-bound suites opt-in (`RUN_APPLICATION_TESTS=1`). Dispose contexts in fixtures. Clean up created entities in fixture teardown when the API supports delete; otherwise rely on namespaced, greppable data and a scheduled sweep.

## 7. Asynchronous side effects

Events, audit rows, emails, webhooks and search indexes arrive late. Poll with `expect.poll`/custom `waitForCount` (10 s window, 250-500 ms interval) and compare against a **baseline count** captured before the action: `before = count(filter)`; act; `waitForCount(filter, before + 1)`. Wall-clock `since` filters break on clock skew and shared-user history. For "must NOT happen" cases: act, poll for a short bounded window asserting the count stays at baseline, then prove the positive path in the same test as a control. Use a mail-sink (Mailpit/Mailhog) or webhook capture service rather than a real inbox.

## 8. Negative and edge matrix

Per write endpoint: missing required field, empty string, whitespace-only, over-long, wrong type, invalid enum, malformed id (400 with exact message), well-formed-but-missing id (404), each auth scheme missing separately and both present, expired/invalid token, cross-tenant access, duplicate creation, idempotency key reuse, concurrent creation. Per read: pagination (`limit` applied, `offset` moves, invalid `limit` rejected, last page), filters, sorting stability, isolation between users. Per contract: unknown fields ignored or rejected as documented, content-type negotiation, large payloads. Full table with assertion wording in `references/validation-matrix.md`.

## 9. Documented defects

When the API is wrong, write the test for the correct behaviour and mark it `test.fail(true, 'TICKET-123: reason')` (Playwright) or `it.failing` (Jest 29+). Group under `@defect`. Prove each pin: remove the marker once and show the test fails on its own assertion for the stated reason (against a running service, or by reasoning from the code when no service is available, saying which). Mirror in the README so reviewers see you found and did not hide them.

## 10. Review checklist for an API spec

- Logic-free spec: no branches, loops, try/catch or helper definitions in the file; literal expectations; one behaviour per test (tables and named lifecycle tests excepted); no coupling between tests; no noise. Full rules and lint: `qa-automation-architect/references/test-code-rules.md`.
- Title states the outcome, with status/message when that is the contract.
- Body is call then assertions; no inline login/seed (fixtures), no literal payload variants (builders).
- Exact status for documented codes; `>= 400` only where the server is inconsistent and the README says so.
- Schema validated on success at least once per family; error schema in negatives.
- No sleeps as synchronisation; no `since` timestamps; polling has a bounded window.
- Shared user never destructively mutated; state restored via API if toggled.
- Secrets and credentials from env with no defaults in code; missing ones fail fast naming the variable; `.env.example` updated; no vendor/model identifiers in artefacts.
- The answer and README state how test users are provisioned and what that means for isolation.
