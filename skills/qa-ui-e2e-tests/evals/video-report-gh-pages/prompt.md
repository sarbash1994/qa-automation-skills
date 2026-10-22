---
tags: [qa-ui-e2e-tests]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash, WebFetch]
---

Configure Playwright in this project so that every failed test keeps a video, the HTML report includes it, and the report is published to GitHub Pages from GitHub Actions on every push to main.

Input files: the project in the current directory (fixture `shop-web`).
