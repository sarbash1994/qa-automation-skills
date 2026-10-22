---
tags: [qa-api-tests]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash, WebFetch]
---

Our Playwright API tests against this Todo API fail with 429 on /api/auth/login once the suite grows past ~40 tests, because each test logs in. Fix the approach.

Input files: the project in the current directory (fixture `todo-api`).
