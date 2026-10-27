---
type: llm
focus: trace
weight: 1
---

No test asserts an exported constant against a copy of itself (e.g. expect(STEP).toEqual({...}) or expect(MTO_MAX).toBe(50)); constants are exercised through the behaviour that depends on them.
