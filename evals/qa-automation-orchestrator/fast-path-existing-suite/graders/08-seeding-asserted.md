---
type: llm
focus: trace
weight: 1
---

Every API call that seeds state for the new tests asserts success (for example await expect(res).toBeOK() or a status check in the fixture), so a failed seed fails at setup instead of surfacing as a confusing UI failure.
