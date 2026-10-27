# Official documentation map and lookup protocol

Look up official documentation when it pays, not on every answer. The practices in these skills are stable; what drifts is option names, defaults, CLI flags, action versions and capability keys. Answer from what you know and from the project itself when you are sure, and look up the page when one of the triggers below holds.

## When to look up

- You are not certain that an option, value, flag, action input or capability key exists in the installed version, or where it goes.
- The installed major is newer than the one you know well, or the detail is listed under "Check first" below.
- Something failed or behaved unexpectedly: an "unknown option" error, a setting that seems ignored, output that contradicts what you expected.
- The user asks for sources.

Cheaper evidence counts and often settles the question: the installed package's TypeScript types or source in `node_modules`, a type-check of the file you wrote, `--help` output, or a working config already in the project.

## Check first

- Detox config shape and its current Expo support status.
- Maestro command names and `maestro test` flags; Appium capability names per driver.
- EAS Workflows job types and build profiles; BrowserStack App Automate upload API and capabilities.
- `android-emulator-runner` inputs and runner images.

## Lookup protocol

1. **Name the tool and the version.** Read `package.json` and the lockfile; read `uses:` lines for CI actions. For a new project target the current stable release.
2. **Fetch the page.** Prefer a documentation MCP server when available (e.g. Context7: `resolve-library-id`, then `query-docs` with one topic, passing the version when docs are versioned). Otherwise fetch the official URL from the map below and follow the version switcher when an older major is pinned. For GitHub Actions read the action's README or releases page plus the GitHub Docs page for the feature.
3. **Confirm, do not assume.** Check the exact name, type, default and placement. The page wins over memory.
4. **Name it in the reply.** Put the page title or URL next to the claim it confirms, in the answer the user reads, not only in notes or logs. If you were unsure and could not check, mark the detail as unverified and name the page to check.

## Worked examples (lookups that pay off)

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
| msw for React Native (msw 3 uses `@msw/react-native`), 2.x → 3.x migration | https://mswjs.io/docs/integrations/react-native , https://mswjs.io/docs/migrations/2.x-to-3.x |
| Android emulator in GitHub Actions; iOS simulators on macOS runners | https://github.com/ReactiveCircus/android-emulator-runner , https://developer.apple.com/documentation/xcode/running-your-app-in-simulator-or-on-a-device , https://docs.github.com/en/actions/using-github-hosted-runners/using-github-hosted-runners/about-github-hosted-runners |
| Playwright emulation for the web build | https://playwright.dev/docs/emulation , https://playwright.dev/docs/test-webserver |
| GitHub Actions artifacts and matrices | https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions , https://github.com/actions/upload-artifact |
