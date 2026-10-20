# Plan template for test automation work

Use when `superpowers:writing-plans` is not available. The plan is the set of decisions the implementer cannot make alone: files, names, signatures, exact values from the strategy, the check that proves each task, and the layer skill plus documentation pages that govern it. A plan longer than the code it describes has written the code instead.

Every task ends with the suite runnable and green (or green plus declared `test.fail` defects). Prefer this order: config and env → unit project for pure logic → HTTP/client layer with one smoke test → fixtures and auth → first endpoint or journey end to end → schema/contract layer → remaining coverage by area → CI and reporting → README and conventions.

````markdown
# <Project>: test automation implementation plan

> **For agentic workers:** implement task by task; steps use checkbox (`- [ ]`) syntax. Each task names the skill to load and the official documentation pages to read before writing tool-specific settings.

**Goal:** one sentence.

**Architecture:** 2-3 sentences (runner, language, layering, auth, CI).

**Tech Stack:** exact packages and majors (e.g. `@playwright/test` 1.6x, TypeScript 5, `allure-playwright` 3).

**Strategy:** `docs/.../YYYY-MM-DD-<topic>-test-strategy.md`

## Global Constraints

One line each, copied verbatim from the strategy: rate limits and the resulting worker/parallelism rule, retries policy, data conventions, secrets handling, lint/typecheck gates, naming rules.

## Review Focus

The five failure modes most likely to bite that no task's checks exercise, each with the check added to the owning task.

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `src/config/env.ts` | typed env, fail fast | 1 |
| ... | ... | ... |

## How to run checks

```bash
npm run typecheck && npm run lint && npm run test:api
```

---

### Task N: <component>

**Skill:** `qa-unit-tests` | `qa-api-tests` | `qa-ui-e2e-tests` | `qa-mobile-tests` | `qa-automation-architect`

**Docs to read first:** the specific pages (e.g. Playwright "Test use options" for `video`, "Reporters"; GitHub Docs "Using custom workflows with GitHub Pages").

**Files:**
- Create: `exact/path`
- Modify: `exact/path:lines`
- Test: `tests/exact/path.spec.ts`

**Interfaces:**
- Consumes: what this task uses from earlier tasks (exact names, signatures)
- Produces: what later tasks rely on (exact names, parameter and return types)

- [ ] **Step 1: Write the first spec that must pass** (name and assertions as code, exact values from the strategy)
- [ ] **Step 2: Run it and confirm the expected failure** - Run: `npx playwright test tests/api/todos.spec.ts -g "creates a todo"` - Expected: FAIL with "<reason>"
- [ ] **Step 3: Implement `ClassName.method(args): ReturnType` in `exact/path`** (one line on approach where the signature leaves a choice)
- [ ] **Step 4: Run the suite** - Run: `npm run test:api` - Expected: PASS, N tests
- [ ] **Step 5: Commit** - `git add ... && git commit -m "test(api): ..."`
````

## Self-review before handing over

1. Every strategy section maps to a task; list gaps.
2. Every step lets the implementer write exactly one reasonable thing; no "handle edge cases", no bodies the signature and test already determine.
3. Names and signatures agree across tasks.
4. Every Review Focus line has its check in a task.
5. Each task names its skill and its documentation pages.
6. Proportion: the plan is shorter than the code it describes.

## Handoff

Link the plan, summarise the milestones, and ask the user to review and pick an execution mode (in-session task by task, or fresh subagent per task with a reviewer between tasks) before implementation starts.
