---
type: llm
focus: trace
weight: 1
---

The audit identifies cross-test state interference: cart.spec.ts and checkout.spec.ts mutate the same account's cart under fullyParallel, and the proposed fix actually removes the race (per-worker account or serial project), not just clearCart() in beforeEach.
