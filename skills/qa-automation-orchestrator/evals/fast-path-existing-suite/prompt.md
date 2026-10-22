---
tags: [qa-automation-orchestrator]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash, WebFetch]
---

Add an e2e test for the coupon flow in the cart: applying WELCOME10 shows a 10% lower order total, and an unknown code shows the 'Coupon not found' error. The project is in the current directory (shop-web).

Input files: the project in the current directory (fixture `shop-web`).
