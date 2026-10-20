# Recipe: API tests with Jest (or Vitest) + Axios

> Snippets show the shape of a good setup, not a copy-paste source of truth. Option names and defaults drift between releases: confirm each one against the official page listed in `official-docs.md` for the version installed in the project before using it, and cite that page.

Use when the team runs Jest/Vitest already or the brief names Jest, Axios, Lodash, Faker, AJV. The layering is identical to the Playwright recipe; only the wiring differs.

## Layout

```
config/index.js|ts        dotenv + validated config
src/core/HttpClient       axios instance per base URL, validateStatus: () => true
src/core/SchemaRegistry   AJV over schemas/**/*.yaml|json
src/core/logger           failure-only logging behind LOG_HTTP
src/clients/<Service>Client
src/data/<entity>Builder  faker + lodash merge/omit/pick
tests/support/api         createApi(): wires everything once
tests/<resource>.test.ts
```

## HttpClient

```ts
export class HttpClient {
  private readonly axios: AxiosInstance;
  constructor({ baseURL, timeout, logger }: { baseURL: string; timeout: number; logger?: Logger }) {
    this.axios = axios.create({ baseURL, timeout, headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, validateStatus: () => true });
    this.logger = logger;
  }
  async request<T = unknown>(cfg: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const res = await this.axios.request<T>(cfg);
    if (res.status >= 400) this.logger?.warn(`${(cfg.method ?? 'get').toUpperCase()} ${cfg.url} -> ${res.status}`, { request: cfg.data, response: res.data });
    return { status: res.status, data: res.data, headers: res.headers as Record<string, string> };
  }
  get<T>(url: string, cfg: AxiosRequestConfig = {}) { return this.request<T>({ ...cfg, method: 'get', url }); }
  post<T>(url: string, data?: unknown, cfg: AxiosRequestConfig = {}) { return this.request<T>({ ...cfg, method: 'post', url, data }); }
  put<T>(url: string, data?: unknown, cfg: AxiosRequestConfig = {}) { return this.request<T>({ ...cfg, method: 'put', url, data }); }
  patch<T>(url: string, data?: unknown, cfg: AxiosRequestConfig = {}) { return this.request<T>({ ...cfg, method: 'patch', url, data }); }
  delete<T>(url: string, cfg: AxiosRequestConfig = {}) { return this.request<T>({ ...cfg, method: 'delete', url }); }
}
```

Retry on 429: `axios-retry` with `retryCondition: (e) => e.response?.status === 429` does not fire when `validateStatus` accepts 429, so implement the loop in `request()` the same way as the Playwright wrapper (honour `retry-after`, cap, throw with policy name). Interceptors are the place for auth headers (`Authorization: Bearer`) and correlation ids.

## Clients

```ts
export class UsersClient {
  constructor(private readonly http: HttpClient) {}
  login(body: Partial<Credentials>) { return this.http.post<LoginSuccess | AuthError>('/auth/login', body); }
  getUsers(params: { limit?: number | string; skip?: number } = {}) { return this.http.get<UsersList>('/users', { params }); }
}
```

## Wiring once

```ts
export function createApi() {
  const logger = createLogger(config.logHttp);
  return {
    posts: new PostsClient(new HttpClient({ baseURL: config.baseUrlPosts, timeout: config.httpTimeout, logger })),
    users: new UsersClient(new HttpClient({ baseURL: config.baseUrlUsers, timeout: config.httpTimeout, logger })),
    schemas: new SchemaRegistry(),
  };
}
```

Each suite: `let api; beforeAll(() => { api = createApi(); });`. No module-level singletons shared across suites.

## Spec shape

```ts
describe('POST /auth/login', () => {
  it('logs in with the demo user', async () => {
    const credentials = validCredentials();
    const res = await api.users.login(credentials);
    expect(res.status).toBe(200);
    expect(res.data.username).toBe(credentials.username);
    expect(res.data.accessToken.split('.')).toHaveLength(3);        // JWT shape
    expect(api.schemas.validate('LoginSuccess', res.data)).toEqual([]);
  });

  it('fails when password is missing', async () => {
    const res = await api.users.login(credentialsWithout('password'));
    expect(res.status).toBe(400);
    expect(res.data.message).toMatch(/username and password required/i);
    expect(api.schemas.validate('AuthError', res.data)).toEqual([]);
  });
});
```

## Jest specifics

- ESM: `"type": "module"`, run `node --experimental-vm-modules node_modules/jest/bin/jest.js`, `transform: {}`; or use `ts-jest`/`@swc/jest` with TypeScript. Vitest needs none of this.
- `testTimeout: 30_000` for network suites; `testEnvironment: 'node'`.
- Defects: `it.failing('register should reject malformed email', ...)` (Jest 29+); Vitest: `it.fails`.
- Parallelism is per file by default; keep files independent and data unique.
- Reporters: `jest-junit` for CI dashboards, `allure-jest` for Allure.
- Seed faker (`faker.seed(Number(process.env.FAKER_SEED) || undefined)`) when reproducibility matters; print the seed on failure.

## What not to do

- `try { await api.login(bad) } catch (e) { expect(e.response.status).toBe(400) }` passes on an unexpected 200.
- Asserting on stub behaviour that does not exist (a public echo stub has no "validation" to test).
- A `services/` layer that forwards to clients without state.
