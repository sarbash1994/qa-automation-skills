---
tags: [qa-ui-e2e-tests]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash, WebFetch]
---

tests/e2e/checkout.spec.ts is flaky and nobody wants to touch it. Rewrite it properly following this project's conventions.

Input files: the project in the current directory (fixture `shop-web`).
