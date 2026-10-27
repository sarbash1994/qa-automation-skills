---
type: llm
focus: trace
weight: 1
---

HTTP is intercepted at the network boundary (msw handlers or a fetch stub) and the test asserts on the returned 'sent'/'skipped' outcome, not merely on fetch having been called.
