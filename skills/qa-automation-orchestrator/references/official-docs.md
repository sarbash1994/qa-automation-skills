# Documentation protocol for the orchestrator

This skill produces strategy and plan documents, not configuration. Still, any tool-specific statement that enters those documents (an option name, a default, a CI action input, a capability key, a CLI flag) must be confirmed against the tool's official documentation for the version the project will use, and the plan must name the pages each task has to read.

- Use the layer skills' maps: `qa-automation-architect/references/official-docs.md` (runners, reporting, CI, providers), `qa-api-tests/references/official-docs.md`, `qa-ui-e2e-tests/references/official-docs.md`, `qa-mobile-tests/references/official-docs.md`.
- Lookup order: a documentation MCP (e.g. Context7 `resolve-library-id` → `query-docs`) when available; otherwise the official URL from those maps via the web fetch tool; for GitHub Actions the action README plus the GitHub Docs feature page.
- In the strategy, write tool facts as findings with the page named ("Playwright `use.video` accepts `on | off | retain-on-failure | on-first-retry` (Test use options page)"). If a page could not be reached, say so and mark the fact unverified.
- In the plan, every task has a "Docs to read first" line; an implementer must not start a task's tool-specific steps before reading them.
