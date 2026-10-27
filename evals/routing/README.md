# Routing eval

Checks which skill Claude invokes first for 30 realistic requests: 21 that belong to a specific skill (including the orchestrator's fast path) and 9 near misses where none of these skills should run (TDD loop, product bug fix, lint setup, app deploy, screenshot, profiling, README, load test).

```bash
mkdir -p /tmp/routing-project && cd /tmp/routing-project && git init -q
npx skills add sarbash1994/qa-automation-skills --all          # or a local checkout path
python3 /path/to/evals/routing/run_routing.py <model-id> 2 /tmp/routing-project
```

Each query runs headless with `claude -p` in that project, `<repeats>` times. A run stops at the first Skill call, after four other tool calls, or at the end of the answer. Results land in `evals/routing/results/routing.json`, which is git-ignored. Real, billed model calls; the user's own plugins and skills are loaded too, as they would be in practice.
