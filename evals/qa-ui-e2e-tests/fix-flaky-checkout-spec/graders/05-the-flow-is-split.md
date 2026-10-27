---
type: llm
focus: trace
weight: 1
---

The flow is split into at least two focused tests (e.g. coupon applied lowers the total; placing the order shows confirmation) with outcome-style titles, cart state is seeded through ShopApi rather than clicking product cards, and each outcome is asserted in the spec itself; page object methods act and expose locators but do not hide the business assertion.
