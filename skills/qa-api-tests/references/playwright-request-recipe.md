# Recipe: API tests with the Playwright test runner

> Snippets show the shape of a good setup, not a copy-paste source of truth. Option names and defaults drift between releases: confirm each one against the official page listed in `official-docs.md` for the version installed in the project before using it, and cite that page.

Why this runner for API tests: fixtures with worker/test scope, parallel workers, `test.fail`/`test.fixme` annotations, HTML/Allure/JUnit reporters shared with the E2E suite, `expect.poll`, and an `APIRequestContext` that can also be created from a browser context to share cookies.

## Layout

```
src/config/env.ts          typed env (zod or required()/optional())
src/api/http.ts            withRateLimitRetry()
src/api/ApiClient.ts       thin typed wrapper, methods 1:1 with endpoints
src/api/<Stream>Client.ts  e.g. AnalyticsClient with find/count/waitForCount
src/fixtures/test-fixtures.ts
src/utils/data.ts          builders + unique ids
src/utils/types.ts         domain types from real responses
schemas/<service>/*.yaml   contracts
tests/api/<resource>.spec.ts
```

## Config

```ts
// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,                       // isolate state; document any exception
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,          // none when runs have side effects
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['html', { open: 'never' }], ['list'],
    ['allure-playwright', { detail: true, resultsDir: 'allure-results', globalLabels: [{ name: 'layer', value: 'api' }] }],
    ...(process.env.CI ? [['github'] as const] : [])],
  use: { baseURL: ENV.baseURL, extraHTTPHeaders: { 'X-Api-Key': ENV.apiKey } },
  projects: [{ name: 'api', testDir: './tests/api' }],
});
```

## Env

```ts
import 'dotenv/config';
import { z } from 'zod';
const Env = z.object({
  BASE_URL: z.string().url().default('https://example.test'),
  API_KEY: z.string().min(1, 'Copy .env.example to .env and fill API_KEY (see README for where it is issued)'),
  ADMIN_EMAIL: z.string().email(), ADMIN_PASSWORD: z.string().min(1),
});
const parsed = Env.safeParse(process.env);
if (!parsed.success) throw new Error(`Invalid env:\n${parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n')}`);
export const ENV = { baseURL: parsed.data.BASE_URL, apiKey: parsed.data.API_KEY, adminEmail: parsed.data.ADMIN_EMAIL, adminPassword: parsed.data.ADMIN_PASSWORD } as const;
```

## Retry wrapper

```ts
const MAX_ATTEMPTS = 4, MAX_WAIT_SECONDS = 60;
function retryAfterSeconds(res: APIResponse) {
  const h = res.headers();
  const v = Number(h['retry-after'] ?? h['ratelimit-reset']);
  return Number.isFinite(v) && v > 0 ? v : 1;
}
export async function withRateLimitRetry(call: () => Promise<APIResponse>) {
  let res = await call();
  for (let attempt = 1; attempt <= MAX_ATTEMPTS && res.status() === 429; attempt++) {
    const wait = retryAfterSeconds(res);
    if (wait > MAX_WAIT_SECONDS) throw new Error(`Rate limit (policy ${res.headers()['ratelimit-policy'] ?? 'unknown'}): Retry-After ${wait}s exceeds the ${MAX_WAIT_SECONDS}s cap. Reduce auth calls or wait for the window.`);
    await new Promise(r => setTimeout(r, (wait + 0.5) * 1000));
    res = await call();
  }
  return res;
}
```

## Client

```ts
export class ApiClient {
  constructor(private readonly request: APIRequestContext, private readonly token?: string) {}
  withToken(token: string) { return new ApiClient(this.request, token); }
  private headers(extra?: Record<string, string>) {
    return { ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}), ...extra };
  }
  register(body: NewUser) { return withRateLimitRetry(() => this.request.post('/api/auth/register', { data: body })); }
  login(email: string, password: string) { return withRateLimitRetry(() => this.request.post('/api/auth/login', { data: { email, password } })); }
  getProfile() { return withRateLimitRetry(() => this.request.get('/api/profile', { headers: this.headers() })); }
  createTodo(title: string, tagIds?: string[]) {
    return withRateLimitRetry(() => this.request.post('/api/todos', { headers: this.headers(), data: { title, ...(tagIds?.length ? { tagIds } : {}) } }));
  }
  uploadPhoto(name: string, buffer: Buffer, mimeType = 'image/png') {
    return withRateLimitRetry(() => this.request.post('/api/profile/photo', { headers: this.headers(), multipart: { photo: { name, mimeType, buffer } } }));
  }
}
```

## Fixtures

```ts
interface WorkerFixtures { apiContext: APIRequestContext; adminApi: ApiClient; sharedUser: RegisteredUser }
interface TestFixtures { api: ApiClient; analytics: AnalyticsClient; registeredUser: RegisteredUser }

export const test = base.extend<TestFixtures, WorkerFixtures>({
  apiContext: [async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext({ baseURL: ENV.baseURL, extraHTTPHeaders: { 'X-Api-Key': ENV.apiKey } });
    await use(ctx); await ctx.dispose();
  }, { scope: 'worker' }],
  adminApi: [async ({ apiContext }, use) => {
    const client = new ApiClient(apiContext);
    const res = await client.login(ENV.adminEmail, ENV.adminPassword);
    expect(res.ok(), 'admin login should succeed').toBeTruthy();
    const { token, role } = await res.json();
    expect(role, 'admin account should have admin role').toBe('admin');
    await use(client.withToken(token));
  }, { scope: 'worker' }],
  sharedUser: [async ({ apiContext }, use) => { await use(await createUser(apiContext)); }, { scope: 'worker' }],
  api: async ({ request }, use) => use(new ApiClient(request)),
  analytics: async ({ request }, use) => use(new AnalyticsClient(request)),
  registeredUser: async ({ request }, use) => {
    const user = await createUser(request);
    await use(user);
    await user.api.deleteSelf().catch(() => {});   // cleanup when the API allows it
  },
});
```

`createUser` registers + logs in, asserts both steps with messages, returns `{ credentials, token, profile, api: anon.withToken(token) }`. Each call costs auth budget: the docstring should say so.

## Spec shape

```ts
test.describe('Todos API @api', () => {
  test('creates a todo (201) with sane defaults', async ({ sharedUser }) => {
    const res = await sharedUser.api.createTodo('Buy milk');
    expect(res.status()).toBe(201);
    const { todo } = await res.json() as { todo: Todo };
    expect(todo).toMatchObject({ title: 'Buy milk', completed: false });
    expect(schemas.validate('Todo', todo)).toEqual([]);
  });

  test('does not leak todos between users', async ({ sharedUser, registeredUser }) => {
    const secret = `secret-${uniqueSuffix()}`;
    await registeredUser.api.createTodo(secret);
    const titles = ((await (await sharedUser.api.getTodos({ status: 'all', limit: 100 })).json()).todos as Todo[]).map(t => t.title);
    expect(titles).not.toContain(secret);
  });
});
```

## Async side effects

```ts
const before = await analytics.count({ email, type: 'todoCreate' });
await sharedUser.api.createTodo('tracked');
const events = await analytics.waitForCount({ email, type: 'todoCreate' }, before + 1);   // polls, bounded
expect(events.at(-1)?.status).toBe('success');

// negative: must NOT be recorded while consent is off
await expect.poll(() => analytics.count({ email, type: 'todoCreate' }), { timeout: 3_000, intervals: [500] }).toBe(before);
```

## Access-control negatives need their own context

`newContext` inherits `use.extraHTTPHeaders`; to represent "no key" blank it explicitly: `extraHTTPHeaders: { 'X-Api-Key': '' }`, and dispose the context at the end.

## Browser + API in one test

`page.request` shares the page's cookies, so outcome verification after a UI flow can hit the API as the just-logged-in user without separate credentials.
