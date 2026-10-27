---
type: llm
focus: trace
weight: 1
---

The run's output (final-answer.md, or notes kept for the later play-back in run-log.md) identifies the /api/auth/login rate limit as a constraint that will shape the test design, and every fact it states about the limiter matches src/server.js (40 calls per 15 minutes, counted server-wide, failed attempts included, the 41st call answered with 429).
