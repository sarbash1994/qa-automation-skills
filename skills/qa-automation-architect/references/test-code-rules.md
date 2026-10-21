# Test code rules

Rules for the code inside spec files, shared by every layer (unit, API, UI, mobile). They exist for one reason: when a test fails, its title should say what broke, and a reader should understand the test top to bottom without leaving the file. Enforce the mechanical ones with lint (section 11); treat the size budgets as guidance.

## 1. No logic in a spec file

No `if`/`else`, `switch`, ternaries, loops, `try`/`catch` or computed expectations inside a test.

- A branch means two tests: write both.
- A loop over inputs is a parameterised table: `test.each` / `it.each` with the cases listed as data.
- `try`/`catch` around a call that may fail is `await expect(promise).rejects.toThrow(...)`, or a non-throwing client plus a status assertion.
- A computed expected value (`price * qty + fee`) hides the rule; write the literal the specification gives (`36`).

Why: a conditional test can pass without exercising the path you meant, and the title no longer describes one behaviour.

## 2. No function or class declarations in a spec file

A spec file contains imports, data constants, `describe`/`test` blocks and short hooks. Anything reusable lives below the tests: fixtures (state, auth, pages), builders (data), clients and page objects (actions), `test/support` (matchers, polling helpers).

- `beforeEach`/`beforeAll` longer than about five lines is a fixture waiting to be extracted.
- Inline helpers named after a scenario (`setupUserWithThreeTodos`) are the first sign the suite is about to stop being readable; replace with a fixture whose name says what the test receives (`userWithTodos`).

## 3. Readable top to bottom

Inside a test, the reader sees what was called and what was checked. Helper names say what they give (`registeredUser`, `buildOrder`), not which step they perform (`doStep3`). Nothing in a test requires opening another file to understand the intent; the other file explains the mechanism.

## 4. Expected values are literals from the specification

Not derived in the test, not copied from the implementation's output. When a value must be computed (dates relative to now, totals), compute it in a builder or fixture with a name that states the rule, and keep the assertion literal where possible.

## 5. One behaviour per test, one reason to fail

Several assertions about the same result are fine (status, a field, the schema of one response). Two actions with assertions between them are usually two tests: the first failure hides the second, and the title stops describing what failed.

Explicit exceptions, allowed when named as such:
- **Parameterised tables** (`test.each`) where each row is one behaviour of the same rule.
- **Lifecycle tests** whose title says so ("todo lifecycle: create → complete → delete") and where the sequence itself is the behaviour under test (an audit trail, an event stream, a state machine). They complement the per-behaviour tests; they do not replace them.

## 6. No hidden coupling between tests

No reliance on execution order, shared mutable state or data left by a previous test. Any test runs alone (`-g "title"`) and in any order. Shared worker fixtures are read-only from the test's point of view; anything a test mutates it restores (through the API) or owns outright.

## 7. No smart assertion helpers

`assertValidResponse(res)` with ten conditions inside hides what is checked and produces a useless failure message. Either explicit `expect` calls in the test, or a custom matcher with a single responsibility and a message that names the expected and received values.

## 8. No noise

No commented-out code, no `.only`, no `skip` without a reason and a ticket, no `console.log`, no magic numbers without the reason next to them, no TODOs that nobody owns. Known defects are `test.fail`/`it.failing` with a reason, never a skip.

## 9. Size budgets (guidance, not lint)

A test body of about 20 lines and a file of about 300 lines are the point where readability starts to drop. Past them, split by resource, journey or rule rather than adding `describe` nesting. Keep `describe` depth at two.

## 10. Comments say why

A comment records the live observation or the specification clause behind a non-obvious decision and warns what not to relax. It never restates the code.

## 11. Enforce with lint

Add the test plugin for the runner and turn these on as errors; the rest of the rules above are reviewed by people.

| Runner | Plugin | Rules |
|---|---|---|
| Jest | `eslint-plugin-jest` | `no-conditional-in-test`, `no-conditional-expect`, `expect-expect`, `no-standalone-expect`, `no-focused-tests`, `no-disabled-tests`, `no-identical-title`, `max-nested-describe` (2), `prefer-hooks-in-order`, `no-done-callback` |
| Vitest | `eslint-plugin-vitest` | the same rule names |
| Playwright | `eslint-plugin-playwright` | `no-conditional-in-test`, `no-conditional-expect`, `expect-expect`, `no-standalone-expect`, `no-focused-test`, `no-skipped-test`, `no-wait-for-timeout`, `no-nth-methods`, `no-element-handle`, `missing-playwright-await`, `max-nested-describe` (2) |
| WebdriverIO (Mocha) | `eslint-plugin-mocha` + `eslint-plugin-wdio` | `no-exclusive-tests`, `no-skipped-tests`, `no-identical-title`, `max-top-level-suites` |
| Any | core ESLint, scoped to spec files | `no-restricted-syntax` for `IfStatement`, `ConditionalExpression`, `ForStatement`, `ForOfStatement`, `WhileStatement`, `TryStatement`, `FunctionDeclaration`, `ClassDeclaration` with a message pointing to this file |

Confirm rule names against the plugin's current documentation (see `official-docs.md`) before adding them; rule sets change between majors.

Example scoped override:

```js
// eslint.config.js (flat config)
{
  files: ['**/*.{spec,test}.{ts,tsx,js}'],
  rules: {
    'no-restricted-syntax': ['error',
      { selector: 'IfStatement', message: 'No branching in tests: write two tests (test-code-rules.md §1).' },
      { selector: 'ConditionalExpression', message: 'No ternaries in tests (test-code-rules.md §1).' },
      { selector: 'ForStatement, ForOfStatement, ForInStatement, WhileStatement', message: 'Use test.each instead of loops (test-code-rules.md §1).' },
      { selector: 'TryStatement', message: 'Assert with rejects.toThrow or a status check (test-code-rules.md §1).' },
      { selector: 'FunctionDeclaration, ClassDeclaration', message: 'Move helpers to fixtures/builders/support (test-code-rules.md §2).' },
    ],
  },
}
```

## Review one-liner

Logic-free spec: no branches, loops, try/catch or helper definitions in the file; literal expectations; one behaviour per test (tables and named lifecycle tests excepted); no coupling between tests; no noise.
