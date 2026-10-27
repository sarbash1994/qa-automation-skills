---
type: llm
focus: trace
weight: 1
---

It identifies at least seven of these smells in tests/e2e/checkout.spec.ts, each tied to a quoted line or line number: waitForTimeout sleeps, CSS/#id selectors, UI login in beforeEach despite storage state, try/catch around a click, helper functions and loops/if inside the spec, hardcoded localhost URL, positional 'nth' selector, computed expected value; and it explains that the coupon branch makes the expected total wrong (12.50 expected while WELCOME10 gives 11.25).
