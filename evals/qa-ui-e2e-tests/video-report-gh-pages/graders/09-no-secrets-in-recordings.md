---
type: llm
focus: trace
weight: 1
---

Credentials cannot reach the public report: the login is kept out of the published run (an API login with nothing typed, or the setup project run in a separate invocation without the HTML reporter and the tests run with --no-deps), recording is off for any login that is still typed, and final-answer.md says the published report is public. Turning trace, video and screenshot off alone does not pass when the published run still types the password, because the HTML report titles each fill step with its value.
