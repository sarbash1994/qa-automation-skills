# Test doubles and mocking strategy

> Confirm `vi.mock`/`jest.mock` hoisting rules, fake timer APIs and msw handler syntax against the official pages in `official-docs.md` for the installed versions.

## Decision table

| Dependency | Preferred double | Why |
|---|---|---|
| HTTP APIs | msw request handlers | tests the real client code; handlers readable as contracts |
| Database / ORM | in-memory fake or a real local DB in integration tests | call-count mocks of Prisma hide schema mistakes |
| Clock, timers | `vi.useFakeTimers()` / `jest.useFakeTimers()`, `setSystemTime` | deterministic time; restore in `afterEach` |
| Randomness, ids | injected `random()`/`uuid()` or seeded generators | reproducible values |
| Env config | setup file sets `process.env` before imports | no real `.env` in tests |
| Third-party SDK (payments, email, push) | module mock with a shared factory, or a fake adapter behind your own interface | one place to change when the SDK changes |
| File system | `memfs` or temp directories | no shared state across tests |
| Own modules | real | mocking your own code tests the mock |

## Seams

When a function is hard to test, add a seam instead of a mock: pass dependencies as parameters or constructor arguments (`createService({ http, clock })`), split pure decision logic from I/O, and keep side effects at the edge. The test then calls the pure part with values and the I/O part with fakes.

## Module mocks

```ts
vi.mock('../services/email', () => ({ sendVerificationEmail: vi.fn().mockResolvedValue({ sent: true }) }));
import { sendVerificationEmail } from '../services/email';
```

- Hoisted above imports; the factory cannot use variables declared later unless via `vi.hoisted` (Vitest) or `jest.doMock` ordering (Jest).
- Partial mocks: `vi.importActual` / `jest.requireActual` to keep constants and pure helpers real.
- One shared factory per infrastructure module (`test/mocks/prisma.ts`) rather than ten inline `jest.mock` lines per file.
- Reset between tests (`restoreMocks`, `clearMocks`) so call history and implementations do not leak.

## Assertions on doubles

Assert outcomes first (returned value, rendered text, state change); assert calls only when the call *is* the behaviour (an email was sent with this recipient, an audit row with this action). Avoid `toHaveBeenCalledTimes(1)` as a substitute for checking the result.

## Time

```ts
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-03-01T10:00:00Z')); });
afterEach(() => vi.useRealTimers());
it('expires after 15 minutes', async () => {
  const session = createSession();
  vi.advanceTimersByTime(15 * 60_000);
  expect(session.isExpired()).toBe(true);
});
```

Prefer injecting a `now()` function into domain code; fake timers are for code you cannot change.

## Network with msw

```ts
// test/msw-server.ts
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
export const handlers = [http.get('/api/profile', () => HttpResponse.json({ user: { id: 'u1', name: 'QA' } }))];
export const server = setupServer(...handlers);
```

`onUnhandledRequest: 'error'` so an unexpected call fails the test; override per test with `server.use(...)`; keep handlers close to the contract (same shapes as the API tests' schemas).

## Smells

Mocking the module under test; mocking to reach a private function; a mock whose return value is copied from production output; tests that pass with the implementation deleted (run mutation testing to find them).
