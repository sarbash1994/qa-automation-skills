---
name: qa-unit-tests
description: Design, write and review unit and component tests in the JavaScript/TypeScript ecosystem - Vitest, Jest, node:test, React Testing Library (web) and React Native Testing Library - including what belongs in a unit test versus an integration or e2e test, extracting pure functions to make logic testable, test doubles and mocking strategy (vi.mock/jest.mock, msw at the network boundary, fake timers and clocks), component testing by accessible roles, coverage thresholds, mutation testing (Stryker) and property-based testing (fast-check). Use when the user asks for unit or component tests, Vitest or Jest configuration, mocking or test-double advice, coverage or snapshot questions, or tests for hooks, reducers, parsers and utilities. Not for the TDD workflow itself (a TDD skill owns the red-green-refactor loop; this skill owns how the tests are written), nor for API, browser or device suites (see the sibling qa skills).
---

# Unit and Component Tests

Target: tests that run in milliseconds, fail only when behaviour is wrong, and read as a specification of the module. Sibling skills (`qa-automation-architect`, `qa-api-tests`, `qa-ui-e2e-tests`, `qa-mobile-tests`) are referenced where useful; if one is not installed, continue with this skill and the project's conventions. Unit tests are the base of the pyramid; most logic bugs should be caught here, so the rest of the suite can stay small. Recipes and runner details are in `references/`; read the one you need before generating code.

## 0. Official documentation and the reply

Look up official documentation when it pays, not on every answer: when you are not certain an option, flag, action input or capability key exists in the installed version, when the installed major is newer than the one you know well, when something failed or behaved unexpectedly, or when the user asks for sources. Installed types or source, a type-check and `--help` are cheaper evidence and often enough. Check first: the msw major (msw 3 renamed `onUnhandledRequest` to `onUnhandledFrame` and silently ignores the old name), Jest 29 to 30 config, Vitest coverage options. Triggers, the "Check first" list and the URL map: `references/official-docs.md`.

In the reply, name each page you used (title or URL) next to the claim it confirms, mark details you were unsure of and could not check as unverified, and list every file you created or changed, including lockfiles, config and shared helpers, with one line on why. When you notice something outside the request that should change (another spec, a leaked secret, a broken script), report it and offer the change instead of making it; edit beyond the request only when the requested work cannot be correct without it, and say so.

## 1. What belongs here

| Test | Belongs in a unit test | Belongs elsewhere |
|---|---|---|
| Pure logic: parsers, pricing, validation, state reducers, selectors, formatting, date math | Yes, exhaustively, including edge cases | |
| A function that composes I/O with logic | Extract the logic into a pure function and test that; test the composition once with doubles | |
| Component behaviour: renders from props/state, calls handlers, shows errors, accessibility roles | Yes, through Testing Library, by what a user sees | Visual appearance → visual tests |
| HTTP route handlers with mocked infrastructure | Integration test in-process (supertest), see `qa-api-tests` | |
| Framework wiring, routing, real DB queries, browser rendering | | integration / e2e |
| Third-party library behaviour | Never; trust or wrap it | |

Rules of thumb: test behaviour through the public interface, not implementation details; one reason to fail per test; no network, filesystem, real clock or real randomness; if a test needs more than two mocks, the code wants a seam (dependency injection, a pure core).

## 2. Runner choice

- **Vitest**: default for new projects and anything built with Vite, ESM or TypeScript; fast, Jest-compatible API, built-in coverage via `v8`/`istanbul`, `vi.*` utilities, browser mode for components when jsdom is not enough.
- **Jest**: when the project already uses it or the ecosystem demands it (React Native via `jest-expo`, Next.js examples); use `@swc/jest` or `ts-jest` with `isolatedModules`, enable ESM support deliberately.
- **node:test**: zero-dependency scripts and libraries that must not add dev tooling; pair with `node:assert/strict`.

Never mix two runners for the same files. Keep a single `test` script, `test:watch`, `test:coverage`, and run unit tests in CI on every push before anything slower. Details in `references/vitest-and-jest.md`.

## 3. Shape of a good unit test

```ts
describe('calculateLineTotal', () => {
  it('applies the per-unit fee once per unit', () => {
    const total = calculateLineTotal({ price: 10, qty: 3, fee: 2 });
    expect(total).toBe(36);
  });

  it('rejects a negative quantity', () => {
    expect(() => calculateLineTotal({ price: 10, qty: -1, fee: 0 })).toThrow(/quantity/);
  });
});
```

- Arrange-act-assert, one behaviour per test, a title that states the rule in domain language.
- Exact values from the specification, not values copied from the implementation's output.
- Table-driven tests (`it.each`) for input classes; property-based tests (`fast-check`) for invariants (round-trips, idempotence, ordering).
- Snapshot tests only for stable serialised output you actually review (an error message catalogue, a generated config); never for whole component trees.
- Async: `await` the promise, assert the resolved value or `rejects.toThrow`; use fake timers (`vi.useFakeTimers`, `vi.setSystemTime`) for time-dependent code and restore them in `afterEach`.
- Prefer `test.failing`/`it.fails` for documented bugs over skipping, and prove every pin: remove the marker and show the test fails on its own assertion, and where practical fix the bug in a scratch copy and show the pinned test flips. A pin you have not seen flip may be pinning the wrong thing.
- Hunt for defects deliberately rather than only confirming the documented rules: values just above zero and below the smallest valid step, the largest valid value and one past it, non-finite inputs (`NaN`, `Infinity`), rounding at exact half units, and a sweep over a grid of inputs or a `fast-check` property comparing against a simple reference implementation.
- No logic or helper definitions inside the spec file; see the shared test code rules in `qa-automation-architect/references/test-code-rules.md`.

## 4. Test doubles and mocking

Mock at boundaries you do not own, keep everything else real:

- Network: `msw` (`setupServer` from `msw/node` in Node and in Jest-based React Native tests) with request handlers, started in strict mode for the installed major and pinned by a guard test (`references/mocking-and-doubles.md`); assert on what the code does with the response, not on fetch being called.
- Time and randomness: fake timers, `vi.setSystemTime`, injected `now()`/`random()` functions, seeded faker.
- Modules: `vi.mock`/`jest.mock` only for infrastructure (DB client, SDKs, filesystem); keep mock factories in one shared helper; prefer fakes (in-memory implementations) to call-count mocks.
- Environment: set variables in a setup file before imports; never read a real `.env` in tests.
- Avoid: mocking the module under test, mocking to make a private function reachable, asserting `toHaveBeenCalledTimes` where the output already proves the behaviour.

Full guidance: `references/mocking-and-doubles.md`.

## 5. Component tests

Render with Testing Library, query by accessibility (`getByRole` with name, `getByLabelText`, `getByText`), interact with `userEvent.setup()`, assert visible outcomes; `findBy*`/`waitFor` for async updates; `getByTestId` as the last resort. Mock data access at the network boundary (msw) rather than mocking hooks. For React Native use `@testing-library/react-native` under the `jest-expo` preset with the official native module mocks. Recipe: `references/component-testing.md`.

## 6. Quality gates

- Coverage: measure with `v8`; set thresholds per directory that owns tested logic and raise them as you go; do not set a repo-wide number copied from today's value.
- Mutation testing (Stryker) on the pure-logic directories once a quarter or in a nightly job: it finds assertions that pass for the wrong reason.
- Flaky unit tests are bugs: a unit test that depends on order, time or network is not a unit test.
- Lint: `eslint-plugin-jest` or `eslint-plugin-vitest`, `no-only-tests`, typecheck test files with `tsc --noEmit`.
- Speed budget: the whole unit suite under a minute locally; split with `--shard` in CI only when it grows past that.

Details: `references/quality-gates.md`.

## 7. Review checklist for a unit spec

- Logic-free spec: no branches, loops, try/catch or helper definitions in the file; literal expectations; one behaviour per test (tables and named lifecycle tests excepted); no coupling between tests; no noise. Full rules and lint: `qa-automation-architect/references/test-code-rules.md`.
- Title states the rule; test would fail if the rule were broken and pass if the implementation were rewritten correctly.
- No I/O, real clock or randomness; doubles only at boundaries you do not own.
- Expected values come from the spec, not from running the code.
- Edge cases present: empty, boundary, invalid type, unicode, large input, concurrency where relevant.
- Async handled with `await`; timers restored; no `setTimeout` waits.
- Components tested by role and visible text; no implementation-detail queries.
- Snapshots, if any, are small and reviewed.
