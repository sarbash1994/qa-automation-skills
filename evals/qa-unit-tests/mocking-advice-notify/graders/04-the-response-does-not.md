---
type: llm
focus: trace
weight: 1
---

The response does not mock ./notify itself, and no test asserts call counts on fetch or on handlers (toHaveBeenCalledTimes, mock.calls length); comparing the full recorded request list by content (method, URL, body) is allowed even though it implies a count, and the outcome is checked by the returned value.
