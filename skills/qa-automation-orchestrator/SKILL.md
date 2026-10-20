---
name: qa-automation-orchestrator
description: Brainstorm, scope, design and plan test automation work before building it, then route execution to the right layer skill. Use this FIRST whenever the user wants to start, extend, rescue or rethink test automation - a new framework, a QA take-home, "add e2e/API/mobile tests", "our tests are slow or flaky", "what should we automate", a test strategy or plan, or a tool choice (Playwright vs Cypress vs WebdriverIO, Detox vs Maestro) - even when they jump straight to "write the tests". Asks the questions that decide the architecture, offers reconnaissance, plays the design back, writes a test-strategy document and a task-by-task plan, then hands tasks to qa-automation-architect, qa-api-tests, qa-ui-e2e-tests or qa-mobile-tests. Works with superpowers brainstorming/writing-plans when installed.
---

# QA Automation Orchestrator

You are good at writing tests. You write the suite you believe the team needs, and that belief is usually thinner than it feels: which layer should prove a behaviour, what the target's rate limits and side effects allow, which tool the team can maintain, what "done" means to the person asking. This skill finds that out first, writes it down, and only then routes the work to the layer skills:

- `qa-automation-architect` - framework structure, audits of existing suites, CI/reporting, conventions.
- `qa-api-tests` - clients, schemas, builders, async side effects, negative matrix.
- `qa-ui-e2e-tests` - browser suites, locators, Page Objects, auth state, volatile UIs, WDIO/BrowserStack.
- `qa-mobile-tests` - Detox, Maestro, Appium, device clouds, RN layering.

Each of those carries a "verify against official documentation before answering" protocol. Anything tool-specific that ends up in the strategy or plan (an option, a flag, an action input) must come through that protocol, not from memory.

## First: what do you actually know?

Before replying, ask yourself what you know about what they want and why.

- **Everything that matters is in the request** ("add a 404 test for `GET /todos/:id`", "rename this fixture"). Quick, clear task: do it through the matching layer skill and say what you did.
- **Something non-trivial is missing** (which layer, which tool, what the target allows, what success looks like). Start the conversation.

If the project already has a test-strategy document or an audit report (look in `docs/`, `TESTING.md`, `docs/superpowers/specs/`), read it before asking anything; do not re-ask what it answers.

## Your first message

Two things, in this order:

1. One line saying that if they would rather skip the questions and have you start, they can say so. If they do, this skill is done: state the significant choices you are making (runner, language, layer split) in one plain line, then do the work through the layer skills.
2. One open question that gets them describing. Anchor it in a moment: "What was the last bug that reached users that a test should have caught?" or "Walk me through what happens today when someone wants to know whether the app still works."

That is the whole message.

## The conversation

Each message ends with one question: a single sentence, no list of example answers hanging off it. Plain language, matched to theirs; no process jargon. Playback and questions alternate.

**Get them describing first.** Open questions before menus. Offer a short menu only when they are stuck; when they say "you decide", propose something concrete and say it is your call.

**Ground to cover.** Territory, not a script; never read these out as a list. The full set with probing questions is in `references/question-territory.md`:

- what is under test (API, web, mobile, all), and what exists today (tests, CI, hooks, docs, a brief for a take-home)
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
Nothing gets built until the user approves the full description: in chat for a small change, the document for a project. Building includes scaffolding a framework, installing test dependencies, writing spec files, editing CI, and invoking a layer skill to implement. Reading, running the existing suite and recon are fine.

Exceptions: they opted out of the questions (the skill is done and the gate goes with it); a spike they said yes to (stays throwaway).

After the document is approved, the next step is the plan, never implementation.
</HARD-GATE>

## The plan

If `superpowers:writing-plans` is installed, invoke it with the strategy document as the spec; it owns the plan format and the execution handoff. Otherwise write the plan yourself with `references/plan-template.md`: header (goal, architecture, stack, spec path), global constraints copied verbatim from the strategy, review focus (the five failure modes most likely to bite that no task's checks cover), file structure, then tasks.

Task boundaries for test frameworks differ from product code: every task ends with the suite **runnable and green** (or green plus declared `test.fail` defects), and each task names the layer skill that implements it and the official documentation pages it must consult. Typical order: config and env → HTTP/client layer with one smoke test → fixtures and auth → first endpoint or journey end to end → schema/contract layer → remaining coverage by area → CI and reporting → README. Self-review the plan against the strategy: every strategy section has a task, every task has a verification command with its expected output, names and signatures agree across tasks, and the plan is not longer than the code it describes.

Save to `docs/superpowers/plans/YYYY-MM-DD-<topic>.md` or `docs/testing/plans/`, link it, and ask the user to review and choose how to execute (task by task in this session, or a fresh subagent per task with a reviewer between tasks) before starting.

## Execution routing

For each task: load the named layer skill, follow its section 0 (official docs lookup) for every tool-specific setting, implement, run the task's verification command, commit, then move on. Cross-cutting tasks (CI, conventions, README, audit) go to `qa-automation-architect`. When a task reveals that the strategy was wrong (a limiter nobody knew about, no test hooks after all), stop, update the strategy document with the finding and the new decision, and continue only after the user has seen the change.

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
