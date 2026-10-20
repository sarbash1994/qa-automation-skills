# CI, reporting and external integrations

> Snippets show the shape of a good setup, not a copy-paste source of truth. Option names and defaults drift between releases: confirm each one against the official page listed in `official-docs.md` for the version installed in the project before using it, and cite that page.

## GitHub Actions matrix with Allure published to GitHub Pages

Shape that worked in production: one job per runner project (isolates rate-limit budgets and parallelises), then one job that merges Allure results, restores history from the previously published site so trends carry forward, generates a shields.io endpoint badge from the Allure summary, and deploys to Pages. Publish even when tests failed (the report shows them), but not for pull requests.

```yaml
name: Playwright Tests
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
  workflow_dispatch:

jobs:
  test:
    name: ${{ matrix.project }}
    runs-on: ubuntu-latest
    timeout-minutes: 30
    strategy:
      fail-fast: false
      matrix:
        project: [api, e2e-chromium, e2e-firefox, e2e-webkit]
    env:
      BASE_URL: ${{ vars.BASE_URL || 'https://example.test' }}
      X_ACCESS_KEY: ${{ secrets.X_ACCESS_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test --project=${{ matrix.project }}
      - name: Upload Playwright report
        if: ${{ !cancelled() }}
        uses: actions/upload-artifact@v4
        with: { name: playwright-report-${{ matrix.project }}, path: playwright-report/, retention-days: 14 }
      - name: Upload Allure results
        if: ${{ !cancelled() }}
        uses: actions/upload-artifact@v4
        with: { name: allure-results-${{ matrix.project }}, path: allure-results/, retention-days: 14 }

  allure-report:
    needs: test
    if: ${{ !cancelled() && github.event_name != 'pull_request' }}
    runs-on: ubuntu-latest
    permissions: { contents: read, pages: write, id-token: write }
    concurrency: { group: pages, cancel-in-progress: false }
    environment: { name: github-pages, url: ${{ steps.deploy.outputs.page_url }} }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: 17 }
      - run: npm ci
      - uses: actions/download-artifact@v4
        with: { pattern: allure-results-*, path: allure-raw, merge-multiple: true }
      - name: Restore Allure history (best effort, enables trends)
        run: |
          mkdir -p allure-raw/history
          base="https://${{ github.repository_owner }}.github.io/${{ github.event.repository.name }}/history"
          for f in history.json history-trend.json categories-trend.json duration-trend.json retry-trend.json; do
            curl -fsSL "$base/$f" -o "allure-raw/history/$f" || true
          done
      - run: npx allure generate allure-raw --clean -o allure-report
      - name: Badge JSON from Allure summary
        run: |
          node -e "
            const fs = require('fs');
            const s = JSON.parse(fs.readFileSync('allure-report/widgets/summary.json', 'utf8')).statistic;
            const bad = (s.failed||0) + (s.broken||0), total = s.total||0, passed = s.passed||0;
            const badge = { schemaVersion: 1, label: 'tests',
              message: bad > 0 ? passed + '/' + total + ' passed' : total + ' passed',
              color: bad > 0 ? 'red' : total === 0 ? 'lightgrey' : 'brightgreen' };
            fs.writeFileSync('allure-report/badge.json', JSON.stringify(badge));
          "
      - uses: actions/upload-artifact@v4
        with: { name: allure-report, path: allure-report/, retention-days: 14 }
      - uses: actions/configure-pages@v5
        with: { enablement: true }
      - uses: actions/upload-pages-artifact@v3
        with: { path: allure-report }
      - id: deploy
        uses: actions/deploy-pages@v4
```

README badges: `![Tests](https://img.shields.io/endpoint?url=https://<owner>.github.io/<repo>/badge.json&cacheSeconds=300)`.

Playwright reporters: `[['html', { open: 'never' }], ['list'], ['allure-playwright', { detail: true, resultsDir: 'allure-results' }], ...(process.env.CI ? [['github']] : [])]`. Add `['junit', { outputFile: 'results.xml' }]` when an external dashboard needs structured per-test results (parsing job logs is best effort only).

Secrets: repository Secrets for anything issued once; `vars.X || 'default'` for non-secret URLs. Never print secrets in steps.

## Sharding long projects

When one project exceeds ~10 minutes, shard it across runners and merge reports:

```yaml
    strategy:
      fail-fast: false
      matrix: { shardIndex: [1, 2, 3, 4], shardTotal: [4] }
    steps:
      - run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with: { name: blob-report-${{ matrix.shardIndex }}, path: blob-report, retention-days: 1 }
  merge:
    needs: shards
    if: ${{ !cancelled() }}
    steps:
      - uses: actions/download-artifact@v4
        with: { path: all-blob-reports, pattern: blob-report-*, merge-multiple: true }
      - run: npx playwright merge-reports --reporter html ./all-blob-reports
```

Use `reporter: process.env.CI ? 'blob' : 'html'` (or list both) so shards emit blobs. Allure results from shards merge by simply concatenating the `allure-results` directories.

Cache browsers between runs (`~/.cache/ms-playwright` keyed on the Playwright version) or use the official `mcr.microsoft.com/playwright` image matching the installed version.

## Allure 3

Allure 3 is config-driven: `allurerc.mjs` with `historyPath: './history.jsonl'` (commit or restore it between runs) and `knownIssuesPath` for accepted failures; `npx allure generate ./allure-results -o ./allure-report` (or `allure awesome`). The reporter side is unchanged (`allure-playwright`, `@wdio/allure-reporter`); add `globalLabels` per layer (`{ name: 'layer', value: 'api' }`), `links.issue` templates so `allure.issue('123')` becomes a link, and `environmentInfo`. Use `allure.step`, `allure.parameter`, `allure.attachment` inside tests sparingly, for the things a failure needs.

## When side effects exist

Replace `on: pull_request` with `schedule` (every 30-60 min on stage, less on prod) plus a deploy-triggered run; `retries: 0`; cleanup in the test's `finally`; `workers: 1`. State in the workflow why.

## BrowserStack

- Web (Playwright): connect over CDP with capabilities in the `wss://cdp.browserstack.com/playwright?caps=...` URL; set `build`, `name`, `project` per run; mark status via `browserstack_executor` script at the end of each test. Alternatively use the `browserstack-node-sdk` with a `browserstack.yml` to keep config out of code. Verify the current recommended path in BrowserStack docs before wiring it; it changes.
- Web/native (WebdriverIO): `@wdio/browserstack-service` with `user`/`key` from env, `browserstackLocal: true` when the target is not public, `testObservability` for the dashboard. Capabilities as an array of `{ browserName, 'bstack:options': { os, osVersion, browserVersion, buildName, sessionName } }`.
- Reading results back (REST): `GET https://api.browserstack.com/automate/sessions.json` (web) and `/app-automate/sessions.json` (mobile) with Basic auth `user:key`. Map `done -> success`, `error|failed -> failure`, anything else in progress. Upsert into your store keyed on `(service, external_id)` to avoid duplicates and to update status changes between syncs.

## Allure Server / TestOps style consumers

`GET /api/projects`, `GET /api/projects/{id}/reports` with a Bearer token. Validate the configured base URL is public HTTPS on every request (DNS rebinding), use `redirect: 'error'`.

## Aggregating across sources

Normalise every source into one run record: `{ service, external_id, workflow_name, branch, status, conclusion, started_at, completed_at, duration_ms, html_url, total/passed/failed }`. GitHub Actions via a GitHub App with only `Actions: Read & Write` + `Metadata: Read`, `workflow_run` webhook with HMAC verification, plus a manual backfill. Flaky detection = same workflow alternating conclusion across consecutive runs on the same branch; let humans mark known issues rather than auto-muting.

## Slack alerts

Incoming Webhook URL stored encrypted; account-wide default plus per-rule override so different projects post to different channels. Alert on rule match (failure, success-rate drop, duration spike), not on every run.
