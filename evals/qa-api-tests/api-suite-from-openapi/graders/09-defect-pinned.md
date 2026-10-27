---
type: llm
focus: trace
weight: 1
---

Every contract defect the answer reports (behaviour that contradicts openapi.yaml or the API's documented rules, for example page=abc yielding pagination.page null, PATCH accepting an empty title or completed: "false") is pinned by a test.fail test with a reason. Gaps in openapi.yaml itself and observations about design (such as the limiter being global) may stay in prose.
