---
type: llm
focus: trace
weight: 1
---

Negative tests assert the status code and the exact error message text the API returns (taken from src/server.js; missing title 400 'Title is required', over-long title 400, malformed id 400 'Invalid todo id', well-formed missing id 404 'Todo not found', no token 401, invalid limit 400) without try/catch.
