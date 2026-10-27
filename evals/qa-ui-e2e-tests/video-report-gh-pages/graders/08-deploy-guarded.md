---
type: llm
focus: trace
weight: 1
---

The deploy is guarded on a report actually existing (for example a job output from a file check or the upload step, or a hashFiles condition), so a run that produced no report skips the deploy instead of failing it.
