# External API and Service Strategy

## Required local-first services

| Service | MVP mode | Why |
|---|---|---|
| Git repository | Local fixture repository | Deterministic bug, diff, and worktree demo |
| Issue source | Seeded GitHub-style JSON, optional GitHub API | Keeps demo reliable while preserving real integration shape |
| Browser runner | Local Playwright browser | Proves visible checkout behavior |
| Obsidian vault | Local Markdown directory | Durable, portable engineering memory |
| OpenAI / Codex | Codex task sessions | Plans and implements the real worktree change |

## Integration rule

Every external integration must have a local, deterministic demo path. The product may show GitHub-shaped artifacts, but it must never falsely claim a remote PR or CI run occurred when it did not.

## Authentication

Keep tokens server-side, use a local `.env` ignored by version control, and provide an offline fixture mode for judges.
