# README template for an automation framework or take-home

Keep every section; drop a bullet when it is genuinely not applicable rather than padding it. Reviewers read the reflective sections (8) as closely as the code.

```markdown
# <Project> — <stack in four words>

[CI badge] [Test results badge (shields endpoint from Allure summary)] [Live Allure report]

One paragraph: what is under test, which layers (API / E2E / unit), and the strategy in one sentence
(e.g. "fast deterministic API layer as the backbone plus browser journeys for the critical paths").

## TL;DR — run it

```bash
npm ci
npx playwright install --with-deps chromium
cp .env.example .env        # fill in <where the values come from>
npm run test:api
npm run test:e2e
npm run report
npm run allure:serve
```

> ⚠️ Constraints a newcomer will hit immediately (rate-limit windows, secrets issued once, side effects).

## Application analysis (what the recon found)

- Auth layers and what each gate protects.
- Data isolation / tenancy.
- Selector hygiene (what is stable, what is randomised).
- Limits and quotas, as a table with scope / limit / consequence.
- Data model captured from live responses (types, inconsistencies).

## Architecture

```
src/
├─ config/   ...one line per directory...
```

**Design choices** — bullets, each "what" + "why" in one sentence.

## Test coverage

Per layer, per area, with the highlight suites called out.

## Findings & observations

Product observations first, then **Defects encoded as `test.fail()`** with the file name.

## CI

Trigger, matrix shape, where secrets live, what is published where.

## Summary

### Why it's built this way
### What I deliberately chose (and what I gave up)
### If I had more time
### Scaling to 100+ tests
```

Writing notes:

- State decisions in the first person and name the trade-off ("thinner structure, more direct tests; fine for this size").
- Every finding that changed the code gets a sentence here and a comment in the code.
- When the target is a stub that cannot fail a validation, say that you tested its real behaviour instead of inventing negatives.
- Keep the TL;DR honest: if API and E2E cannot run back-to-back because of a limiter, say so and give the workaround.
