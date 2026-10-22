---
type: llm
focus: trace
weight: 1
---

A GitHub Actions workflow is added that runs the tests, uploads playwright-report as an artifact with if: !cancelled() (or always), and deploys it to GitHub Pages using actions/configure-pages, actions/upload-pages-artifact and actions/deploy-pages with permissions pages: write and id-token: write.
