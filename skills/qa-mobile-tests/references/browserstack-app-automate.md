# BrowserStack App Automate

> Snippets show the shape of a good setup, not a copy-paste source of truth. Option names and defaults drift between releases: confirm each one against the official page listed in `official-docs.md` for the version installed in the project before using it, and cite that page.

## Upload the build

```bash
curl -u "$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY" -X POST "https://api-cloud.browserstack.com/app-automate/upload" \
  -F "file=@./apps/app-release.apk" -F "custom_id=my-app-android-${GITHUB_RUN_ID}"
# -> { "app_url": "bs://<hashed-id>", "custom_id": ... }
```

Export `BROWSERSTACK_APP_ID=bs://...` (or use `custom_id`) for the test job. Upload once per build, not per test job.

## WebdriverIO configuration

```ts
export const config = {
  ...shared,
  user: process.env.BROWSERSTACK_USERNAME,
  key: process.env.BROWSERSTACK_ACCESS_KEY,
  hostname: 'hub.browserstack.com',
  services: [['browserstack', {
    browserstackLocal: !!process.env.BS_LOCAL,          // app talks to a staging backend not on the public internet
    testReporting: true,
    testReportingOptions: { projectName: 'My app mobile', buildName: process.env.BUILD_NAME ?? 'local' },
  }]],
  commonCapabilities: {
    'bstack:options': { projectName: 'My app mobile', buildName: process.env.BUILD_NAME ?? 'local', debug: true, networkLogs: true, deviceLogs: true },
    'appium:app': process.env.BROWSERSTACK_APP_ID,
  },
  capabilities: [
    { platformName: 'android', 'appium:automationName': 'UiAutomator2', 'bstack:options': { deviceName: 'Samsung Galaxy S23', osVersion: '13.0' } },
    { platformName: 'android', 'appium:automationName': 'UiAutomator2', 'bstack:options': { deviceName: 'Google Pixel 7', osVersion: '13.0' } },
    { platformName: 'ios', 'appium:automationName': 'XCUITest', 'bstack:options': { deviceName: 'iPhone 15', osVersion: '17' } },
  ],
  maxInstances: 3,                                         // ≤ plan parallels
};
```

The service merges `commonCapabilities` into each entry, starts/stops BrowserStack Local when enabled, and sets session status from test results. Use stable `buildName` per CI run so sessions group into one build.

## Device matrix

Pick from analytics (top OS versions × top devices), not from the catalogue: typically 2 Android (latest Samsung + Pixel, one older OS) and 2 iOS (latest + previous iPhone). Run the full matrix nightly; one device per platform on PRs if at all.

## Reading results

`GET https://api-cloud.browserstack.com/app-automate/builds.json`, `/app-automate/builds/{build_id}/sessions.json` with Basic auth; map `passed → success`, `failed/error → failure`, else running; upsert on `hashed_id`. Session pages (`public_url`) include video, logs, Appium log and network capture.

## Playwright for mobile web on BrowserStack

Real-device mobile browsers via the BrowserStack SDK/CDP connection with `realMobile: true`; local runs use Playwright device descriptors (emulated viewport + UA, not a real device engine on Android). Use the cloud for the device matrix and emulation for fast feedback.
