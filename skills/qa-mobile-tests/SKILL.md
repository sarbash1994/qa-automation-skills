---
name: qa-mobile-tests
description: Plan, build and review mobile test automation for React Native/Expo and native iOS/Android apps - choosing between Detox, Maestro, Appium + WebdriverIO and Expo e2e tooling, running on simulators/emulators locally and on BrowserStack App Automate, Maestro Cloud or EAS Workflows in CI, selecting by testID/accessibility id, handling permissions, deep links, offline and push, and layering unit, component (React Native Testing Library) and Playwright web-build checks under a small device suite. Use whenever the user mentions mobile tests, Appium, Detox, Maestro, Expo, React Native, iOS/Android automation, device farms, BrowserStack App Automate, testID or wants to test an apk/ipa/app build.
---

# Mobile Tests

Target: a thin device suite that proves the critical journeys on real OS versions, sitting on top of fast unit, component and web-build checks that catch most regressions without a simulator. Device tests are the slowest and flakiest layer you will own; spend them deliberately. Per-tool recipes are in `references/`; verify current setup steps against the tool docs (Context7) before generating config, because Expo, Detox and Maestro change quickly. References to sibling skills apply only when they are installed; otherwise continue with this skill and the project's conventions.

## 0. Verify against official documentation before answering

Detox, Maestro, Appium drivers, Expo/EAS and BrowserStack App Automate change quickly; capability keys, config file shapes and CLI flags differ by version. Before writing `.detoxrc.js`, Maestro YAML, Appium capabilities, `wdio.conf.ts`, an EAS workflow or a CI job, read the official page for the installed version (documentation MCP such as Context7 first, otherwise the URL from `references/official-docs.md`), confirm the exact key and its placement, and cite the page. Unreachable docs → say so and mark the answer unverified. Typical lookups: Detox `apps`/`devices`/`configurations` and jest runner settings, Maestro command names and `maestro test` flags, `appium:` capability names for UiAutomator2/XCUITest, `@wdio/browserstack-service` options and `bstack:options`, BrowserStack app upload API, Expo e2e guide and EAS Workflows job types, `android-emulator-runner` inputs.

## 1. Layer before you automate devices

1. **Unit** pure logic (parsers, pricing, offline queue policy, cache keys) with no RN imports: milliseconds, no device.
2. **Component** with `@testing-library/react-native` under `jest-expo`: render, interact by role/label/testID, mock native modules with their official jest mocks, mock the API with `msw`.
3. **Web build smoke** with Playwright against `expo start --web`: layout per viewport, routing, i18n, console errors, on any Linux runner. `testID` becomes `data-testid` on web so one hook serves both.
4. **API and contract tests** for the backend the app calls (see `qa-api-tests`); device tests assume a healthy, seeded backend.
5. **Device E2E**: 5-15 journeys (onboarding, login, core transaction, offline/online transition, push/deep link entry) on 1-2 devices per platform.

Details for layers 1-3: `references/rn-web-and-unit.md`.

## 2. Choose the device tool

| Situation | Tool | Recipe |
|---|---|---|
| React Native/Expo, want the least flakiness, simulators/emulators are enough | Detox (gray-box, auto-synchronises with JS thread/network/animations) | `references/detox.md` |
| Fast to write, black-box, mixed stacks, cloud runs without infrastructure, non-engineers maintain flows | Maestro (YAML flows; Maestro Cloud or EAS Workflows) | `references/maestro.md` |
| Real-device matrix on a cloud, native/hybrid apps, webviews, one runner with web | Appium 2 + WebdriverIO (+ `@wdio/browserstack-service`) | `references/appium-wdio.md`, `references/browserstack-app-automate.md` |
| Expo project following Expo's own E2E guide | Expo-documented `e2e` runner with EAS build + simulator jobs | Expo docs via Context7; same hooks and layering apply |

Do not run two device frameworks for the same journeys. Pick one, keep Appium for the cloud matrix only if the primary tool cannot reach real iOS devices.

## 3. Test hooks are a product requirement

- Every interactive element gets a stable, unique `testID` (kebab-case: `login-submit`) and a meaningful `accessibilityLabel`/`accessibilityRole`. Maestro `id`, Detox `by.id`, Appium `~accessibilityId` and Playwright `getByTestId` all key on these.
- Text selectors are for assertions on copy, not for finding controls (localisation breaks them). Positional (`index`, `atIndex`, `nth`) only with a comment explaining why no hook exists and a ticket to add one.
- Document the convention in the app repo so new screens ship with hooks.

## 4. Build and environment discipline

- Test against **release-like builds** (debug builds include the dev menu, remote debugging and slower JS); one build per platform per CI run, uploaded once (artefact or `bs://` id) and reused by every test job.
- Config via env: app path/id, platform, device, backend URL; a typed config module with `required()`/`optional()`; `.env.example` complete.
- Backend: point the app at a dedicated test environment with a seed script and a reset path; never production. Tunnel (BrowserStack Local) when the backend is private.
- Pin OS versions and device names in config; choose the matrix from analytics (top 2 devices × top 2 OS versions per platform), not the catalogue.
- Disable or shorten infinite animations and splash delays in test builds (feature flag or `__DEV__`-like `E2E` env), freeze timezone/locale on the device where possible.

## 5. Flake control on devices

- Wait on app state (element visible/enabled, screen title), never on sleeps; Detox synchronises for you, Maestro auto-waits with `extendedWaitUntil` for network-bound states, Appium needs explicit `waitForDisplayed` before every interaction.
- Fresh app state per test or per journey (`launchApp({ newInstance: true })`, Maestro `clearState: true`, Appium `terminateApp`/`activateApp`); grant permissions at launch so system dialogs do not block.
- Unique data per run (timestamp/random suffix) created through the API; cleanup through the API.
- Deep links to reach screens directly instead of clicking through 6 screens for setup; keep one test that clicks through.
- Retries: 1 at most for device tests without side effects; investigate every retry pass; quarantine with an owner and deadline, never silent skips.
- Collect on failure: screenshot, page source/view hierarchy, device logs (logcat/syslog), video where the platform provides it.

## 6. CI shape

- Build job per platform (EAS, Gradle, xcodebuild) → upload artefact → test jobs in parallel: Android emulator on Linux (`reactivecircus/android-emulator-runner`), iOS simulator on macOS (`xcrun simctl`), cloud matrix nightly (BrowserStack App Automate, Maestro Cloud, EAS Workflows).
- Smoke tier on every PR build (5 flows, one device per platform); regression tier nightly on the matrix.
- Reports: JUnit from each tool (`maestro --format junit`, WDIO junit/allure, Detox jest reporters) merged into the same Allure/dashboard as web and API; sessions grouped by a stable `buildName` per CI run.

## 7. What to verify beyond happy paths

Permission denied flows, offline → online sync (airplane mode via `device.setNetworkConditions`/Appium `toggleAirplaneMode`/manual stub), background → foreground, push notification tap (`device.sendUserNotification`, Appium `pushNotification` on cloud), deep link cold start, rotation, low-end device performance budget (cold start time), biometric prompt stubs, app upgrade from previous version (install old → install new → data intact).

## 8. Review checklist for a mobile spec

- Logic-free spec: no branches, loops, try/catch or helper definitions in the file; literal expectations; one behaviour per test (tables and named lifecycle tests excepted); no coupling between tests; no noise. Full rules and lint: `qa-automation-architect/references/test-code-rules.md`.
- Journey a user would notice; not re-testing API validation on a device.
- Hooks by testID/accessibility id; no text-based control lookup; no positional selectors without reason.
- Fresh state and granted permissions at launch; unique data; API seeding and cleanup.
- No sleeps; waits tied to app state with bounded timeouts.
- Release-like build from CI artefact; env-driven config; no credentials in flows.
- Artefacts on failure attached; test tagged by platform and tier.
