---
name: qa-api-tests
description: Design, write and review REST/GraphQL API test suites and their client layer - Playwright request fixture, Jest/Vitest + Axios, Jest + supertest for in-process Express/Next routes, Pact or OpenAPI contract tests - with JSON Schema validation (AJV), faker builders, rate-limit-aware retries, baseline-count polling for async side effects (analytics, audit, email, webhooks) and a full negative-test matrix. Use whenever the user asks to test an API, endpoint, backend, webhook, contract or public stub; wants schema validation; fights 429s, flaky async assertions or costly auth setup; mentions Jest, Axios, supertest, AJV, Faker, Pact or OpenAPI in a testing context; or wants an API suite faster and more readable.
---

# API Tests

Target: a spec file that reads as "call the client, assert status and body", above a thin HTTP layer that never throws on status codes, schemas that act as contracts, builders that make every negative case one override away, and polling that does not depend on clocks. Complete per-runner recipes live in `references/`; read the one you need before generating code.

## 0. Verify against official documentation before answering

Option names, defaults and CLI flags of Playwright, Jest, Vitest, Axios, supertest, AJV, Pact and the API under test change between releases. Before writing config, a client, a workflow or a "how do I" answer, read the official page for the installed version and base the answer on it; cite the page; if it is unreachable say so and mark the answer unverified. The lookup protocol and URL map are in `references/official-docs.md`. Typical lookups: `APIRequestContext` options and `extraHTTPHeaders`, fixture scopes, `test.fail` semantics, Jest ESM flags and `test.failing`, Axios `validateStatus`/interceptors, AJV options and `ajv-formats`, Pact matchers, and the target API's own reference for exact status codes and headers.

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
- Credentials from public docs may sit in code with a comment; anything issued to you comes from env. Never commit `.env`.

## 6. Auth budget and fixtures

Default to a **worker-scoped shared user** for non-destructive tests and a **test-scoped fresh user** only where isolation matters (password change, cross-user leakage, observing the registration event itself). Admin login once per worker, with the fixture asserting the role. Keep an unauthenticated client for access-control negatives. Mark quota-bound suites opt-in (`RUN_APPLICATION_TESTS=1`). Dispose contexts in fixtures. Clean up created entities in fixture teardown when the API supports delete; otherwise rely on namespaced, greppable data and a scheduled sweep.

## 7. Asynchronous side effects

Events, audit rows, emails, webhooks and search indexes arrive late. Poll with `expect.poll`/custom `waitForCount` (10 s window, 250-500 ms interval) and compare against a **baseline count** captured before the action: `before = count(filter)`; act; `waitForCount(filter, before + 1)`. Wall-clock `since` filters break on clock skew and shared-user history. For "must NOT happen" cases: act, poll for a short bounded window asserting the count stays at baseline, then prove the positive path in the same test as a control. Use a mail-sink (Mailpit/Mailhog) or webhook capture service rather than a real inbox.

## 8. Negative and edge matrix

Per write endpoint: missing required field, empty string, whitespace-only, over-long, wrong type, invalid enum, malformed id (400 with exact message), well-formed-but-missing id (404), each auth scheme missing separately and both present, expired/invalid token, cross-tenant access, duplicate creation, idempotency key reuse, concurrent creation. Per read: pagination (`limit` applied, `offset` moves, invalid `limit` rejected, last page), filters, sorting stability, isolation between users. Per contract: unknown fields ignored or rejected as documented, content-type negotiation, large payloads. Full table with assertion wording in `references/validation-matrix.md`.

## 9. Documented defects

When the API is wrong, write the test for the correct behaviour and mark it `test.fail(true, 'TICKET-123: reason')` (Playwright) or `it.failing` (Jest 29+). Group under `@defect`. Mirror in the README so reviewers see you found and did not hide them.

## 10. Review checklist for an API spec

- Title states the outcome, with status/message when that is the contract.
- Body is call then assertions; no inline login/seed (fixtures), no literal payload variants (builders).
- Exact status for documented codes; `>= 400` only where the server is inconsistent and the README says so.
- Schema validated on success at least once per family; error schema in negatives.
- No sleeps as synchronisation; no `since` timestamps; polling has a bounded window.
- Shared user never destructively mutated; state restored via API if toggled.
- Secrets from env; `.env.example` updated; no vendor/model identifiers in artefacts.
