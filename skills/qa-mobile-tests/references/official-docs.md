# Official documentation map and lookup protocol

Option names, defaults, CLI flags, action inputs and capability keys change between releases. Before producing configuration, commands, workflows or a "how do I" answer, read the relevant official page for the version in use and base the answer on it. Say which page you used. Never fill a gap from memory when a page exists.

## Lookup protocol

1. **Name the tool and the version.** Read `package.json` and the lockfile for installed versions; read `uses:` lines for CI actions. For a new project target the current stable release.
2. **Fetch the documentation.** Prefer a documentation MCP server when available (e.g. Context7: `resolve-library-id`, then `query-docs` with one topic per question, passing the version when docs are versioned). Otherwise fetch the official URL from the map below with the web fetch tool and follow the site's version switcher when an older major is pinned. For GitHub Actions read the action's README/`action.yml` plus the GitHub Docs page for the platform feature.
3. **Confirm, do not assume.** Check the exact option name, type, default and placement. The page wins over memory.
4. **Answer with the citation.** Name the page (title or URL). If it could not be reached, say so explicitly, mark the answer unverified and name the page the user should check.
5. **Re-check on failure.** An "unknown option"/"unexpected input" error means re-reading the page for the installed version before editing.

## Worked examples

- *"Set up Detox for our Expo app."* Read Detox "Project setup" and "Config overview" for the installed Detox major (`apps`, `devices`, `configurations`, test runner block) and Expo's guidance on native builds (`expo prebuild`, EAS build profiles) before writing `.detoxrc.js`.
- *"Run Maestro flows in CI."* Read the Maestro CLI reference for `maestro test` flags (`--format`, `--include-tags`, sharding options) and either the Maestro Cloud GitHub Action README or Expo EAS Workflows docs for the hosted path.
- *"Run on BrowserStack real devices with WebdriverIO."* Read the BrowserStack App Automate WebdriverIO getting-started page, the app upload API page and the WDIO BrowserStack service options before writing capabilities.
- *"Which capability selects the simulator?"* Read the UiAutomator2/XCUITest driver capability lists; names carry the `appium:` prefix in Appium 2.

## Documentation map

| Topic | Where |
|---|---|
| Detox getting started, project setup, config, CLI, matchers/actions/expectations, CI | https://wix.github.io/Detox/docs/introduction/getting-started , https://wix.github.io/Detox/docs/introduction/project-setup , https://wix.github.io/Detox/docs/config/overview , https://wix.github.io/Detox/docs/cli/test , https://wix.github.io/Detox/docs/api/matchers , https://wix.github.io/Detox/docs/introduction/preparing-for-ci |
| Maestro commands, selectors, flow control, CLI, Cloud, GitHub Action | https://docs.maestro.dev/api-reference/commands , https://docs.maestro.dev/api-reference/selectors , https://docs.maestro.dev/advanced/nested-flows , https://docs.maestro.dev/cli/commands , https://docs.maestro.dev/cloud/ , https://github.com/mobile-dev-inc/action-maestro-cloud |
| Appium 2 docs, capabilities, driver management | https://appium.io/docs/en/latest/ , https://appium.io/docs/en/latest/guides/caps/ , https://appium.io/docs/en/latest/cli/extensions/ |
| UiAutomator2 driver (Android) capabilities and mobile: commands | https://github.com/appium/appium-uiautomator2-driver |
| XCUITest driver (iOS) capabilities and mobile: commands | https://appium.github.io/appium-xcuitest-driver/latest/ |
| WebdriverIO Appium service, mobile selectors, BrowserStack service | https://webdriver.io/docs/appium-service , https://webdriver.io/docs/selectors#mobile-selectors , https://webdriver.io/docs/cloudservices , https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-browserstack-service/README.md |
| BrowserStack App Automate: WebdriverIO, app upload, capabilities, devices, Local, REST API | https://www.browserstack.com/docs/app-automate/appium/getting-started/nodejs/webdriverio , https://www.browserstack.com/docs/app-automate/appium/upload-app-from-filesystem , https://www.browserstack.com/docs/app-automate/capabilities , https://www.browserstack.com/list-of-browsers-and-platforms/app_automate , https://www.browserstack.com/docs/app-automate/api-reference/appium/overview |
| Expo: unit testing, E2E guide, EAS Build and Workflows, dev clients | https://docs.expo.dev/develop/unit-testing/ , https://docs.expo.dev/guides/using-e2e/ , https://docs.expo.dev/build/introduction/ , https://docs.expo.dev/eas/workflows/get-started/ |
| React Native testing overview, `testID`, accessibility props | https://reactnative.dev/docs/testing-overview , https://reactnative.dev/docs/view#testid , https://reactnative.dev/docs/accessibility |
| React Native Testing Library, jest-expo | https://callstack.github.io/react-native-testing-library/docs/start/intro , https://docs.expo.dev/develop/unit-testing/ |
| msw for React Native | https://mswjs.io/docs/integrations/react-native |
| Android emulator in GitHub Actions; iOS simulators on macOS runners | https://github.com/ReactiveCircus/android-emulator-runner , https://developer.apple.com/documentation/xcode/running-your-app-in-simulator-or-on-a-device , https://docs.github.com/en/actions/using-github-hosted-runners/using-github-hosted-runners/about-github-hosted-runners |
| Playwright emulation for the web build | https://playwright.dev/docs/emulation , https://playwright.dev/docs/test-webserver |
| GitHub Actions artifacts and matrices | https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions , https://github.com/actions/upload-artifact |
