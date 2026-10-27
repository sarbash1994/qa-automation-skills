# Official documentation map and lookup protocol

Look up official documentation when it pays, not on every answer. The practices in these skills are stable; what drifts is option names, defaults, CLI flags, action versions and capability keys. Answer from what you know and from the project itself when you are sure, and look up the page when one of the triggers below holds.

## When to look up

- You are not certain that an option, value, flag, action input or capability key exists in the installed version, or where it goes.
- The installed major is newer than the one you know well, or the detail is listed under "Check first" below.
- Something failed or behaved unexpectedly: an "unknown option" error, a setting that seems ignored, output that contradicts what you expected.
- The user asks for sources.

Cheaper evidence counts and often settles the question: the installed package's TypeScript types or source in `node_modules`, a type-check of the file you wrote, `--help` output, or a working config already in the project.

## Check first

- GitHub Actions major versions and inputs (`actions/*pages*`, `upload-artifact`, `setup-*`): read the action's README or releases page.
- Allure: history and config differ between Allure 2 and Allure 3.
- Reporter output directories and attachment behaviour when a report is published.
- BrowserStack SDK setup and capability keys; Appium capabilities per driver.
- ESLint flat config and plugin rule names (eslint-plugin-playwright, -jest, -vitest).

## Lookup protocol

1. **Name the tool and the version.** Read `package.json` and the lockfile; read `uses:` lines for CI actions. For a new project target the current stable release.
2. **Fetch the page.** Prefer a documentation MCP server when available (e.g. Context7: `resolve-library-id`, then `query-docs` with one topic, passing the version when docs are versioned). Otherwise fetch the official URL from the map below and follow the version switcher when an older major is pinned. For GitHub Actions read the action's README or releases page plus the GitHub Docs page for the feature.
3. **Confirm, do not assume.** Check the exact name, type, default and placement. The page wins over memory.
4. **Name it in the reply.** Put the page title or URL next to the claim it confirms, in the answer the user reads, not only in notes or logs. If you were unsure and could not check, mark the detail as unverified and name the page to check.

## Worked examples (lookups that pay off)

- *"Configure Playwright so tests produce a report together with video."* Read Playwright "Videos" (the `use.video` option and its values such as `on`, `off`, `retain-on-failure`, `on-first-retry`, `size`) and "Reporters" (`reporter` array, HTML reporter options like `open`, where attachments appear). Then write `use.video` and `reporter` in `playwright.config.ts`, and mention that the HTML report shows the video attachment per test. Cite both pages.
- *"Set up CI to publish results to GitHub Pages."* Read GitHub Docs "Publishing with a custom GitHub Actions workflow" (required `permissions: pages: write, id-token: write`, the `github-pages` environment), the READMEs of `actions/configure-pages`, `actions/upload-pages-artifact` and `actions/deploy-pages` for current major versions and inputs, and `actions/upload-artifact` / `download-artifact` for passing results between jobs. Then write the workflow and name the pages you used. If a reporter (Allure, Playwright HTML) is involved, also read its own "generate report" page for the output directory.
- *"Why does my `allure generate` ignore history?"* Read the Allure Report docs for the installed major (Allure 2 CLI `history/` directory convention vs Allure 3 `historyPath` in the config file) before answering.

## Documentation map

### Test runners and assertion libraries

| Topic | Where |
|---|---|
| Playwright Test configuration, `use` options, projects, timeouts, retries, workers | https://playwright.dev/docs/test-configuration and https://playwright.dev/docs/test-use-options and https://playwright.dev/docs/api/class-testconfig |
| Playwright reporters (HTML, list, JUnit, blob, GitHub, custom) | https://playwright.dev/docs/test-reporters |
| Playwright videos, screenshots, trace viewer | https://playwright.dev/docs/videos , https://playwright.dev/docs/screenshots , https://playwright.dev/docs/trace-viewer |
| Playwright CI, sharding and merge-reports | https://playwright.dev/docs/ci , https://playwright.dev/docs/ci-intro , https://playwright.dev/docs/test-sharding |
| Playwright best practices, fixtures, annotations (`fail`, `fixme`, `skip`) | https://playwright.dev/docs/best-practices , https://playwright.dev/docs/test-fixtures , https://playwright.dev/docs/test-annotations |
| Playwright release notes (what changed in the installed version) | https://playwright.dev/docs/release-notes |
| Jest configuration, CLI, `test.failing`, ESM support | https://jestjs.io/docs/configuration , https://jestjs.io/docs/cli , https://jestjs.io/docs/api , https://jestjs.io/docs/ecmascript-modules |
| Vitest configuration and API | https://vitest.dev/config/ , https://vitest.dev/api/ |
| WebdriverIO configuration, CLI, reporters, services | https://webdriver.io/docs/configuration , https://webdriver.io/docs/configurationfile , https://webdriver.io/docs/allure-reporter , https://webdriver.io/docs/cloudservices , https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-browserstack-service/README.md |
| ESLint plugins for tests (rule names for test-code-rules.md) | https://github.com/playwright-community/eslint-plugin-playwright , https://github.com/jest-community/eslint-plugin-jest , https://github.com/vitest-dev/eslint-plugin-vitest , https://github.com/lo1tuma/eslint-plugin-mocha , https://eslint.org/docs/latest/rules/no-restricted-syntax |

### Reporting

| Topic | Where |
|---|---|
| Allure Report (choose the version matching the installed CLI: v2 vs v3), Playwright/Jest/WDIO integrations, history | https://allurereport.org/docs/ (Playwright: https://allurereport.org/docs/playwright/ ; history and retries: https://allurereport.org/docs/history-and-retries/ ; Allure 3 config: https://allurereport.org/docs/v3/configure/ ) |
| JUnit XML consumers (dashboards) | the consumer's own docs; Playwright JUnit reporter options on the reporters page above |
| shields.io endpoint badges | https://shields.io/badges/endpoint-badge |

### CI/CD

| Topic | Where |
|---|---|
| GitHub Actions workflow syntax (matrix, `needs`, `if`, `concurrency`, permissions) | https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions |
| GitHub Actions contexts, expressions, secrets and variables | https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/accessing-contextual-information-about-workflow-runs , https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions |
| Artifacts between jobs | https://github.com/actions/upload-artifact , https://github.com/actions/download-artifact |
| GitHub Pages via Actions | https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages , https://github.com/actions/configure-pages , https://github.com/actions/upload-pages-artifact , https://github.com/actions/deploy-pages |
| Node setup and caching | https://github.com/actions/setup-node , https://github.com/actions/cache |
| Scheduled workflows and `workflow_dispatch` | https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows |
| GitLab CI / other CI | the platform's pipeline reference; the same artifact and pages concepts apply |

### Cloud device/browser providers

| Topic | Where |
|---|---|
| BrowserStack Automate (web) with Playwright or WebdriverIO | https://www.browserstack.com/docs/automate/playwright , https://www.browserstack.com/docs/automate/selenium/getting-started/nodejs/webdriverio |
| BrowserStack App Automate (mobile) | https://www.browserstack.com/docs/app-automate/appium/getting-started/nodejs/webdriverio |
| BrowserStack REST API (reading builds/sessions) | https://www.browserstack.com/docs/automate/api-reference/selenium/introduction , https://www.browserstack.com/docs/app-automate/api-reference/appium/overview |
| BrowserStack Local | https://www.browserstack.com/docs/local-testing |
| Sauce Labs, LambdaTest | the provider's docs for the same topics |

### Mocks, contracts and data

| Topic | Where |
|---|---|
| AJV and formats | https://ajv.js.org/guide/getting-started.html , https://ajv.js.org/options.html , https://ajv.js.org/packages/ajv-formats.html |
| OpenAPI specification, type generation | https://spec.openapis.org/oas/latest.html , https://openapi-ts.dev/ |
| Pact (consumer-driven contracts) | https://docs.pact.io/ |
| msw, nock, supertest | https://mswjs.io/docs/ , https://github.com/nock/nock , https://github.com/ladjs/supertest |
| faker | https://fakerjs.dev/guide/ |

### Mobile tooling

| Topic | Where |
|---|---|
| Appium 2, drivers, capabilities | https://appium.io/docs/en/latest/ , https://github.com/appium/appium-uiautomator2-driver , https://appium.github.io/appium-xcuitest-driver/latest/ |
| Detox | https://wix.github.io/Detox/docs/introduction/getting-started |
| Maestro | https://docs.maestro.dev/ |
| Expo testing and EAS Workflows | https://docs.expo.dev/develop/unit-testing/ , https://docs.expo.dev/guides/using-e2e/ , https://docs.expo.dev/eas/workflows/get-started/ |
| React Native Testing Library | https://callstack.github.io/react-native-testing-library/ |
| Android emulator in GitHub Actions | https://github.com/ReactiveCircus/android-emulator-runner |
