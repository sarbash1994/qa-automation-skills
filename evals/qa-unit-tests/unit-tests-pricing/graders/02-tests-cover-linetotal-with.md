---
type: llm
focus: trace
weight: 1
---

Tests cover: lineTotal with a per-unit fee for pcs (fee multiplied by qty), that fee is ignored for kg/m, an invalid quantity step throws, made-to-order above MTO_MAX throws, applyDiscount rejects percent outside 0-100, formatQty renders a comma decimal for kg/m and 'pcs' for pieces.
