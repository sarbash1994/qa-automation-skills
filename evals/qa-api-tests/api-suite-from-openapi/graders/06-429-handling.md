---
type: llm
focus: trace
weight: 1
---

Every client call goes through a wrapper that retries HTTP 429 honouring Retry-After/RateLimit-Reset with a bounded cap and throws a clear error above it.
