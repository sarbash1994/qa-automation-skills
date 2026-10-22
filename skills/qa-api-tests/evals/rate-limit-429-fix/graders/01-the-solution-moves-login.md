---
type: llm
focus: trace
weight: 1
---

The solution moves login into a worker-scoped fixture (scope: 'worker') so each worker authenticates once and tests reuse the token, instead of logging in per test.
