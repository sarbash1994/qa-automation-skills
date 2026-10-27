# Official documentation map and lookup protocol

Look up official documentation when it pays, not on every answer. The practices in these skills are stable; what drifts is option names, defaults, CLI flags, action versions and capability keys. Answer from what you know and from the project itself when you are sure, and look up the page when one of the triggers below holds.

## When to look up

- You are not certain that an option, value, flag, action input or capability key exists in the installed version, or where it goes.
- The installed major is newer than the one you know well, or the detail is listed under "Check first" below.
- Something failed or behaved unexpectedly: an "unknown option" error, a setting that seems ignored, output that contradicts what you expected.
- The user asks for sources.

Cheaper evidence counts and often settles the question: the installed package's TypeScript types or source in `node_modules`, a type-check of the file you wrote, `--help` output, or a working config already in the project.

## Check first

- Playwright `APIRequestContext` and fixture options you have not used with the installed version.
- Jest ESM flags and `test.failing` across Jest 29 and 30.
- AJV 8 options and `ajv-formats` wiring; Pact matcher API by major.
- The target API's own status codes, headers and rate-limit policy: take them from its docs or real responses, never assume them.

## Lookup protocol

1. **Name the tool and the version.** Read `package.json` and the lockfile; read `uses:` lines for CI actions. For a new project target the current stable release.
2. **Fetch the page.** Prefer a documentation MCP server when available (e.g. Context7: `resolve-library-id`, then `query-docs` with one topic, passing the version when docs are versioned). Otherwise fetch the official URL from the map below and follow the version switcher when an older major is pinned. For GitHub Actions read the action's README or releases page plus the GitHub Docs page for the feature.
3. **Confirm, do not assume.** Check the exact name, type, default and placement. The page wins over memory.
4. **Name it in the reply.** Put the page title or URL next to the claim it confirms, in the answer the user reads, not only in notes or logs. If you were unsure and could not check, mark the detail as unverified and name the page to check.

## Worked examples (lookups that pay off)

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
