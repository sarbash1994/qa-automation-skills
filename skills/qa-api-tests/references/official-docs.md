# Official documentation map and lookup protocol

Option names, defaults, CLI flags, action inputs and capability keys change between releases. Before producing configuration, commands, workflows or a "how do I" answer, read the relevant official page for the version in use and base the answer on it. Say which page you used. Never fill a gap from memory when a page exists.

## Lookup protocol

1. **Name the tool and the version.** Read `package.json` and the lockfile for installed versions; read `uses:` lines for CI actions. For a new project target the current stable release.
2. **Fetch the documentation.** Prefer a documentation MCP server when available (e.g. Context7: `resolve-library-id`, then `query-docs` with one topic per question, passing the version when docs are versioned). Otherwise fetch the official URL from the map below with the web fetch tool and follow the site's version switcher when an older major is pinned. For GitHub Actions read the action's README/`action.yml` plus the GitHub Docs page for the platform feature.
3. **Confirm, do not assume.** Check the exact option name, type, default and placement. The page wins over memory.
4. **Answer with the citation.** Name the page (title or URL). If it could not be reached, say so explicitly, mark the answer unverified and name the page the user should check.
5. **Re-check on failure.** An "unknown option"/"unexpected input" error means re-reading the page for the installed version before editing.

## Worked examples

- *"Make the API suite retry on 429 and honour Retry-After."* Read the Playwright `APIResponse`/`APIRequestContext` reference (headers access, `ok()`, `status()`) or the Axios docs (`validateStatus`, interceptors) for the installed version, and the target API's rate-limit documentation for header names, before writing the wrapper.
- *"Validate responses against our OpenAPI file."* Read the AJV options page (`strict`, `allErrors`), `ajv-formats` for supported formats, and the OpenAPI version your file declares (3.0 vs 3.1 differ in `nullable` and JSON Schema dialect) before compiling schemas.
- *"Run supertest against our Next.js route handlers."* Read the Next.js route handler docs for the installed major (Request/Response shape, `params` as a Promise or not) and the Jest/Vitest environment docs before writing the harness.

## Documentation map

| Topic | Where |
|---|---|
| Playwright API testing guide, `request` fixture, `APIRequestContext`, `APIResponse` | https://playwright.dev/docs/api-testing , https://playwright.dev/docs/api/class-apirequestcontext , https://playwright.dev/docs/api/class-apiresponse |
| Playwright fixtures (scopes, `test.extend`), annotations (`fail`, `fixme`, `skip`), `expect.poll`/`toPass` | https://playwright.dev/docs/test-fixtures , https://playwright.dev/docs/test-annotations , https://playwright.dev/docs/test-assertions |
| Playwright configuration and reporters | https://playwright.dev/docs/test-configuration , https://playwright.dev/docs/test-reporters |
| Jest configuration, CLI, globals API (`test.failing`), ESM | https://jestjs.io/docs/configuration , https://jestjs.io/docs/cli , https://jestjs.io/docs/api , https://jestjs.io/docs/ecmascript-modules |
| Vitest config and API (`test.fails`) | https://vitest.dev/config/ , https://vitest.dev/api/ |
| Axios request config, `validateStatus`, interceptors, instances | https://axios-http.com/docs/req_config , https://axios-http.com/docs/interceptors , https://axios-http.com/docs/instance |
| supertest | https://github.com/ladjs/supertest |
| AJV options, strict mode, formats, JSON Schema drafts | https://ajv.js.org/options.html , https://ajv.js.org/strict-mode.html , https://ajv.js.org/packages/ajv-formats.html , https://ajv.js.org/json-schema.html |
| OpenAPI specification; type generation | https://spec.openapis.org/oas/latest.html , https://openapi-ts.dev/ |
| Pact JS and Pact Broker | https://docs.pact.io/implementation_guides/javascript , https://docs.pact.io/pact_broker |
| msw (network mocking), nock | https://mswjs.io/docs/ , https://github.com/nock/nock |
| faker | https://fakerjs.dev/guide/ , https://fakerjs.dev/api/ |
| lodash (`merge`, `omit`, `pick`) | https://lodash.com/docs/ |
| Mail sinks for email assertions (Mailpit) | https://mailpit.axllent.org/docs/api-v1/ |
| HTTP semantics (status codes, Retry-After, RateLimit headers) | https://www.rfc-editor.org/rfc/rfc9110 , https://www.rfc-editor.org/rfc/rfc6585 , IETF RateLimit header fields draft: https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/ |
| Next.js route handlers (for in-process tests) | https://nextjs.org/docs/app/building-your-application/routing/route-handlers (switch to the installed version) |
| Prisma client mocking in tests | https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing |
| GitHub Actions (artifacts, matrix, secrets) | https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions , https://github.com/actions/upload-artifact |
| Allure for Playwright/Jest | https://allurereport.org/docs/playwright/ , https://allurereport.org/docs/jest/ |
