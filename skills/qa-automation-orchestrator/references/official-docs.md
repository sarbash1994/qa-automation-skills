# Documentation protocol for the orchestrator

This skill produces strategy and plan documents, not configuration. Tool-specific statements in them (an option name, a default, a CI action input, a capability key, a CLI flag) follow the layer skills' section 0: state what you are sure of for the version the project will use, check what you are not sure of, and mark the rest unverified.

- Triggers and "Check first" lists live in the layer skills' maps: `qa-automation-architect/references/official-docs.md` (runners, reporting, CI, providers), `qa-unit-tests/references/official-docs.md`, `qa-api-tests/references/official-docs.md`, `qa-ui-e2e-tests/references/official-docs.md`, `qa-mobile-tests/references/official-docs.md`.
- Lookup order when you do check: a documentation MCP (e.g. Context7 `resolve-library-id` → `query-docs`) when available; otherwise the official URL from those maps; for GitHub Actions the action README or releases page plus the GitHub Docs feature page.
- In the strategy, write a checked tool fact as a finding with the page named ("Playwright `use.video` accepts `on | off | retain-on-failure | on-first-retry` (Test use options page)"). Mark facts you could not check as unverified.
- In the plan, add a "Docs to check first" line only to tasks that touch version-sensitive settings.
