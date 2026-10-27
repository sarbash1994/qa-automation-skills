# Publishing Playwright reports to GitHub Pages

> Snippets show the shape of a good setup, not a copy-paste source of truth. Action majors and inputs are on the "Check first" list: confirm each `@<major>` on the action's README or releases page before writing it, and name the page in the reply.

## Keep secrets out of the published report

A report on GitHub Pages is public for a public repository and readable by everyone with access otherwise. Three things in it can carry a typed password:

- **The HTML report itself.** Every `fill` step is titled with its value (`Fill "<value>"`), and the failing line's source snippet is embedded. This happens with trace, video and screenshot all off; verified with Playwright 1.64.1, where a password filled from an environment variable appeared in the step title of the report data.
- **Traces**, which store every action with its arguments, DOM snapshots and network bodies.
- **Videos and screenshots**, which show whatever is on screen.

So keep the login out of the published run entirely:

- Prefer an API login in the `setup` project (`request.post` to the auth endpoint, then save storage state): nothing is typed, nothing is titled.
- When the login must go through the form, run `setup` in its own invocation with a console reporter, then run the tests with `--no-deps` so only that second run writes the HTML report (see the workflow below). Keep recording off on `setup` as well; project-level `use` overrides the global one:

```ts
projects: [
  { name: 'setup', testMatch: /.*\.setup\.ts/, use: { trace: 'off', video: 'off', screenshot: 'off' } },
  { name: 'chromium', use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' }, dependencies: ['setup'] },
],
```

- Every other test should reuse the storage state or an API token and never type credentials. When existing tests do (a hard-coded form login), report them as a leak into the published report and offer the change instead of rewriting them unasked. A test of the login form itself uses a throwaway account or lives in a project whose report is not published.
- Say in the reply that the published report is public and what it can contain.

## Workflow shape

The test job uploads the report even when tests fail; the deploy job runs only when a report exists and only for `main`.

```yaml
on:
  push: { branches: [main] }
  workflow_dispatch:
  # pull_request: { branches: [main] }   # add when the suite should be a PR check; the guards below keep PRs from deploying
permissions: { contents: read }

jobs:
  test:
    runs-on: ubuntu-latest
    outputs:
      report: ${{ steps.report.outputs.exists }}
    steps:
      - uses: actions/checkout@<major>
      - uses: actions/setup-node@<major>
        with: { node-version: lts/*, cache: npm }
      - run: npm ci                                   # needs a committed package-lock.json
      - run: npx playwright install --with-deps chromium
      - name: Log in (not part of the published report)
        run: npx playwright test --project=setup --reporter=list
        env: { BASE_URL: '${{ vars.BASE_URL }}', USER_EMAIL: '${{ secrets.USER_EMAIL }}', USER_PASSWORD: '${{ secrets.USER_PASSWORD }}' }
      - name: Tests (writes the HTML report)
        run: npx playwright test --project=chromium --no-deps
        env: { BASE_URL: '${{ vars.BASE_URL }}' }
      - id: report
        if: ${{ !cancelled() }}
        run: echo "exists=$([ -f playwright-report/index.html ] && echo true || echo false)" >> "$GITHUB_OUTPUT"
      - if: ${{ !cancelled() && steps.report.outputs.exists == 'true' }}
        uses: actions/upload-artifact@<major>         # regular artifact on every run, PRs included
        with: { name: playwright-report, path: playwright-report/, retention-days: 14 }
      - if: ${{ !cancelled() && steps.report.outputs.exists == 'true' && github.ref == 'refs/heads/main' && github.event_name != 'pull_request' }}
        uses: actions/upload-pages-artifact@<major>
        with: { path: playwright-report/ }

  deploy:
    needs: test
    if: ${{ !cancelled() && needs.test.outputs.report == 'true' && github.ref == 'refs/heads/main' && github.event_name != 'pull_request' }}
    runs-on: ubuntu-latest
    permissions: { pages: write, id-token: write }
    environment: { name: github-pages, url: '${{ steps.deployment.outputs.page_url }}' }
    concurrency: { group: pages, cancel-in-progress: false }
    steps:
      - id: deployment
        uses: actions/deploy-pages@<major>
```

- `github.ref == 'refs/heads/main'` also stops a manual run from another branch from publishing.
- `actions/configure-pages` is optional when the repository's Pages source is already "GitHub Actions"; use it when the workflow should read or enable the Pages settings.
- Pages keeps only the latest deployment. For history, keep the regular artifact or publish into per-run folders.
- One-time setup to list in the reply: Pages source set to "GitHub Actions", the `BASE_URL` variable and the credential secrets.
