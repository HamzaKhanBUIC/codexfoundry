# Three-Minute Demo Script

## 0:00–0:20 — Hook

"AI can write a patch. But when that patch is wrong, most teams lose the reasoning, the test, and the lesson. Codex Foundry turns every engineering task into verified code and reusable engineering memory."

## 0:20–0:45 — Incident and memory

Open `PAY-17`: duplicate charge after a customer retries checkout. Show the Memory Pack and its inclusion rationale: checkout architecture, idempotency ADR, relevant payment test, and prior incident.

## 0:45–1:25 — Plan and implementation

Show the proof contract. Codex creates an isolated worktree, produces a failing retry test, patches idempotency handling, and runs the test suite.

## 1:25–1:55 — Evidence

Show the proof graph: issue → architectural decision → changed files → failing-then-passing test → browser checkout verification → PR.

## 1:55–2:25 — Memory compounds

Approve the write-back. Open Obsidian to show the linked Incident, ADR, Proof, and Evaluation notes.

## 2:25–2:45 — Future regression

Show a later bad change. Foundry loads the saved evaluation and blocks it because duplicate payment behavior returns.

## 2:45–3:00 — Close

"Codex Foundry does not just fix today’s code. It leaves behind the proof and memory that make every future Codex task smarter, safer, and cheaper."
