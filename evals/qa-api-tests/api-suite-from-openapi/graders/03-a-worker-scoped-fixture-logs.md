---
type: llm
focus: trace
weight: 1
---

Login happens at most once per worker or once per run (a worker-scoped fixture, or a setup project with a cached token or storage state) for every account the suite uses, the optional second account included, never per test outside the login-endpoint tests, and the answer ties this to the /api/auth/login rate limit.
