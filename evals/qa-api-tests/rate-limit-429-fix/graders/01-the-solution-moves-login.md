---
type: llm
focus: trace
weight: 1
---

Login happens at most once per worker or once per run (a worker-scoped fixture, or a setup project with a cached token or storage state), and ordinary tests never call login; only tests of the login endpoint itself spend the login budget.
