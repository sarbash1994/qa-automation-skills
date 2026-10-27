---
type: llm
focus: trace
weight: 1
---

Any change to shared code that other specs use (ShopApi, fixtures, BasePage, CartPage, package.json) is listed in final-answer.md with its effect on cart.spec.ts (one line such as "additive, cart.spec.ts unaffected" is enough for a purely additive change), and cart.spec.ts still compiles and lists.
