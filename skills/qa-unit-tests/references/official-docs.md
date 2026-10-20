# Official documentation map and lookup protocol

Option names, defaults, CLI flags and APIs change between releases. Before producing configuration, mocks, matchers or a "how do I" answer, read the relevant official page for the version in use and base the answer on it. Say which page you used. Never fill a gap from memory when a page exists.

## Lookup protocol

1. **Name the tool and the version.** Read `package.json` and the lockfile for installed versions. For a new project target the current stable release.
2. **Fetch the documentation.** Prefer a documentation MCP server when available (e.g. Context7: `resolve-library-id`, then `query-docs` with one topic per question, passing the version when docs are versioned). Otherwise fetch the official URL from the map below with the web fetch tool and follow the site's version switcher when an older major is pinned.
3. **Confirm, do not assume.** Check the exact option name, type, default and placement. The page wins over memory.
4. **Answer with the citation.** Name the page (title or URL). If it could not be reached, say so explicitly, mark the answer unverified and name the page the user should check.
5. **Re-check on failure.** An "unknown option" or an API that behaves differently means re-reading the page for the installed version before editing.

## Worked examples

- *"Add coverage thresholds to Vitest."* Read the Vitest coverage configuration page for the installed major (provider, `include`, `thresholds` shape) before editing `vitest.config.ts`.
- *"Mock a module partially in Jest 30."* Read `jest.mock` and `jest.requireActual` in the Jest API reference and the ESM page if the project uses ESM.
- *"Mock fetch in React component tests."* Read msw's Node integration page for the installed major (v1 `rest` vs v2 `http`/`HttpResponse`) and the Testing Library async queries page.

## Documentation map

| Topic | Where |
|---|---|
| Vitest config, API (`vi.mock`, timers), coverage, browser mode, CLI | https://vitest.dev/config/ , https://vitest.dev/api/ , https://vitest.dev/api/vi.html , https://vitest.dev/guide/coverage.html , https://vitest.dev/guide/browser/ , https://vitest.dev/guide/cli.html |
| Jest config, API (`test.failing`, `jest.mock`), timers, ESM, code transformation | https://jestjs.io/docs/configuration , https://jestjs.io/docs/api , https://jestjs.io/docs/jest-object , https://jestjs.io/docs/timer-mocks , https://jestjs.io/docs/ecmascript-modules , https://jestjs.io/docs/code-transformation |
| node:test runner and assert | https://nodejs.org/api/test.html , https://nodejs.org/api/assert.html |
| Testing Library: queries, priority, user-event, async, React, React Native | https://testing-library.com/docs/queries/about , https://testing-library.com/docs/user-event/intro , https://testing-library.com/docs/dom-testing-library/api-async , https://testing-library.com/docs/react-testing-library/intro , https://callstack.github.io/react-native-testing-library/docs/start/intro |
| jest-dom matchers | https://github.com/testing-library/jest-dom |
| msw (Node and React Native integration, handlers) | https://mswjs.io/docs/integrations/node , https://mswjs.io/docs/integrations/react-native , https://mswjs.io/docs/http/mocking-responses/ |
| fast-check | https://fast-check.dev/docs/introduction/ |
| Stryker mutation testing (JS/TS) | https://stryker-mutator.io/docs/stryker-js/introduction/ , https://stryker-mutator.io/docs/stryker-js/configuration/ |
| jest-expo and Expo unit testing | https://docs.expo.dev/develop/unit-testing/ |
| ESLint plugins for tests | https://github.com/vitest-dev/eslint-plugin-vitest , https://github.com/jest-community/eslint-plugin-jest |
| SWC/ts-jest transforms | https://swc.rs/docs/usage/jest , https://kulshekhar.github.io/ts-jest/docs/getting-started/installation |
| TypeScript `tsc` options for test files | https://www.typescriptlang.org/tsconfig/ |
