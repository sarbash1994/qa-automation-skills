---
type: llm
focus: trace
weight: 1
---

Credentials are not hard-coded as defaults in source: when USER_EMAIL/USER_PASSWORD (or the suite's equivalents) are missing, the env module or setup fails fast with a message naming the variable. A default for the base URL is acceptable.
