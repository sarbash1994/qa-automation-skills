# Code and naming conventions

These keep a suite readable at 100+ tests. Apply them to new code and nudge existing code toward them one file at a time.

## Files and names

- `tests/api/<resource>.spec.ts`, `tests/e2e/<journey>.spec.ts`, `tests/unit/<module>.spec.ts`. Jest projects: `tests/<resource>.test.js`.
- One client per service: `src/clients/<Service>Client.ts` (Jest) or `src/api/ApiClient.ts` + `src/api/<Stream>Client.ts` (Playwright). Methods named after the endpoint's verb + noun: `createTodo`, `getTagPalette`, `adminOverview`.
- Page Objects: `src/pages/<Screen>Page.ts` extending `BasePage`; locators are `readonly` fields; actions are verbs (`open`, `login`, `addTodo`); queries return `Locator` (`todoByTitle(title)`).
- Builders: `build<Entity>(overrides)`, `valid<Entity>()`, `invalid<Entity>()`, `<entity>Without(field)`, `unique<Thing>(prefix)`.
- Fixtures: nouns for what the test receives (`api`, `adminApi`, `sharedUser`, `registeredUser`, `analytics`, `dashboardPage`).
- Schemas: `schemas/<service>/<resource>.yaml`, schema names in PascalCase matching the response family (`LoginSuccess`, `AuthError`, `UsersList`).

## Test titles

Sentence-style outcomes, lower-case start, no numbering:

- `rejects login with a wrong password (400 Invalid credentials)`
- `records a register event with name, email and numeric gender`
- `partial body acts like replace (not patch)`
- `creating a todo in the UI is captured by analytics`

Include the status code or exact message in the title when that is the contract being pinned. Tag by layer in the `describe` title (`@api`, `@e2e`, `@validation`, `@defect`) or via Playwright `tag` options.

## Test body shape

```ts
test('rejects a todo without a title', async ({ sharedUser }) => {
  const res = await sharedUser.api.createTodo('');          // call
  expect(res.status()).toBe(400);                            // assertions
  expect((await res.json()).message).toBe('Title is required');
});
```

- Arrange via fixtures and builders, not inline setup blocks.
- One behaviour per test. Several assertions about the same response are fine; two actions with assertions in between usually means two tests, except for lifecycle tests that are explicitly named as such.
- Prefer exact matches for messages the API documents; regex only for messages that legitimately vary.
- Attach the useful artifact (`testInfo.attach('funnel-path.json', ...)`) and annotate identity (`testInfo.annotations.push({ type: 'run-identity', description: email })`) when a failure needs it to be debuggable.

## Comments

Write them for the person who will be tempted to simplify the code:

- State the **why** and the **live observation**: "Confirmed live: the background page's own Continue button stays `isVisible()===true` under a modal, so an unscoped search hangs on 'subtree intercepts pointer events'."
- Warn what not to relax: "Playwright's `isVisible()` excludes zero-size elements, which is what keeps this from writing into the invisible duplicate input. Do not relax to a plain DOM presence check."
- Numbers get their reason: `autoAdvanceTimeoutMs: 6_000 // widened from 3_000 after a live run got stuck on a slow auto-advancing step ...`.
- Mark guesses: `// CALIBRATE: /api/v1/users/me inferred from the cleanup endpoint, not confirmed`.
- Avoid comments that restate the code.

## Tooling gates

- `typecheck`: `tsc --noEmit` (TS) or `tsc --noEmit --allowJs --checkJs` with `// @ts-check` (JS).
- `lint`: ESLint flat config with `eslint-plugin-playwright` (forbids `page.waitForTimeout`, `.first()` without reason via `no-nth-methods`, missing `await` on expects) or `eslint-plugin-jest`; Prettier for formatting; Husky + lint-staged pre-commit; conventional commits.
- Dependencies pinned via lockfile, updated by Renovate/Dependabot; Playwright kept current because browser versions ship with it.

## TypeScript

- `strict: true`, `noUnusedLocals`, `noUnusedParameters`; `tsc --noEmit` as the `lint` script and a CI gate.
- Domain types derived from real responses in `src/utils/types.ts`; document inconsistencies in the type (`gender?: 0 | 1; // numeric in events (vs string in profile)`).
- Path aliases (`@api/*`, `@pages/*`, `@fixtures/*`) when the tree is deep enough to need them.

## Plain JavaScript (when the team is not on TS)

- ESM (`"type": "module"`), Node 20+, `.nvmrc`; Jest via `node --experimental-vm-modules node_modules/jest/bin/jest.js`.
- `jsconfig.json` with `"types": ["jest"]` for editor support.
- Same layering; classes for clients so dependencies are explicit in constructors.

## Things to avoid

- Helpers named after scenarios; assertion helpers hidden in clients; `expect` inside Page Object methods beyond the readiness check that proves an action landed.
- `waitForTimeout` outside of explicitly documented settle windows.
- Positional selectors without a filter; CSS classes as hooks.
- Catch-all `try/catch` in tests; swallowing errors in cleanup without a `console.warn` that names the leftover.
- Retrying tests whose pass has a side effect; per-PR runs of such tests.
- Committing `.env`, real credentials, or model/vendor identifiers in artefacts.
