# Detox for React Native (gray-box, synchronised)

> Snippets show the shape of a good setup, not a copy-paste source of truth. Option names and defaults drift between releases: confirm each one against the official page listed in `official-docs.md` for the version installed in the project before using it, and cite that page.

## When

React Native (including Expo with native builds) where you want the test runner to wait automatically for the JS thread, network and animations to settle. Fastest and least flaky option for RN; iOS simulator and Android emulator (real Android devices via `android.attached`), no iOS real devices.

## Setup

```bash
npm i -D detox jest @types/jest
npx detox init            # creates .detoxrc.js and e2e/
```

Expo: generate native projects with `npx expo prebuild` (or build with EAS using a dev/debug profile that includes the Detox test binary); point `binaryPath` at the produced app; keep `build` commands in `.detoxrc.js` so `detox build` works on any machine.

```js
/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: { $0: 'jest', args: { config: 'e2e/jest.config.js', _: ['e2e'] }, jest: { setupTimeout: 120_000 } },
  apps: {
    'ios.release': { type: 'ios.app', binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/App.app',
      build: 'xcodebuild -workspace ios/App.xcworkspace -scheme App -configuration Release -sdk iphonesimulator -derivedDataPath ios/build' },
    'android.release': { type: 'android.apk', binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release' },
  },
  devices: {
    simulator: { type: 'ios.simulator', device: { type: 'iPhone 15' } },
    emulator: { type: 'android.emulator', device: { avdName: 'Pixel_7_API_34' } },
  },
  configurations: {
    'ios.sim.release': { device: 'simulator', app: 'ios.release' },
    'android.emu.release': { device: 'emulator', app: 'android.release' },
  },
};
```

```js
// e2e/jest.config.js
module.exports = {
  rootDir: '..', testMatch: ['<rootDir>/e2e/**/*.test.js'], testTimeout: 120_000, maxWorkers: 1, verbose: true,
  reporters: ['detox/runners/jest/reporter'],
  globalSetup: 'detox/runners/jest/globalSetup', globalTeardown: 'detox/runners/jest/globalTeardown',
  testEnvironment: 'detox/runners/jest/testEnvironment',
};
```

## Test shape

```js
describe('Login', () => {
  beforeAll(async () => { await device.launchApp({ newInstance: true, permissions: { notifications: 'YES' } }); });
  beforeEach(async () => { await device.reloadReactNative(); });

  it('signs in and lands on the dashboard', async () => {
    await element(by.id('login-email')).typeText('qa@example.com');
    await element(by.id('login-password')).typeText('secret-pass');
    await element(by.id('login-submit')).tap();
    await expect(element(by.id('dashboard-title'))).toBeVisible();
  });

  it('shows an error for a wrong password', async () => {
    await element(by.id('login-email')).typeText('qa@example.com');
    await element(by.id('login-password')).typeText('wrong');
    await element(by.id('login-submit')).tap();
    await waitFor(element(by.text('Invalid credentials'))).toBeVisible().withTimeout(5_000);
  });
});
```

Matchers: `by.id` (testID) first, `by.label` (accessibilityLabel), `by.text` last; `atIndex` only with a comment. `waitFor(...).toBeVisible().withTimeout()` for things outside the synchronised JS thread (network you do not control). Screen objects as plain modules exporting matchers and actions.

## Flake sources specific to Detox

- Infinite animations/timers (`setInterval`, Lottie loops) block synchronisation: disable them in test builds or use `device.disableSynchronization()` around that screen, with a comment.
- Release builds for tests; debug builds with the dev menu and remote JS are slow and non-deterministic.
- Permissions set at launch (`permissions`), deep links via `device.openURL`, push via `device.sendUserNotification` (iOS).
- `maxWorkers > 1` requires multiple simulators/emulators; start with 1.

## CI

macOS runner for iOS (`xcrun simctl`), Linux with `reactivecircus/android-emulator-runner` for Android; `detox build --if-missing` then `detox test -c <config> --cleanup --headless --record-logs failing --take-screenshots failing`; upload `artifacts/`.
