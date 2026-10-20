---
name: qa-unit-tests
description: Design, write and review unit and component tests in the JavaScript/TypeScript ecosystem - Vitest, Jest, node:test, React Testing Library (web) and React Native Testing Library - including what belongs in a unit test versus an integration or e2e test, extracting pure functions to make logic testable, test doubles and mocking strategy (vi.mock/jest.mock, msw at the network boundary, fake timers and clocks), component testing by accessible roles, coverage thresholds that mean something, mutation testing (Stryker) and property-based testing (fast-check). Use whenever the user asks for unit tests, component tests, TDD, test coverage, mocking advice, snapshot tests, testing hooks or utilities, Jest or Vitest configuration, or wants fast tests that catch logic bugs before the browser or device suite. Load qa-automation-architect for framework-wide structure.
---

# Unit and Component Tests

Target: tests that run in milliseconds, fail only when behaviour is wrong, and read as a specification of the module. Unit tests are the base of the pyramid; most logic bugs should be caught here, so the rest of the suite can stay small. Recipes and runner details are in `references/`; read the one you need before generating code.

## 0. Verify against official documentation before answering

Vitest, Jest, Testing Library, msw, fast-check and Stryker change option names and APIs between majors (Jest 29 → 30, msw 1 → 2, Vitest coverage config). Before writing a runner config, a mock, a matcher or a "how do I" answer, read the official page for the installed version (documentation MCP such as Context7 first, otherwise the URL from `references/official-docs.md`), confirm the exact API and its placement, and cite the page. Unreachable docs → say so and mark the answer unverified. Typical lookups: `vitest.config` `test` options and coverage thresholds, `vi.mock` hoisting rules, Jest `moduleNameMapper`/`transform`/ESM flags, `test.failing`, Testing Library query priority and `user-event` setup, msw `setupServer` and `http` handlers, RNTL render/`screen` API, fast-check arbitraries, Stryker config.

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
- Prefer `test.failing`/`it.fails` for documented bugs over skipping.

## 4. Test doubles and mocking

Mock at boundaries you do not own, keep everything else real:

- Network: `msw` (`setupServer` in Node, `msw/native` for React Native) with request handlers; assert on what the code does with the response, not on fetch being called.
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

- Title states the rule; test would fail if the rule were broken and pass if the implementation were rewritten correctly.
- No I/O, real clock or randomness; doubles only at boundaries you do not own.
- Expected values come from the spec, not from running the code.
- Edge cases present: empty, boundary, invalid type, unicode, large input, concurrency where relevant.
- Async handled with `await`; timers restored; no `setTimeout` waits.
- Components tested by role and visible text; no implementation-detail queries.
- Snapshots, if any, are small and reviewed.
