# Test-strategy document template

Write for a competent QA engineer who has not met the user and cannot ask them anything. Mark each decision with who made it: **(theirs)** for what the user said, **(my call)** for defaults you chose, **(finding)** for what recon showed. Keep it under ~1500 words; link to detail rather than pasting it.

```markdown
# <Project or system>: test automation strategy

Date: YYYY-MM-DD. Status: draft for review | approved.

## Intent

Two or three sentences: what is under test, why automation now, what success looks like to the user (their words).

## Goals, non-goals, anti-goals

- Goals: ...
- Non-goals: what this deliberately does not cover (e.g. visual regression in phase 1).
- Anti-goals: what would make this a failure even if it works (flaky reruns, >N-minute pipeline, tests nobody can read, tests that pass while the product is broken).

## Inputs received

Documents the strategy rests on, with where they live and what they leave unexplained: API contract (OpenAPI/GraphQL/collection), architecture overview, ADRs, data model, journeys, existing tests and CI. Gaps become tasks ("derive endpoint inventory") or user questions.

## What was found (recon)

Facts about the target that force decisions, each with its consequence:
- Auth: ... → ...
- Rate limits: ... → ...
- Side effects of a passing run: ... → ...
- Data isolation: ... → ...
- Test hooks: ... → ...
- Real behaviour of the target (what a stub validates, inconsistencies): ... → ...
- Environments and access: ... → ...

## Scope by layer

| Behaviour / area | Proven at | Why there |
|---|---|---|
| Decision logic (parsers, pricing, navigation rules), components | unit (`qa-unit-tests`) | no I/O, milliseconds |
| Validation rules, auth, pagination, contracts | API | fast, deterministic |
| Critical user journeys (list them) | browser / device E2E | user-visible, rendering |
| Non-functional (visual, a11y, perf) | targeted checks | ... |

Out of scope with reasons.

## Architecture decisions

| Decision | Choice | Owner | Why |
|---|---|---|---|
| Runner(s) and language | ... | theirs / my call | ... |
| Layering (config, core, clients, schemas, data, fixtures, pages, tests) | ... | my call | per qa-automation-architect §3 |
| Auth strategy (storage state, API tokens, shared worker users) | ... | ... | ... |
| Test data (builders, uniqueness, cleanup, greppable convention) | ... | ... | ... |
| Environments (targets, secrets, `.env.example`) | ... | ... | ... |
| Parallelism and isolation (workers, projects, side-effect handling) | ... | ... | ... |
| Reporting (runner HTML, Allure, JUnit, badges, where published) | ... | ... | ... |
| CI (platform, triggers, matrix/sharding, schedule for side-effecting suites) | ... | ... | ... |
| Cloud providers (BrowserStack etc.), if any | ... | ... | ... |
| Code quality gates (typecheck, lint plugins, formatting) | ... | ... | ... |

Alternatives considered and why rejected (2-3 lines each).

## Flake, defect and quarantine policy

- Retries: ... (0 where runs have side effects)
- Known defects encoded as `test.fail`/`it.failing` with ticket; README "Findings" mirrors them.
- Quarantine: owner + deadline, never silent skips.
- Waits: web-first assertions and app readiness signals only; documented settle windows otherwise.

## Risks and open questions

- Risk → mitigation.
- Open questions the builder may settle vs. ones that need the user.

## Left to the builder

What the plan may decide without coming back (file names inside the layering, exact builders, order of coverage within an area).

## Milestones

1. First useful run: ... (what is green, how long it takes)
2. ...
3. ...

## Documentation to consult during build

Tool pages the implementation must read before configuring each item (from the layer skills' `official-docs.md`): list the specific topics (e.g. Playwright video + reporters; GitHub Pages custom workflow; Allure history for the installed major).
```
