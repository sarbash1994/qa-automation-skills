---
type: llm
focus: trace
weight: 1
---

Every HTTP call made by the tests (not only login) is routed through the 429 retry wrapper, via a thin client or fixture.
