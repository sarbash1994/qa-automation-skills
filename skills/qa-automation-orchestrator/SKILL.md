---
name: qa-automation-orchestrator
description: Brainstorm, scope, design and plan sizeable test automation work before building it, then route tasks to the layer skills. Use for a new test framework or suite, a QA automation take-home, an audit or rescue of an existing suite ("slow", "flaky", "nobody trusts it"), a test strategy or plan, a tool or architecture choice, or work that spans several layers (unit + API + e2e). Collects the project's own documentation first (OpenAPI/Swagger, GraphQL schema, architecture docs, ADRs, API collections), asks the questions that decide the architecture, writes a test-strategy document and a task-by-task plan, then hands tasks to qa-automation-architect, qa-unit-tests, qa-api-tests, qa-ui-e2e-tests or qa-mobile-tests. Not for a single concrete test in a suite that already has its runner, fixtures and conventions; go straight to the matching layer skill. Works with superpowers brainstorming/writing-plans when installed.
---

# QA Automation Orchestrator

You are good at writing tests. You write the suite you believe the team needs, and that belief is usually thinner than it feels: which layer should prove a behaviour, what the target's rate limits and side effects allow, which tool the team can maintain, what "done" means to the person asking. This skill finds that out first, writes it down, and only then routes the work to the layer skills:

- `qa-automation-architect` - framework structure, audits of existing suites, CI/reporting, conventions.
- `qa-unit-tests` - unit and component tests, pure-logic extraction, doubles and mocking, coverage and mutation gates.
- `qa-api-tests` - clients, schemas, builders, async side effects, negative matrix.
- `qa-ui-e2e-tests` - browser suites, locators, Page Objects, auth state, volatile UIs, WDIO/BrowserStack.
- `qa-mobile-tests` - Detox, Maestro, Appium, device clouds, RN layering.

The set installs selectively; if a skill named below is not installed, keep its responsibilities in this skill's plan and do the work with the guidance here and the project's conventions. Each of those carries a "verify against official documentation before answering" protocol. Anything tool-specific that ends up in the strategy or plan (an option, a flag, an action input) must come through that protocol, not from memory.

## Fast path: when not to run this skill

Most requests in a project that already has a test suite do not need a brainstorm. Before anything else, check the repo: is there a runner config, are there fixtures or builders, do existing specs show the conventions? If yes and the request names a concrete thing ("add e2e for checkout", "cover `DELETE /todos/:id`", "a unit test for the pricing helper", "fix this flaky test"), skip the questions, the strategy and the plan: load the matching layer skill, follow the existing conventions, do the work and say what you did. Ask at most one question, and only if the answer changes what gets built (which user role, which environment). The gate below does not apply to this path.

Run the full process when one of these is true: no suite exists yet; the request is a take-home or a new framework; the user asks for a strategy, an audit, a plan or a tool choice; the work spans several layers; the existing suite is the problem ("slow", "flaky", "unmaintainable"); or the conventions in the repo contradict each other and someone has to decide.

## First: what do you actually know?

Before replying, ask yourself what you know about what they want and why.

- **Everything that matters is in the request** (the fast path above). Do it and say what you did.
- **Something non-trivial is missing** (which layer, which tool, what the target allows, what success looks like). Start the conversation.

If the project already has a test-strategy document or an audit report (look in `docs/`, `TESTING.md`, `docs/superpowers/specs/`), read it before asking anything; do not re-ask what it answers.

## Your first message

Two things, in this order:

1. One line saying that if they would rather skip the questions and have you start, they can say so. If they do, this skill is done: state the significant choices you are making (runner, language, layer split) in one plain line, then do the work through the layer skills.
2. One open question that gets them describing. Anchor it in a moment: "What was the last bug that reached users that a test should have caught?" or "Walk me through what happens today when someone wants to know whether the app still works."

That is the whole message.

## Ask for the project's own documentation

Early in the conversation, before proposing anything, ask for the material that describes the system; it replaces a dozen questions and prevents a strategy built on guesses. Ask once, as a short list of what would help, and make clear that partial answers are fine:

- **API contracts**: OpenAPI/Swagger (file or `/swagger`, `/openapi.json`, `/api-docs` URL), GraphQL schema or introspection endpoint, AsyncAPI for events, gRPC protos, Postman/Bruno/Insomnia collections.
- **Architecture**: README, architecture overview or C4/sequence diagrams, ADRs, service map, data model or ERD, auth/permission model, environments and deployment topology.
- **Product**: user journeys, acceptance criteria, known defects or incident history, analytics event catalogue.
- **Engineering**: repo layout, existing tests and CI config, coding conventions, test data and seeding scripts, access to a test environment and the credentials process.

Read what arrives before the next question and fold it into the playback as findings. Where a contract exists, it becomes the source for schemas, generated types and the endpoint inventory; where none exists, say so in the strategy and plan a task to derive one (record traffic with devtools or a proxy, enumerate endpoints from the client code) before writing API tests. When the user cannot share documents, ask them to describe the same things in their words and mark those as their statements.

## The conversation

Each message ends with one question: a single sentence, no list of example answers hanging off it. Plain language, matched to theirs; no process jargon. Playback and questions alternate.

**Get them describing first.** Open questions before menus. Offer a short menu only when they are stuck; when they say "you decide", propose something concrete and say it is your call.

**Ground to cover.** Territory, not a script; never read these out as a list. The full set with probing questions is in `references/question-territory.md`:

- what is under test (API, web, mobile, all), and what exists today (tests, CI, hooks, docs, a brief for a take-home)
- which documentation exists and has been handed over (API contracts, architecture, ADRs, data model) and what it leaves unexplained
- why now, and what success looks like (a green badge, a reviewer's approval, catching a class of bugs, speed)
- goals, non-goals, anti-goals (what would make this a failure even if it technically works: a flaky suite, a 40-minute pipeline, tests nobody can read)
- the target's constraints: auth layers, rate limits, side effects of a passing run, data isolation, stable test hooks, environments
- how it gets made: runner and language the team can maintain, CI platform, reporting, cloud providers, budget and deadline
- prior art: what they liked or hated in suites they have worked with

**Offer recon.** As soon as looking would help, offer to go look and say what for: read `package.json`, the runner config and CI; run the existing suite once; walk the target by hand (auth, `RateLimit-*` headers, `data-testid` presence, what a stub really validates); read the API reference. They decide whether you go. Recon findings go into the playback marked as findings, not as their decisions. The checklist is section 2 of `qa-automation-architect`.

**Think wide privately.** Before proposing, draft 2-3 architectures (for example: Playwright-only with API + E2E projects; Jest + Axios for API plus Playwright for UI; WebdriverIO for web + Appium) and drop the ones that fight what they told you. Show the comparison only when it helps them decide; the tool table in `qa-automation-architect` section 7 is the starting point.

**Spike when it is cheaper than talking.** A ten-minute throwaway (one request against the API, one Playwright script against the login page) often answers "is the target automatable at all" faster than questions. Offer it; label the result throwaway; keeping it is a new request.

## Play it back

As soon as one part is clear (the scope and layer split, say, or the constraints that force the architecture), describe it back in 200-300 words, then ask about the next part. Mark guesses as guesses; only what they said goes in as theirs. End each chunk with "what is wrong or missing?".

## Size the work

| Size | The full description | Then |
|---|---|---|
| Quick, clear task | the request itself | do it through the layer skill |
| Small change (a few tests, one fixture, one CI step) | in chat | build it through the layer skill after they agree |
| A project (new framework, migration, take-home, multi-layer suite) | a written test-strategy document | a task-by-task plan, then execution |

If it grows mid-task, stop, say so, and step up a size. If it is really several independent projects (API suite now, mobile later), say so, agree an order, and run this skill once per project.

## The written design: test-strategy document

For a project, write a document a competent QA engineer could plan from without coming back to the user. Use `references/strategy-template.md`. It covers intent and why, scope by layer (which behaviours are proven where), constraints discovered and what each forces, architecture decisions as decided (tool, language, layering, data, auth, environments) with the owner of each decision (theirs / your call), CI and reporting, flake and defect policy, risks, what is left to the builder, and milestones.

**Where it goes:** `docs/superpowers/specs/YYYY-MM-DD-<topic>-test-strategy.md` when the repo already uses that layout, otherwise `docs/testing/YYYY-MM-DD-<topic>-test-strategy.md`; committed. The user's preference overrides both.

**Builder check:** before handing the document over, dispatch a fresh subagent with `references/builder-check-prompt.md`. Tell the user a reviewer reads it first and you may come back once with a few questions. Sort what comes back into: answered already (put the answer in), minor (settle it, mark as your call), theirs (only they can answer and it changes what gets built). Bring the "theirs" pile in one message, most important first. Without a subagent tool, read the document as that builder yourself.

<HARD-GATE>
Applies to the project size only (the fast path and small changes are exempt). Nothing gets built until the user approves the full description: in chat for a small change that went through the conversation, the document for a project. Building includes scaffolding a framework, installing test dependencies, writing spec files, editing CI, and invoking a layer skill to implement. Reading, running the existing suite and recon are fine.

Exceptions: they opted out of the questions (the skill is done and the gate goes with it); a spike they said yes to (stays throwaway).

After the document is approved, the next step is the plan, never implementation.
</HARD-GATE>

## The plan

If `superpowers:writing-plans` is installed, invoke it with the strategy document as the spec; it owns the plan format and the execution handoff. Otherwise write the plan yourself with `references/plan-template.md`: header (goal, architecture, stack, spec path), global constraints copied verbatim from the strategy, review focus (the five failure modes most likely to bite that no task's checks cover), file structure, then tasks.

Task boundaries for test frameworks differ from product code: every task ends with the suite **runnable and green** (or green plus declared `test.fail` defects), and each task names the layer skill that implements it and the official documentation pages it must consult. Typical order: config and env → unit project for pure logic (when logic exists) → HTTP/client layer with one smoke test → fixtures and auth → first endpoint or journey end to end → schema/contract layer → remaining coverage by area → CI and reporting → README. Self-review the plan against the strategy: every strategy section has a task, every task has a verification command with its expected output, names and signatures agree across tasks, and the plan is not longer than the code it describes.

Save to `docs/superpowers/plans/YYYY-MM-DD-<topic>.md` or `docs/testing/plans/`, link it, and ask the user to review and choose how to execute (task by task in this session, or a fresh subagent per task with a reviewer between tasks) before starting.

## Execution routing

For each task: load the named layer skill (`qa-unit-tests`, `qa-api-tests`, `qa-ui-e2e-tests`, `qa-mobile-tests`), follow its section 0 (official docs lookup) for every tool-specific setting, implement, run the task's verification command, commit, then move on. Cross-cutting tasks (CI, conventions, README, audit) go to `qa-automation-architect`. When a task reveals that the strategy was wrong (a limiter nobody knew about, no test hooks after all), stop, update the strategy document with the finding and the new decision, and continue only after the user has seen the change.

## Existing suite mode

When the request is about a suite that already exists ("make it faster", "it is flaky", "review our tests"), the conversation starts from evidence rather than wishes: offer to run the audit checklist from `qa-automation-architect` (`references/audit-checklist.md`) first, bring back the three lists (harmful now, missing, fine), and brainstorm from there. The design document for this case is a migration strategy whose milestones each leave the suite green.

## Red flags

| Thought | Reality |
|---|---|
| "They said Playwright, so the architecture is settled" | A runner is one decision of ten. Layer split, auth, data, side effects and CI are still open. |
| "I'll write the tests and we can restructure later" | Tests written without fixtures and clients are the restructuring nobody does. Decide the layering first. |
| "The target is a public stub, I'll add the usual 400 tests" | Check what it actually validates. Inventing negatives is worse than fewer tests. |
| "Fresh user per test is cleanest" | Not under a 40-requests-per-15-minutes limiter. Recon decides. |
| "I know this config option" | Options drift. The layer skill's documentation protocol decides. |
| "They said 'sounds good' to the idea" | Approval covers what they saw. An unwritten strategy is not approved. |
| "Cross-browser everything" | Business flows with side effects run on one engine; rendering checks run on three. |
| "There is no API doc, I'll infer the endpoints as I go" | Ask for Swagger/OpenAPI, a schema or a collection first; if none exists, derive an inventory as a task before writing tests. |
