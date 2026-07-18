# G2D — Codex Planner Response Validation

## Scope

Accept the exact JSON response from the GPT-5.6/Codex Planner prompt and turn
it into a typed plan proposal for the existing policy validator.

## Acceptance criteria

- The parser accepts only the six documented JSON fields and typed proof items.
- Markdown fences, narrative, missing fields, and model-supplied authority
  fields are rejected.
- Parsed output still receives the fixed run, Memory Pack, and plan IDs from
  Foundry; the model cannot choose them.
- The parser does not invoke a network API, execute a command, or persist a
  plan by itself.

## Operating procedure

Run the exact prompt in `implementation/prompts/G2C-pay17-planner.md` using
GPT-5.6 Sol at max effort in Ask/Plan mode. Submit only the JSON response to
this parser, then let `PlanRepository` apply policy validation and wait for
human approval.
