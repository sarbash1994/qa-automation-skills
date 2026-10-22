# Evals

How the skills are checked, and what the first iteration found. Each skill carries its cases under `skills/<skill>/evals/<case>/` in the layout the `claude plugin eval` CLI reads (`prompt.md`, `case.yaml`, `graders/*.md`, `files/` with the fixture project, `place-files.sh`). The cases can also be run by hand: copy the fixture, give an agent the prompt with and without the skill, grade each assertion with evidence.

## Fixtures

| Fixture | What it is | Used by |
|---|---|---|
| `todo-api` | Express API with five endpoints, `openapi.yaml`, a demo user and a 40-logins-per-15-minutes limiter on `/api/auth/login`; no tests | greenfield strategy, API suite, 429 fix |
| `shop-web` | Playwright suite with good conventions (storage-state auth, Page Objects on `getByTestId`/roles, fixtures, API seeding) plus one deliberately bad spec (`checkout.spec.ts`: UI login per test, sleeps, CSS selectors, try/catch, helpers and loops in the spec, computed totals) | fast path, audit, flaky fix, video + Pages |
| `pricing-lib` | TypeScript module with pure pricing logic and an I/O-bound `notifyUser`, Vitest configured, no tests | unit tests, mocking advice |

## Iteration 1 (2026-10-22)

Ten cases, each run once with the skill and once without, by independent agents with the same tools (documentation MCP, web fetch, shell). Graded by independent grader agents against the assertions in `graders/`, with the transcripts available for verification.

| Case | Skill | With skill | Without skill |
|---|---|---|---|
| fast-path-existing-suite | orchestrator | 5/5 | 5/5 |
| greenfield-api-strategy | orchestrator | 4/4 | 4/4 |
| audit-existing-suite | architect | 5/5 | 5/5 |
| unit-tests-pricing | unit | 5/5 | 5/5 |
| mocking-advice-notify | unit | 5/5 | 5/5 |
| api-suite-from-openapi | api | 5/5 | 5/5 |
| rate-limit-429-fix | api | 4/4 | 4/4 |
| video-report-gh-pages | ui | 5/5 | 5/5 |
| fix-flaky-checkout-spec | ui | 5/5 | 5/5 |
| expo-e2e-choice | mobile | 5/5 | 5/5 |

Cost: with the skill, runs took on average 1.5x the time and 1.3x the tokens of the baseline (the skill reads its references and consults documentation before acting).

### What the scores hide

The first assertion set was written to check structural hygiene (fixtures used, no sleeps, no logic in the spec, negatives without try/catch, documentation cited as a URL list). A capable model meets those unaided when the fixture already shows the conventions, so the scores do not separate the variants. The graders' side-by-side reading did, consistently in the same direction:

- **Documentation grounding.** With the skill, every run consulted and cited official pages (Playwright, Vitest, msw, GitHub Pages, Expo, Maestro, RFC 9110); without it, three of ten runs consulted nothing, one cited an unreleased docs site, and one asserted an outdated claim about Expo's recommendations.
- **Logic-free specs.** Baseline runs put `for` loops, `if`s and helper functions inside spec files in three cases; skill runs extracted them to support modules or `it.each` tables in every case.
- **Oracles.** The skill run asserted literal expected totals; the baseline computed the expected value from page state in a page-object helper, an oracle that passes when the price is wrong.
- **Robustness the task did not spell out.** Only skill runs added 429 handling with `Retry-After` and a cap, fixture-based cleanup that survives assertion failure, a `test.fail` pin for a discovered contract defect, a Pages workflow that is actually runnable (`package-lock.json` for `npm ci`) and does not deploy from pull requests, and the cross-test cart race under `fullyParallel` with a fix that removes it.
- **Discovery discipline.** On the greenfield case the skill stayed in discovery (findings, a request for documentation, one question); the baseline committed to a full tool stack in its first turn.
- **Mobile.** The skill required accessibility hooks alongside `testID`, ran both platforms on pull requests with a real device matrix nightly, and separated verified from unverified claims; the baseline gated iOS to nightly only and used positional selectors in starter flows.

### Changes made for iteration 2

The differences above are now assertions (graders `06+` in each case): documentation actually consulted (transcript-verified), literal expectations in spec and page object, logic-free specs with helper extraction, suite executed and green, 429 wrapper on every call, cleanup that survives failure, defects pinned with `test.fail`, runnable CI without PR deploys, parallel-isolation analysis, accessibility hooks and both platforms on PR. Iteration 2 reruns the same cases against the sharpened set.

## Running with the CLI

From a skill directory, with Claude Code v2.1.269 or later:

```bash
claude plugin eval . --allow-tools Write,Edit,Bash,WebFetch --scaffold
```

These are real, billed model runs; the report lands under `evals/results/`.
