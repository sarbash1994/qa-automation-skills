---
type: llm
focus: trace
weight: 1
---

A worker-scoped fixture logs in once per worker (shared user) explicitly because of the /api/auth/login rate limit; tests do not log in per test.
