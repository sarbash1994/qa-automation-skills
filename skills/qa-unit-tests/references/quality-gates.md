# Quality gates for unit suites

> When unsure of coverage provider options, Stryker and fast-check configuration in the installed version, check the installed types or the pages in `official-docs.md`.

## Coverage

- Provider `v8` (fast, accurate enough) or `istanbul` when you need branch detail in transformed code.
- `include` only directories with logic you own (domain, lib, utils, components); exclude generated code, types, config.
- Thresholds per directory that has dedicated tests; start at today's number plus a few points and ratchet up; a repo-wide 80% copied from the current value protects nothing.
- Report in CI (`--coverage.reporter=text,lcov`), fail the job below threshold, upload `lcov` to the dashboard of choice.
- Coverage shows what ran, not what was asserted; pair it with mutation testing.

## Mutation testing (Stryker)

```json
// stryker.config.json
{ "testRunner": "vitest", "mutate": ["src/domain/**/*.ts", "!src/**/*.test.ts"], "reporters": ["html", "clear-text", "progress"], "thresholds": { "high": 80, "low": 60, "break": 50 } }
```

Run nightly or on the pure-logic directories only (it is slow); surviving mutants point at assertions that pass for the wrong reason or untested branches.

## Property-based testing (fast-check)

```ts
import fc from 'fast-check';
it('formatQty/parseQty round-trip for metres', () => {
  fc.assert(fc.property(fc.double({ min: 0.1, max: 1000, noNaN: true }), (q) => {
    const rounded = Math.round(q * 10) / 10;
    expect(parseQty(formatQty(rounded, 'm'))).toBeCloseTo(rounded, 5);
  }));
});
```

Use for invariants: round-trips (serialise/parse), idempotence (normalise twice = once), ordering (sort is stable), monotonicity (more quantity never costs less). Print the seed on failure and pin it as a regression case.

## Lint and types

`eslint-plugin-vitest` or `eslint-plugin-jest` (recommended configs: no focused tests, valid `expect`, no identical titles, prefer `toHaveLength`), `tsc --noEmit` including test files, Prettier.

## Flake policy

A unit test that depends on order, time, network or shared mutable state is a bug: fix the test or the seam the same day; never retry unit tests in CI.

## Speed budget

Whole unit suite under a minute locally and in CI before any slower layer; `--changed` locally; isolate expensive setup in fixtures; shard only when the budget is exceeded.
