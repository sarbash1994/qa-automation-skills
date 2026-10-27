# Test doubles and mocking strategy

> When unsure of `vi.mock`/`jest.mock` hoisting rules, fake timer APIs and msw handler syntax in the installed version, check the installed types or the pages in `official-docs.md`.

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
import { http, HttpResponse } from 'msw/http';   // msw 3 entrypoint; msw 2 imports these from 'msw'
export const API = 'http://api.test';                 // the base URL the code under test is given in tests
export const handlers = [http.get(`${API}/api/profile`, () => HttpResponse.json({ user: { id: 'u1', name: 'QA' } }))];
export const server = setupServer(...handlers);
```

Relative URLs need a document. In the Node environment there is no `location`, so code that calls `fetch('/api/profile')` throws before msw sees the request, and relative handler paths have nothing to resolve against. Prefer making the base URL injectable and using absolute URLs in tests, as above. When the code cannot change yet, run that test file under `jsdom` or `happy-dom` (for Vitest, a `// @vitest-environment jsdom` comment at the top), where msw resolves relative paths against `location`, and suggest the injectable base URL as a follow-up. Component tests with Testing Library already run under a DOM environment, so relative paths work there.

Start the server in strict mode so an unexpected call fails the test instead of silently hitting the real network. The option name depends on the installed major:

| msw | Strict option | Default |
|---|---|---|
| 3.x | `server.listen({ onUnhandledFrame: 'error' })` (covers HTTP requests and WebSocket connections) | `'warn'`: the request goes out to the real network with a console warning |
| 2.x and 1.x | `server.listen({ onUnhandledRequest: 'error' })` | `'warn'` |

msw 3 ignores `onUnhandledRequest` without an error at runtime, so a setup copied from msw 2 quietly falls back to `'warn'`. A type-checked TypeScript setup file reports the unknown property; a JavaScript one or one excluded from `tsc` does not. The custom-callback form changed too: msw 3 passes one `{ frame, defaults }` object instead of `(request, print)`. Read the 2.x → 3.x migration guide in `official-docs.md` before upgrading.

Pin strict mode with one guard test so a rename or a misconfigured setup fails loudly. Assert that msw itself rejected the request: a bare `rejects.toThrow()` also passes when the request leaks to the network and fails on DNS. The rejection shape differs by major, so use the form for the installed one:

```ts
// test/msw-guard.test.ts (msw 3: fetch rejects with TypeError, msw's error is the cause)
it('rejects a request that has no handler', async () => {
  await expect(fetch('http://unhandled.test/canary')).rejects.toMatchObject({
    cause: { message: expect.stringContaining('[MSW]') },
  });
});

// msw 2: msw's error is the rejection itself
it('rejects a request that has no handler', async () => {
  await expect(fetch('http://unhandled.test/canary')).rejects.toThrow('[MSW]');
});
```

Override handlers per test with `server.use(...)`; keep handlers close to the contract (same shapes as the API tests' schemas).

## Smells

Mocking the module under test; mocking to reach a private function; a mock whose return value is copied from production output; tests that pass with the implementation deleted (run mutation testing to find them).
