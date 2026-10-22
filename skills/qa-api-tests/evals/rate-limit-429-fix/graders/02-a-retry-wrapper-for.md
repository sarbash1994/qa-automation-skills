---
type: llm
focus: trace
weight: 1
---

A retry wrapper for HTTP 429 is provided that reads Retry-After (or RateLimit-Reset), caps the wait, and throws a clear error naming the policy when the wait exceeds the cap, rather than sleeping 15 minutes.
