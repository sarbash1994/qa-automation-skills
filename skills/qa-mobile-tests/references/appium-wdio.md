# Appium 2 + WebdriverIO for native and hybrid apps

> Snippets show the shape of a good setup, not a copy-paste source of truth. Option names and defaults drift between releases: confirm each one against the official page listed in `official-docs.md` for the version installed in the project before using it, and cite that page.

## When

Cross-platform real-device clouds (BrowserStack, Sauce), non-React-Native apps, hybrid apps with webviews, or one runner for web + mobile. Expect slower and flakier runs than Detox/Maestro; invest in selectors and waits.

## Setup

```bash
npm i -D @wdio/cli @wdio/local-runner @wdio/mocha-framework @wdio/spec-reporter @wdio/appium-service @wdio/allure-reporter appium
npx appium driver install uiautomator2
npx appium driver install xcuitest          # macOS only
```

Appium 2 capabilities need the `appium:` prefix for everything non-W3C:

```ts
// wdio.android.conf.ts
export const config = {
  ...shared,
  port: 4723,
  services: [['appium', { args: { relaxedSecurity: true }, command: 'appium' }]],
  capabilities: [{
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': 'Pixel_7_API_34',
    'appium:platformVersion': '14',
    'appium:app': path.resolve('./apps/app-release.apk'),
    'appium:autoGrantPermissions': true,
    'appium:newCommandTimeout': 240,
    'appium:disableWindowAnimation': true,
  }],
};
// wdio.ios.conf.ts
capabilities: [{
  platformName: 'iOS',
  'appium:automationName': 'XCUITest',
  'appium:deviceName': 'iPhone 15',
  'appium:platformVersion': '17.4',
  'appium:app': path.resolve('./apps/App.app'),
  'appium:autoAcceptAlerts': true,
  'appium:wdaLaunchTimeout': 120_000,
}]
```

## Selectors (priority)

1. Accessibility id: `$('~loginButton')` - set via `testID` (iOS maps to accessibility identifier) and `accessibilityLabel` in React Native; works on both platforms.
2. Platform native: `android=new UiSelector().resourceId("com.app:id/login")`, `-ios predicate string:name == "login"`, `-ios class chain:**/XCUIElementTypeButton[\`name == "login"\`]`.
3. Text as a last resort (`android=new UiSelector().text("Login")`); XPath only for debugging.

Page objects branch per platform inside the getter (`driver.isAndroid ? androidSel : iosSel`), never inside tests.

## Waits and gestures

`await el.waitForDisplayed({ timeout: 15_000 })` before every interaction; `waitForExist` for off-screen; scroll with `driver.execute('mobile: scrollGesture', {...})` (Android) / `mobile: scroll` (iOS) or UiScrollable; swipe via `driver.performActions` W3C pointer actions; no `driver.pause` outside documented settles. Hybrid webviews: `driver.getContexts()` then `switchContext('WEBVIEW_...')`; return to `NATIVE_APP` afterwards.

## Session hygiene

One app install per session; `driver.terminateApp`/`activateApp` between tests for a clean start without reinstall; `noReset`/`fullReset` chosen deliberately; `autoGrantPermissions`/`autoAcceptAlerts` so permission dialogs do not block; deep links via `driver.url('myapp://screen')` (iOS needs `appium:bundleId` + `mobile: deepLink` with `bundleId`).

## Reporting and artefacts

`@wdio/allure-reporter`; screenshot on failure in `afterTest`; `driver.getPageSource()` attached on failure (the mobile equivalent of a DOM snapshot); device logs via `driver.getLogs('logcat')`/`syslog`.

## Local emulator/simulator in CI

GitHub Actions: `reactivecircus/android-emulator-runner` for Android (x86_64 image, `-no-window -gpu swiftshader_indirect`), `macos` runners with `xcrun simctl boot` for iOS. Cache the app build; build once in a prior job and download the artefact. Expect 2-4x the wall time of web E2E; shard by spec.
