# Authentication and state

> Snippets show the shape of a good setup, not a copy-paste source of truth. Option names and defaults drift between releases: confirm each one against the official page listed in `official-docs.md` for the version installed in the project before using it, and cite that page.

## Preferred: storage state via a setup project

```ts
// tests/auth.setup.ts
import { test as setup, expect } from '@playwright/test';
const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(ENV.userEmail);
  await page.getByLabel('Password').fill(ENV.userPassword);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/dashboard');                       // cookies set after redirects
  await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible();
  await page.context().storageState({ path: authFile });
});
```

Projects depend on `setup` and use `storageState: authFile`. Add `playwright/.auth/` to `.gitignore`. For multiple roles write one file per role and pick with `test.use({ storageState: 'playwright/.auth/admin.json' })`.

## When tests mutate server state: one account per worker

Override `storageState` with a worker-scoped fixture keyed by `test.info().parallelIndex`; acquire or create a unique account, log in once, save `.auth/<index>.json`, reuse within the worker. Tests in the same worker then share an account safely because they run serially; different workers never collide.

## API login instead of UI login

When the API issues tokens, skip the browser for setup: `request.post('/api/auth/login')`, then either set cookies on the context (`context.addCookies`) or write the token into storage once:

```ts
await page.goto('/');                                   // establish origin first
await page.evaluate(([k, v]) => localStorage.setItem(k, v), ['token', token] as const);
await page.goto('/dashboard');
```

Do this as a one-time write, not `addInitScript`: an init script re-injects on every navigation and silently undoes the logout you may be testing.

## Keep one real UI login test

It covers the form, redirects and error states; everything else uses stored state. Also test the auth guard (unauthenticated visit redirects to login) and logout clears state.

## Restoring shared state

If a UI test toggles a shared setting (consent, theme, language), restore it through the API in the same test or in fixture teardown; never leave the next test to discover it.

## Feature flags and A/B variants

Pin them before any page script runs: `page.addInitScript(v => localStorage.setItem('experiments', v), value)` or set a cookie/header the app honours. Do not guess the value format; get it from the owners, and keep an unpinned run so you test what real users get.

## Secrets

Credentials from env via the typed config; `.env.example` documents each; CI reads Secrets; `.auth/*.json` files are build artefacts, not source.
