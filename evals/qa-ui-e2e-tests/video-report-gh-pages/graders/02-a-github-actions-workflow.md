---
type: llm
focus: trace
weight: 1
---

A GitHub Actions workflow runs the tests, uploads the report even when tests fail (if: !cancelled() or always()), and deploys it to GitHub Pages with actions/upload-pages-artifact and actions/deploy-pages (actions/configure-pages optional) using permissions pages: write and id-token: write and the github-pages environment.
