# Evals

How the skills are checked, and the latest results. The repository root is a Claude Code plugin (`.claude-plugin/plugin.json`, skills under `skills/`), and the cases live here, outside the skill directories, under `evals/<skill>/<case>/` in the layout the `claude plugin eval` CLI reads (`prompt.md`, `case.yaml`, `graders/*.md`, `files/` with the fixture project, `place-files.sh`). Installing a skill with `npx skills add` copies only its `SKILL.md` and `references/`. The cases can also be run by hand: copy the fixture, give an agent the prompt with and without the skill, grade each assertion with evidence.

## Fixtures

| Fixture | What it is | Used by |
|---|---|---|
| `todo-api` | Express API with five endpoints, `openapi.yaml`, a demo user and a 40-logins-per-15-minutes limiter on `/api/auth/login`; no tests | greenfield strategy, API suite, 429 fix |
| `shop-web` | Playwright suite with good conventions (storage-state auth, Page Objects on `getByTestId`/roles, fixtures, API seeding) plus one deliberately bad spec (`checkout.spec.ts`: UI login per test, sleeps, CSS selectors, try/catch, helpers and loops in the spec, computed totals) | fast path, audit, flaky fix, video + Pages |
| `pricing-lib` | TypeScript module with pure pricing logic and an I/O-bound `notifyUser`, Vitest configured, no tests | unit tests, mocking advice |

## Protocol

- **With and without the skill.** Each case runs once with the skills installed and once without, by independent agents with the same tools (documentation MCP, web fetch, shell).
- **Blind runs.** A run sees only the prompt and the fixture. The assertions stay outside the run tree until grading, and the skills do not contain `evals/`, so no run can read or list what will be checked.
- **Graded with evidence.** Independent grader agents check each assertion in `graders/` against the answer, the files and the transcript, and quote what they relied on.

## Latest results

### All ten cases

The latest full run, graded against the 83 assertions of that time (the set has since grown to 87).

| Case | Skill | With skill | Without skill |
|---|---|---|---|
| fast-path-existing-suite | orchestrator | 7/7 | 6/7 |
| greenfield-api-strategy | orchestrator | 6/6 | 1/6 |
| audit-existing-suite | architect | 9/9 | 4/9 |
| unit-tests-pricing | unit | 9/11 | 6/11 |
| mocking-advice-notify | unit | 9/9 | 6/9 |
| api-suite-from-openapi | api | 9/11 | 3/11 |
| rate-limit-429-fix | api | 4/5 | 1/5 |
| video-report-gh-pages | ui | 4/7 | 3/7 |
| fix-flaky-checkout-spec | ui | 9/9 | 6/9 |
| expo-e2e-choice | mobile | 9/9 | 4/9 |
| **Total** | | **75/83 (90%)** | **40/83 (48%)** |

| Average per run | With skill | Without skill |
|---|---|---|
| Tokens | 124,710 | 103,142 |
| Time | 251 s | 175 s |

With the skill, runs cost about 1.2x the tokens and 1.4x the time of the baseline. Most of the extra goes into evidence: proving defect pins on a fixed copy, sweeps against a reference, type-checks and lint. Documentation is looked up only when a detail is uncertain or on a skill's "Check first" list.

What separated the variants:

- **Literal oracles and logic-free specs.** Baseline runs computed expected values from page state, parsed text in helpers and put control flow in specs. Skill runs asserted literal values with web-first assertions.
- **Robustness the task did not spell out.** Only skill runs wrapped every API call in a capped 429 handler, kept cleanup that survives assertion failure, pinned found defects with `test.fail`/`it.fails` and proved each pin flips, and closed the shared-cart race between spec files.
- **Credentials and users.** Skill runs read credentials only from env and fail fast when they are missing, and they establish how test users are created before designing isolation. Baseline runs hard-coded the demo credentials as defaults.
- **Sources in the answer.** Every skill run named the pages it used next to the claims they support. Baseline runs kept their sources in the run log in eight of ten cases.
- **Discovery discipline.** On the greenfield case the skill stayed in discovery; the baseline committed to a full tool stack in its first turn.

### Published report case, three runs each

After the UI skill gained its published-report guidance, `video-report-gh-pages` was rerun three times per variant.

| Run | With skill | Without skill |
|---|---|---|
| 1 | 9/9 | 7/9 |
| 2 | 9/9 | 6/9 |
| 3 | 9/9 | 6/9 |
| **Total** | **27/27** | **19/27** |

Every skill run guarded the deploy on a report existing and on `main`, kept the report as a regular artifact and named the pages it used. One skill run noticed that the Playwright HTML report titles every `fill` step with its value; a local check with Playwright 1.64.1 confirmed a password from an environment variable in the report data with trace, video and screenshot all off. The skill now keeps the login out of the published run, and the check was tightened to match: graded against it, the skill scores 25/27 and the baseline 19/27.

### Routing

`evals/routing/` checks which skill Claude invokes first for 30 requests, twice each, with all six skills installed in a clean project alongside other plugins.

| Group | Queries | Routed as expected |
|---|---|---|
| Belong to a specific skill | 21 | 42/42 |
| Near misses, none of these skills | 9 | 18/18 |

The orchestrator's fast path held: a concrete "add a coupon test to our existing suite" went straight to the UI skill both times. Borderline requests (a slow, flaky suite; Allure reporting) routed the same way in both repeats. No skill fired on TDD, a product bug fix, lint setup, an app deploy, profiling, a README or a load test; a screenshot request went to another installed skill. Caveats: the queries were written with the descriptions in view, and a run stops after four non-skill tool calls, so a skill loaded later would not be seen.

### Changes since the latest run (not yet measured)

- API skill: the optional second account logs in once per worker; a test-scoped fixture only skips or wraps the token, so cross-user tests no longer spend the login budget per test.
- Unit skill: the msw example uses an absolute base URL, and a note explains that relative URLs throw in the Node environment before msw sees them.
- Architect skill: the CI example writes action versions as `@<major>` instead of majors that go stale.
- All layer skills: problems noticed outside the request (another spec that types credentials, a broken script) are reported with an offered fix, not changed silently.
- Orchestrator: the first message may open with one or two checked findings from the project, each with its source, before the opt-out line and the one question.

## Running with the CLI

From the repository root, with Claude Code v2.1.269 or later:

```bash
claude plugin eval . --scaffold --allow-tools Write Edit Bash WebFetch
```

The plugin under test is the whole repository, so all six skills are loaded in the with-skill arm. To run one skill's cases, filter by its tag or by case name:

```bash
claude plugin eval . --tag qa-unit-tests --scaffold --allow-tools Write Edit Bash WebFetch
claude plugin eval . --case 'rate-limit-*' --scaffold --allow-tools Write Edit Bash WebFetch
```

`--scaffold` copies each case's fixture into the run's workspace; without it the cases run against an empty workspace. These are real, billed model runs. Add `--max-cost-usd` to cap spend; the report lands under `evals/results/`, which is git-ignored.
