# Recipe: in-process route tests with Jest/Vitest + supertest

> Snippets show the shape of a good setup, not a copy-paste source of truth. Option names and defaults drift between releases: confirm each one against the official page listed in `official-docs.md` for the version installed in the project before using it, and cite that page.

Use when the API is code you own (Express, Fastify, Koa, Next.js route handlers, NestJS). The test imports the app, mocks infrastructure at the boundary, and drives HTTP through supertest without a port. These are integration tests of your wiring (routing, middleware, validation, serialization), not unit tests of handlers and not end-to-end tests of a deployment.

## Setup

```js
// jest.config.js
module.exports = {
  preset: 'ts-jest', testEnvironment: 'node', roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'], clearMocks: true, testTimeout: 15_000,
  setupFiles: ['<rootDir>/src/__tests__/setup/env.ts'],        // env BEFORE any module loads
  moduleNameMapper: { '^uuid$': '<rootDir>/__mocks__/uuid.js' },  // ESM-only deps
  transform: { '^.+\\.ts$': ['ts-jest', { isolatedModules: true }] },  // speed; typecheck runs in `tsc --noEmit`
};
```

```ts
// src/__tests__/setup/env.ts  (runs before imports)
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-min-32-chars-long!!';
process.env.DATABASE_URL = 'postgres://test';   // never a real DSN; tests must not reach a real DB
```

## Mock at the boundary, once

Prefer a single shared factory (`__tests__/helpers/prismaMock.ts`, `createSupabaseMock()`) over ten `jest.mock` lines per file. Infrastructure that must never run in tests: rate limiters (replace with pass-through middleware), cron/schedulers, OAuth strategies, email/push/SMS senders, external HTTP (use `nock`/`msw` or mock the client module), real DB clients. Manual mocks in `__mocks__/` can keep real constants (`AuditAction`) while mocking only the writer so assertions compare real values.

```ts
jest.mock('express-rate-limit', () => jest.fn(() => (_req, _res, next) => next()));
jest.mock('../db/prisma', () => ({ prisma: createPrismaMock() }));
jest.mock('../services/email');          // manual mock in services/__mocks__/email.ts

import request from 'supertest';
import { app } from '../app';            // app must be exported separately from listen()
import { authHeader, adminAuthHeader } from './helpers/auth';   // signs real JWTs with the test secret
```

## Spec shape

```ts
describe('POST /api/auth/login', () => {
  it('returns 200 with tokens for valid credentials', async () => {
    prismaMock.user.findUnique.mockResolvedValue(userRow({ passwordHash: await bcrypt.hash('secret', 4) }));
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.c', password: 'secret' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ accessToken: expect.any(String), refreshToken: expect.any(String) });
    expect(logAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ action: AuditAction.LOGIN }));
  });

  it('returns 401 and no tokens for a wrong password', async () => {
    prismaMock.user.findUnique.mockResolvedValue(userRow());
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.c', password: 'nope' });
    expect(res.status).toBe(401);
    expect(res.body).not.toHaveProperty('accessToken');
  });

  it('rejects an unauthenticated profile read', async () => {
    const res = await request(app).get('/api/profile');
    expect(res.status).toBe(401);
  });

  it('scopes reads to the caller', async () => {
    await request(app).get('/api/todos').set(authHeader(TEST_USER)).expect(200);
    expect(prismaMock.todo.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: TEST_USER.id }) }));
  });
});
```

## Next.js route handlers

Call the exported `GET`/`POST` with a `new Request(url, { method, headers, body })` (wrap in a `mockJsonRequest()` helper) and assert on the `Response`; set `/** @jest-environment node */` at the top of the file when the default environment is jsdom.

## When to add a real database

Validation, ordering, pagination boundaries and RLS/authorization rules belong in tests against a real local database (Docker Postgres, Supabase local, Testcontainers), gated by an env flag so they are opt-in locally and mandatory in a dedicated CI job. Seed with factories, isolate by schema/transaction per test, and assert boundaries (1001 rows when the page size is 1000).

## Pitfalls

- Importing `app` that calls `listen()` at import time: split `app.ts` from `server.ts`.
- `clearMocks` resets call history but not `mockResolvedValue` implementations set at module level; set per test in `beforeEach`.
- Mocked Prisma hides schema mistakes: pair with a nightly real-DB job.
- Coverage thresholds copied from current numbers protect nothing; set floors you mean.
