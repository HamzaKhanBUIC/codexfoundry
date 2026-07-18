# Agents

## Planner Agent

Input: issue, Memory Pack, repository map.

Output: implementation plan, affected paths, proof contract, risks, and allowed commands. It cannot edit source code.

## Implementer Agent (Codex)

Input: approved plan and proof contract.

Output: worktree diff, command log, and explanation of each change. It may edit only the disposable worktree.

## Verification Agent

Input: proof contract, test outputs, browser artifacts, and diff.

Output: `verified`, `failed`, or `needs-human-review`. It cannot claim verification without command output.

## Memory Curator Agent

Input: verified evidence and approved change.

Output: proposed Incident, ADR, Proof, and Evaluation notes. It cannot write to the vault directly.

## Agent handoff contract

Every handoff is structured JSON with task ID, evidence references, confidence, permissions, and a rejection reason when applicable. Narrative agent reasoning is summarized for the UI; private chain-of-thought is neither requested nor stored.
