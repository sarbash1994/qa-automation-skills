# Question territory

Ground to cover during the conversation. Never read these out as a list; ask one at a time, anchored in a concrete moment, and skip what the request, the repo or recon already answered. Each block lists why it matters and example probes.

## What is under test and what exists

Why: decides which layer skills are involved and whether this is greenfield, extension or rescue.

- "Walk me through what the app does from the user's side; where does money or data change hands?"
- "Is there an API reference, a Postman/Bruno collection, or do we learn the API from the browser's network tab?"
- "What tests exist today, who runs them, and when did they last catch something?"
- "Is this a take-home with a brief? Can I read it?" (then: deadline, reviewers, what the brief lists as required tools)

## Why now, success, anti-goals

Why: a green badge for a reviewer and a regression net for a team produce different suites.

- "What was the last bug that reached users that a test should have caught?"
- "If this works perfectly, what changes for you in a month?"
- "What would make you wince if I got it wrong: a slow pipeline, flaky reruns, tests nobody can read, tests that pass while the product is broken?"
- "Who else will read or maintain this, and what do they already know?"

## Target constraints (usually discovered by recon, confirmed with the user)

Why: these force the architecture; see `qa-automation-architect` section 2.

- Auth: "How many ways does a request get authorised, and does logout actually invalidate anything?"
- Rate limits: "Have you seen 429s? What do the `RateLimit-*` headers say on `/auth`?"
- Side effects: "If a test run completes successfully, what exists afterwards in the real world: users, bookings, emails, charges?"
- Data isolation: "Can I create data without colliding with other testers or customers? Is there a tenant or namespace per key?"
- Test hooks: "Do screens have `data-testid` or stable roles and labels, or are ids and classes generated?"
- Environments: "Which environment do tests run against, how often is it reset, and does it mirror production limits (captcha, IP limits)?"
- Cleanup: "Is there a delete endpoint or a test mode, and who owns leftover data?"

## How it gets made

Why: the team maintains what you build; choices they cannot sustain are wrong even when technically better.

- "Which languages and runners does the team already use for anything?"
- "Where does CI run (GitHub Actions, GitLab, Jenkins), and who can add secrets?"
- "Do you already pay for a device or browser cloud (BrowserStack, Sauce, LambdaTest)?"
- "Where should results be visible: a report link, a badge, Slack, a dashboard, a TMS?"
- "How much time do we have for the first useful run?"
- "Any rules I must follow: TypeScript strict, ESLint config, monorepo layout, commit conventions?"

## Prior art

- "Show me a test suite you liked working in. What made it good?"
- "And one you hated. What made it bad?"
- "Anything you have seen in other teams' frameworks that you want here or want to avoid?"

## Mobile-specific additions

- "Which platforms and OS versions matter, by actual user share?"
- "Can we get release-like builds from CI, and who signs them?"
- "Do screens have `testID` and accessibility labels?"
- "Does the app depend on permissions, deep links, push or offline behaviour that users hit on day one?"

## Existing-suite additions

- "When did you last trust a green run? When did you last ignore a red one?"
- "How long is the pipeline, and which stage takes the time?"
- "What do you do when a test is flaky today?"
- "Which tests would you delete tomorrow if you could?"

## Signals you have enough

You can describe, in their words, what is under test and why it matters; you can name the constraints that force the architecture and the decisions they want to make themselves; you know what a good first milestone looks like to them; and the remaining unknowns are ones a builder could settle. Then play it back and size the work.
