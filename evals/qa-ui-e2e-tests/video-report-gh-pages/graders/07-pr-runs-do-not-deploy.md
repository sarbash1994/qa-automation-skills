---
type: llm
focus: trace
weight: 1
---

Only main publishes: a push to main deploys, and no other event or branch can (a manual dispatch from another branch or a pull-request run, if the workflow has those triggers, never deploys).
