# Official documentation map and lookup protocol

Option names, defaults, CLI flags, action inputs and capability keys change between releases. Before producing configuration, commands, workflows or a "how do I" answer, read the relevant official page for the version in use and base the answer on it. Say which page you used. Never fill a gap from memory when a page exists.

## Lookup protocol

1. **Name the tool and the version.** Read `package.json` and the lockfile for installed versions; read `uses:` lines for CI actions. For a new project target the current stable release.
2. **Fetch the documentation.** Prefer a documentation MCP server when available (e.g. Context7: `resolve-library-id`, then `query-docs` with one topic per question, passing the version when docs are versioned). Otherwise fetch the official URL from the map below with the web fetch tool and follow the site's version switcher when an older major is pinned. For GitHub Actions read the action's README/`action.yml` plus the GitHub Docs page for the platform feature.
3. **Confirm, do not assume.** Check the exact option name, type, default and placement. The page wins over memory.
4. **Answer with the citation.** Name the page (title or URL). If it could not be reached, say so explicitly, mark the answer unverified and name the page the user should check.
5. **Re-check on failure.** An "unknown option"/"unexpected input" error means re-reading the page for the installed version before editing.

## Worked examples

- *"Configure Playwright so tests produce a report together with video."* Read "Videos" (`use.video`: values and `size`), "Reporters" (`reporter` array, HTML reporter `open`/`outputFolder`, attachments) and "Test use options". Write `use.video` and `reporter` in `playwright.config.ts`, note that videos appear as attachments in the HTML report and are kept per the chosen mode. Cite the pages.
- *"Set up CI to publish the HTML/Allure report to GitHub Pages."* Read GitHub Docs "Using custom workflows with GitHub Pages" (permissions `pages: write`, `id-token: write`, `github-pages` environment), the READMEs of `actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages` (current major versions and inputs) and `actions/upload-artifact`/`download-artifact` for moving results between jobs. Then write the workflow and cite the pages.
- *"Run our Playwright suite on BrowserStack."* Read BrowserStack's Playwright integration page for the currently recommended path (SDK vs CDP connection) and its capability names before touching config.
- *"Make the screenshot test stable."* Read `toHaveScreenshot` options (`maxDiffPixelRatio`, `mask`, `animations`, `threshold`) and the snapshot path template docs before changing baselines.

## Documentation map

| Topic | Where |
|---|---|
| Playwright best practices, locators, actions, assertions | https://playwright.dev/docs/best-practices , https://playwright.dev/docs/locators , https://playwright.dev/docs/actionability , https://playwright.dev/docs/test-assertions |
| Page Object pattern, fixtures, parameterisation | https://playwright.dev/docs/pom , https://playwright.dev/docs/test-fixtures , https://playwright.dev/docs/test-parameterize |
| Authentication, storage state, project dependencies | https://playwright.dev/docs/auth , https://playwright.dev/docs/test-projects |
| Configuration, `use` options (video, trace, screenshot, locale, timezone, testIdAttribute), timeouts, retries | https://playwright.dev/docs/test-configuration , https://playwright.dev/docs/test-use-options , https://playwright.dev/docs/test-timeouts , https://playwright.dev/docs/test-retries |
| Videos, screenshots, trace viewer | https://playwright.dev/docs/videos , https://playwright.dev/docs/screenshots , https://playwright.dev/docs/trace-viewer |
| Visual comparisons (`toHaveScreenshot`) | https://playwright.dev/docs/test-snapshots , https://playwright.dev/docs/api/class-pageassertions |
| Emulation (devices, viewport, color scheme, geolocation), clock | https://playwright.dev/docs/emulation , https://playwright.dev/docs/clock |
| Network mocking and HAR | https://playwright.dev/docs/mock , https://playwright.dev/docs/network |
| Web server, CI, sharding, merge-reports, reporters | https://playwright.dev/docs/test-webserver , https://playwright.dev/docs/ci , https://playwright.dev/docs/test-sharding , https://playwright.dev/docs/test-reporters |
| Annotations and tags (`fail`, `fixme`, `slow`, `tag`) | https://playwright.dev/docs/test-annotations |
| Accessibility testing with axe | https://playwright.dev/docs/accessibility-testing , https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright |
| ESLint plugin for Playwright | https://github.com/playwright-community/eslint-plugin-playwright |
| WebdriverIO configuration, selectors, page objects, auto-wait | https://webdriver.io/docs/configuration , https://webdriver.io/docs/selectors , https://webdriver.io/docs/pageobjects , https://webdriver.io/docs/autowait |
| WebdriverIO services and reporters (BrowserStack, Allure, Appium) | https://webdriver.io/docs/cloudservices , https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-browserstack-service/README.md , https://webdriver.io/docs/allure-reporter , https://webdriver.io/docs/appium-service |
| BrowserStack Automate: Playwright, WebdriverIO, capabilities, Local, REST API | https://www.browserstack.com/docs/automate/playwright , https://www.browserstack.com/docs/automate/selenium/getting-started/nodejs/webdriverio , https://www.browserstack.com/docs/automate/capabilities , https://www.browserstack.com/docs/local-testing , https://www.browserstack.com/docs/automate/api-reference/selenium/introduction |
| Allure Report for Playwright and WebdriverIO, history | https://allurereport.org/docs/playwright/ , https://allurereport.org/docs/webdriverio/ , https://allurereport.org/docs/history-and-retries/ |
| GitHub Actions and Pages | https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions , https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages , https://github.com/actions/configure-pages , https://github.com/actions/upload-pages-artifact , https://github.com/actions/deploy-pages , https://github.com/actions/upload-artifact |
| ARIA roles and accessible names (for `getByRole`) | https://www.w3.org/TR/wai-aria-1.2/#role_definitions , https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles |
| Anthropic/OpenAI SDKs (if an LLM classifier is used) | https://docs.anthropic.com/en/api , https://platform.openai.com/docs/api-reference |
