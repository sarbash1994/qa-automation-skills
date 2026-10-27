# Visual, responsive and accessibility checks

> Snippets show the shape of a good setup, not a copy-paste source of truth. Option names and defaults drift between releases: when you are not sure an option exists in the installed version, check it (installed types, a type-check, or the page in `official-docs.md`) before relying on it, and name the page in the reply if you used one.

## Visual regression (Playwright)

```ts
test('dashboard renders consistently @visual', async ({ dashboardPage, page }) => {
  await dashboardPage.open();
  await expect(page).toHaveScreenshot('dashboard.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.01,
    mask: [page.getByTestId('clock'), page.getByRole('img', { name: 'avatar' })],
    animations: 'disabled',
  });
});
```

- Baselines are committed per project/platform (`dashboard-chromium-linux.png`); generate them in the same environment as CI (Docker image) or accept platform-specific names.
- Update with `npx playwright test --update-snapshots` in a reviewed PR; never in the same commit as the change that caused the diff without saying so.
- Mask or stub dynamic data (dates, avatars, ads); freeze time with `page.clock` when the UI shows relative times.
- Screenshots saved to disk without comparison are documentation, not tests.
- Dedicated services (Percy, Chromatic, Applitools) when many teams need review workflows.

## Responsive

Projects with device descriptors (`devices['Pixel 7']`, `devices['iPhone 14']`, custom `viewport`) instead of `setViewportSize` inside tests; use the `isMobile` fixture to branch expectations.

```ts
test('no horizontal scroll @mobile', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
test('navigation adapts', async ({ page, isMobile }) => {
  await page.goto('/');
  if (isMobile) { await page.getByRole('button', { name: 'Open menu' }).click(); await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible(); }
  else await expect(page.getByRole('navigation').getByRole('link', { name: 'Coverage' })).toBeVisible();
});
```

Tag mobile-only tests (`@mobile`) and run them in the mobile project via `grep`.

## Accessibility

```ts
import AxeBuilder from '@axe-core/playwright';
test('login page has no serious a11y violations @a11y', async ({ page }) => {
  await page.goto('/login');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).exclude('#third-party-chat').analyze();
  const serious = results.violations.filter(v => ['serious', 'critical'].includes(v.impact ?? ''));
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
});
```

Attach the full `results` JSON to the report; fail only on serious/critical until the baseline is clean, then tighten.

## Console and network hygiene

Fixture collects `console.error` and `pageerror` with an allow-list; soft-assert empty at teardown. Optionally fail on 4xx/5xx responses to first-party APIs via `page.on('response')`.

## Performance smoke

`page.evaluate(() => performance.getEntriesByType('navigation'))` for TTFB/DOMContentLoaded budgets, or Lighthouse CI in a separate job; keep budgets generous and alert on trend, not on single runs.
