---
type: llm
focus: trace
weight: 1
---

Expected values are literals (e.g. toBe(36)) rather than computed in the test from price*qty; no if/else, loops (outside it.each tables), try/catch or function declarations in the spec file.
