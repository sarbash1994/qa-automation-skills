---
tags: [qa-unit-tests]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash, WebFetch]
---

How should I unit test src/notify.ts (notifyUser)? It calls fetch twice and uses Date.now(). Write the test.

Input files: the project in the current directory (fixture `pricing-lib`).
