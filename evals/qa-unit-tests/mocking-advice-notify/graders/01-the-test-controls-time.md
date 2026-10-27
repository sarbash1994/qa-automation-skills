---
type: llm
focus: trace
weight: 1
---

The test controls time with vi.useFakeTimers()/vi.setSystemTime (or an injected clock) and restores real timers afterwards, rather than relying on the real Date.now().
