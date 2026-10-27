# Negative and edge-case matrix

Use as a checklist per endpoint. Assert the exact status and message where documented; where the server is inconsistent, assert `>= 400`, add a `test.fail` for the correct behaviour and record the finding.

## Write endpoints (POST/PUT/PATCH)

| Case | Input | Expect |
|---|---|---|
| Missing required field | `omit(valid, 'field')` | 400, message names the field |
| Empty string | `{ field: '' }` | 400 |
| Whitespace only | `{ field: '   ' }` | 400 (trimmed before validation) |
| Over-long | `'x'.repeat(max + 1)` | 400 "too long" |
| Wrong type | `{ count: 'abc' }` | 400; or document echo behaviour for stubs |
| Invalid enum | `{ gender: '9' }` | 400 "must be one of" |
| Unknown field | `{ ...valid, foo: 'bar' }` | ignored or 400, as documented; never 500 |
| Malformed id in path | `/todos/not-an-id` | 400 "Invalid id" |
| Well-formed, missing id | `/todos/0123456789abcdef01234567` | 404 "not found" |
| Partial update semantics | PUT with one field | replace vs patch, as documented |
| Id in body vs URL | body `{ id: 99 }` to `/posts/1` | URL wins; body id ignored |
| Duplicate create | same unique key twice | 409 (or documented 400) |
| Idempotency key reuse | same `Idempotency-Key` | same resource, 200/201 identical body |
| Concurrent create | `Promise.all` of 5 creates | no duplicates, no 500 |
| Large payload | > limit | 413 |
| Wrong content type | `text/plain` body | 415 or 400 |

## Auth and access

| Case | Expect |
|---|---|
| No credentials | 401 |
| Each scheme missing separately when two are required | 401 for each; 200 only with both |
| Invalid/expired/tampered token | 401 |
| Valid token, wrong role | 403 |
| Other tenant's resource id | 404 or 403 (document which; never leak existence) |
| Logout then reuse token | 401 if sessions are server-side; document "stateless, still valid" as a finding otherwise |
| Rate limit exceeded | 429 with `Retry-After` |

## Read endpoints

| Case | Expect |
|---|---|
| Default page | documented default `limit`, `total` present |
| `limit` applied | exactly `limit` items when enough exist |
| `offset`/`skip`/`page` | first item differs from page 1; last page shorter; beyond last page empty, 200 |
| Invalid `limit` (`abc`, `0`, `-1`, `10000`) | 400 or clamped, as documented |
| Filter | only matching items; combination of filters is AND unless documented |
| Search no match | 200 with empty list |
| Sort | stable order; ties broken deterministically |
| Isolation | user A never sees user B's items |

## Async side effects

| Case | Technique |
|---|---|
| Event recorded after action | baseline count, `waitForCount(filter, before + 1)` |
| Event NOT recorded (consent off, feature flag) | bounded poll asserting count stays at baseline, then positive control |
| Email sent | mail sink API (Mailpit) polled by recipient |
| Webhook delivered | capture endpoint; assert signature header and payload schema |
| Eventual consistency in search | poll search until the item appears, bounded |

## Contract

| Case | Expect |
|---|---|
| Success body | matches schema; required fields present; types right |
| Error body | matches error schema; message non-empty; no stack traces |
| Type consistency across endpoints | same field same type (record findings) |
| Dates | ISO 8601, parseable |
| Headers | `Content-Type: application/json`, pagination/rate-limit headers present where documented |
