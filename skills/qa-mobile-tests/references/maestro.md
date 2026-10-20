# Maestro (declarative YAML flows)

> Snippets show the shape of a good setup, not a copy-paste source of truth. Option names and defaults drift between releases: confirm each one against the official page listed in `official-docs.md` for the version installed in the project before using it, and cite that page.

## When

Fast to write and run, black-box, works on React Native/Expo/Flutter/native, iOS simulator + Android emulator/devices locally, Maestro Cloud or EAS Workflows for CI. Best for smoke journeys and teams where non-engineers maintain tests; less expressive for data-driven or API-coupled checks (pair with API tests for setup/verification).

## Layout

```
.maestro/
├─ config.yaml           # workspace: flows, includeTags, executionOrder
├─ common/
│  ├─ login.yaml         # subflows
│  └─ dismiss-onboarding.yaml
├─ smoke/
│  ├─ login.yaml
│  └─ create-note.yaml
└─ regression/...
```

## Flow

```yaml
appId: com.example.app
name: Create a note
tags: [smoke, android, ios]
env:
  EMAIL: ${EMAIL}            # from --env or CI
---
- launchApp:
    clearState: true
    permissions: { notifications: allow }
- runFlow: ../common/login.yaml
- tapOn:
    id: "todo-input"
- inputText: "Buy milk ${TIMESTAMP}"
- tapOn:
    id: "add-todo-button"
- extendedWaitUntil:
    visible: "Buy milk ${TIMESTAMP}"
    timeout: 10000
- assertVisible:
    id: "todo-item"
    text: "Buy milk.*"
- takeScreenshot: create-note-done
```

Selectors: `id` (testID / resource-id / accessibilityIdentifier) first; text with regex second; `index` only with a comment. Waits: Maestro auto-waits; use `extendedWaitUntil` for network-bound states, never `waitForAnimationToEnd` loops without a timeout. Parameterise with `env` and `runFlow` with `env` overrides; keep secrets out of YAML (`--env EMAIL=... PASSWORD=...` from CI secrets).

## Running

```bash
maestro test .maestro/smoke --include-tags smoke --format junit --output results.xml --test-output-dir artifacts
maestro test .maestro --shard-split 2        # across connected devices
maestro cloud --api-key "$MAESTRO_CLOUD_API_KEY" --project-id "$PROJECT" --app-file app.apk --flows .maestro/smoke
```

Expo: EAS Workflows has a `maestro` job that builds and runs flows on cloud simulators; otherwise build with EAS (`eas build -p android --profile preview`) and run `maestro test` against the artefact. `maestro studio` for interactive selector discovery.

## Patterns

- One flow per journey; `runFlow` subflows for login, onboarding dismissal, permission handling.
- Verify business outcomes through the app's own screens, and when the backend matters add an API assertion in the surrounding CI step (curl + jq) or keep that check in the API suite.
- Data uniqueness via `${TIMESTAMP}`/`${RANDOM}` in text so repeated runs do not collide.
- JUnit output into the same report pipeline as other layers; screenshots on failure are automatic in the debug output directory.
- Tag flows by platform and tier; run smoke on every build, regression nightly.
