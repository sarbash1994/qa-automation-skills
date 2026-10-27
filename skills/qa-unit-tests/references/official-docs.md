# Official documentation map and lookup protocol

Look up official documentation when it pays, not on every answer. The practices in these skills are stable; what drifts is option names, defaults, CLI flags, action versions and capability keys. Answer from what you know and from the project itself when you are sure, and look up the page when one of the triggers below holds.

## When to look up

- You are not certain that an option, value, flag, action input or capability key exists in the installed version, or where it goes.
- The installed major is newer than the one you know well, or the detail is listed under "Check first" below.
- Something failed or behaved unexpectedly: an "unknown option" error, a setting that seems ignored, output that contradicts what you expected.
- The user asks for sources.

Cheaper evidence counts and often settles the question: the installed package's TypeScript types or source in `node_modules`, a type-check of the file you wrote, `--help` output, or a working config already in the project.

## Check first

- msw majors: msw 3 renamed `onUnhandledRequest` to `onUnhandledFrame` (the old name is silently ignored), moved `http`/`HttpResponse` to `msw/http` and replaced `msw/native` with `@msw/react-native`.
- Jest 29 to 30 configuration changes; Vitest coverage options and `vi` APIs across majors.
- Stryker and fast-check configuration.

## Lookup protocol

1. **Name the tool and the version.** Read `package.json` and the lockfile; read `uses:` lines for CI actions. For a new project target the current stable release.
2. **Fetch the page.** Prefer a documentation MCP server when available (e.g. Context7: `resolve-library-id`, then `query-docs` with one topic, passing the version when docs are versioned). Otherwise fetch the official URL from the map below and follow the version switcher when an older major is pinned. For GitHub Actions read the action's README or releases page plus the GitHub Docs page for the feature.
3. **Confirm, do not assume.** Check the exact name, type, default and placement. The page wins over memory.
4. **Name it in the reply.** Put the page title or URL next to the claim it confirms, in the answer the user reads, not only in notes or logs. If you were unsure and could not check, mark the detail as unverified and name the page to check.

## Worked examples (lookups that pay off)

- *"Add coverage thresholds to Vitest."* Read the Vitest coverage configuration page for the installed major (provider, `include`, `thresholds` shape) before editing `vitest.config.ts`.
- *"Mock a module partially in Jest 30."* Read `jest.mock` and `jest.requireActual` in the Jest API reference and the ESM page if the project uses ESM.
- *"Mock fetch in React component tests."* Read msw's Node integration page and `server.listen()` options for the installed major (v1 `rest`; v2 `http`/`HttpResponse` from `msw` and `onUnhandledRequest`; v3 `msw/http` entrypoint and `onUnhandledFrame`) and the Testing Library async queries page. On an upgrade, read the msw migration guide first: msw 3 silently ignores the old `onUnhandledRequest` option.

## Documentation map

| Topic | Where |
|---|---|
| Vitest config, API (`vi.mock`, timers), coverage, browser mode, CLI | https://vitest.dev/config/ , https://vitest.dev/api/ , https://vitest.dev/api/vi.html , https://vitest.dev/guide/coverage.html , https://vitest.dev/guide/browser/ , https://vitest.dev/guide/cli.html |
| Jest config, API (`test.failing`, `jest.mock`), timers, ESM, code transformation | https://jestjs.io/docs/configuration , https://jestjs.io/docs/api , https://jestjs.io/docs/jest-object , https://jestjs.io/docs/timer-mocks , https://jestjs.io/docs/ecmascript-modules , https://jestjs.io/docs/code-transformation |
| node:test runner and assert | https://nodejs.org/api/test.html , https://nodejs.org/api/assert.html |
| Testing Library: queries, priority, user-event, async, React, React Native | https://testing-library.com/docs/queries/about , https://testing-library.com/docs/user-event/intro , https://testing-library.com/docs/dom-testing-library/api-async , https://testing-library.com/docs/react-testing-library/intro , https://callstack.github.io/react-native-testing-library/docs/start/intro |
| jest-dom matchers | https://github.com/testing-library/jest-dom |
| msw (Node and React Native integration, handlers, `listen()` options, migrations) | https://mswjs.io/docs/integrations/node , https://mswjs.io/docs/api/setup-server/listen , https://mswjs.io/docs/integrations/react-native , https://mswjs.io/docs/http/mocking-responses/ , https://mswjs.io/docs/migrations/2.x-to-3.x |
| fast-check | https://fast-check.dev/docs/introduction/ |
| Stryker mutation testing (JS/TS) | https://stryker-mutator.io/docs/stryker-js/introduction/ , https://stryker-mutator.io/docs/stryker-js/configuration/ |
| jest-expo and Expo unit testing | https://docs.expo.dev/develop/unit-testing/ |
| ESLint plugins for tests | https://github.com/vitest-dev/eslint-plugin-vitest , https://github.com/jest-community/eslint-plugin-jest |
| SWC/ts-jest transforms | https://swc.rs/docs/usage/jest , https://kulshekhar.github.io/ts-jest/docs/getting-started/installation |
| TypeScript `tsc` options for test files | https://www.typescriptlang.org/tsconfig/ |
