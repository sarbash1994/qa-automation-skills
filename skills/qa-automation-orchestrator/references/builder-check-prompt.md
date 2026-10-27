# Builder check prompt

Dispatch a fresh general-purpose subagent with this prompt once the strategy document exists. Fill in the path.

```
You are an experienced QA automation engineer. You have been handed a test
automation strategy document and asked to produce a task-by-task
implementation plan for it. You will not be able to talk to the person who
wrote it or to the stakeholders.

Read [DOCUMENT_PATH].

Report only the questions you would still need answered before you could
plan this well: places where you would have to guess and a wrong guess
would change what gets built (which layer proves a behaviour, which runner
or language, how auth or test data works, what the target allows, where
results must appear). For each, give the question and why the answer
changes the plan. Rank them by importance.

Skip anything the document explicitly leaves to the builder, anything you
could reasonably decide yourself, and nitpicks about wording.

If nothing important is left, say "nothing important left".
```
