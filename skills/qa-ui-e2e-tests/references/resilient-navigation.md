# Resilient navigation for volatile UIs (A/B funnels, weekly redesigns, no test hooks)

When the set, order and copy of screens change constantly, a Page Object per screen encodes exactly the thing that changes. Encode the goal and the interaction shapes instead.

## Model

```
src/config.ts        the single calibration surface: entry URL, terminal patterns + markers, interruptions, hints, limits
src/archetypes.ts    detectArchetype(page) and handle(page, archetype, identity, attempt)
src/navigator.ts     traverse(): loop until terminal; settle(); fingerprint(); waitForDomStable()
src/ai-fallback.ts   optional: classify an unknown screen into a known archetype; never acts
src/outcome.ts       business assertion via the created session (API) with a documented fallback
src/cleanup.ts       undo real side effects; best-effort but loud
src/identity.ts      unique, greppable, rule-compliant test data per run
tests/unit/          pure decision logic (value chooser, slug parser, data format)
tests/e2e/           the one journey
```

## Archetypes

`single-choice | multi-choice | text-form | slot-picker | interstitial | terminal | unknown`. Detection order: terminal → slot picker → text inputs → ≥2 genuine options (buttons with visible text; excludes icon-only back/sound buttons) → a usable advance control (interstitial) → unknown.

- Scope every search to `dialog[open]` when present; otherwise the page. Background controls remain `isVisible()` under a modal.
- Terminal = any URL pattern **or** any on-screen marker. Patterns match a substring (`/dashboard/i`), not a path segment: a `/\/dashboard/` pattern silently stops matching the day the route becomes `/student-dashboard`.
- Handlers are indifferent to content: pick the n-th usable option (`attempt` index), fill inputs by semantic hints (`type`, `autocomplete`, `name`, `placeholder`) via a pure `chooseValue()`.

## Loop

```ts
for (let i = 0; i < limits.maxSteps; i++) {
  await waitForDomStable(page, limits.transitionSettleMs);      // poll fingerprint until two reads agree
  await dismissInterruption(page);                                // cookie banner, exit-intent popup; every iteration
  let archetype = await detectArchetype(page);
  if (archetype === 'unknown') archetype = await reclassifyUntil(page, limits.progressTimeoutMs);   // redirect chains
  if (archetype === 'unknown') { const v = await classifyWithAi(page); if (v?.archetype !== 'unknown') { archetype = v.archetype; aiFallbacks++; } else throw new UnknownScreenError(...); }
  path.push({ index: i, slug: slugOf(page.url()), archetype, classifiedBy });
  if (archetype === 'terminal') return { path, completed: true, aiFallbacks };
  const before = await fingerprint(page);
  await handle(page, archetype, identity);
  await settle(page, before, attempt => handle(page, archetype, identity, attempt));
}
throw new Error(`Did not terminate within ${limits.maxSteps} steps. Path: ...`);
```

`settle()`: dismiss interruptions again; if `changedWithin(autoAdvanceTimeoutMs)` return; else if an advance control is usable click it and expect a change within `progressTimeoutMs`; else pick a *different* option (attempt+1) up to a small budget; otherwise fail with the URL. Re-clicking the same multi-select option toggles it off.

`fingerprint()` = `pathname :: first h1/h2 text :: count(button, input, textarea, dialog[open])`. Counting every DOM node produces false "changed" signals from chat widgets; scope to what the suite acts on.

## Interruptions

Config entries `{ selector, dismiss: 'escape' | 'click', clickNames?: RegExp[] }`. Native `<dialog>` closes on Escape; custom banners need their own reject button. Dismiss before classification and inside the retry loop, not just once per step.

## Inputs

- Skip inputs that are not visible/editable (zero-size duplicates exist).
- Bound attribute reads (`{ timeout: 2_000 }`) and skip on failure: an outgoing screen's input can pass `isVisible()` mid-transition.
- Idempotent filling: if the field already contains the value (digits-only compare for `tel`), skip. A false "changed" signal once caused infinite appends.
- `tel`: clear completely and type a full international number for the product's market; the pre-filled country code follows the machine's locale, so appending digits yields a different country on every runner.
- Generated data must satisfy the validation rules you discovered (allowed characters, word counts, password policy) and be pinned by a unit test.

## AI fallback (optional)

Send a compact snapshot (URL, headings, visible button texts, inputs with type/name/placeholder) and ask for JSON `{ archetype: one of KNOWN | 'unknown', reason }`; "unknown" is better than a wrong guess. Route the answer into the same deterministic handler. Count calls and put them in the report; a rising count means config drifted. The suite must work with no API key.

## Outcome and cleanup

- Assert the business outcome (account exists, booking exists) via the session the funnel created (`page.request` shares cookies), not just the success screen; fall back to specific on-screen details and mark the fallback in the result.
- Wrap the whole traversal in `try/finally`; resolve the user id from the session in `finally` even when traversal threw, because accounts are created before the last screen. Log loudly when cleanup fails; schedule a sweep job keyed on the greppable convention for the CI-killed case.
- `retries: 0`, `workers: 1`, scheduled runs (30-60 min on stage) plus on-deploy; never per PR.
- Attach `funnel-path.json` to the test; it tells you which variant was served without hardcoding any.

## Unit project

Pure functions (`chooseValue`, `slugOf`, identity format, terminal matching) in `tests/unit` as a separate Playwright project (or Vitest) so the free tests are visibly separate from the ones that cost a real booking.

## Push for testability

Record in the README that stable `data-testid` on choice options and advance controls would remove most of the structural fragility, and file it with the dev team. Heuristics are a stopgap.
