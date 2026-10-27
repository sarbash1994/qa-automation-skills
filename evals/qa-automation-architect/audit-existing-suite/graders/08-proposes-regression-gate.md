---
type: llm
focus: trace
weight: 1
---

A regression gate is proposed with concrete lint rules that catch the identified smells (for example eslint-plugin-playwright no-wait-for-timeout, no-conditional-in-test, no-raw-locators, or equivalent no-restricted-syntax rules) and a CI job that runs it on pull requests. A tsconfig or type check alone does not pass.
