---
type: llm
focus: trace
weight: 1
---

It identifies at least five of these smells in tests/e2e/checkout.spec.ts: waitForTimeout sleeps, CSS/#id selectors, UI login in beforeEach despite storage state, try/catch around a click, helper functions and loops/if inside the spec, hardcoded localhost URL, positional 'nth' selector, computed expected value.
