# MCP and Tool Integrations

## MVP integrations

| Integration | Purpose | Demo requirement |
|---|---|---|
| Filesystem / Git | Repository exploration and isolated worktree | Required |
| GitHub | Issue and PR-shaped artifacts | Required; local fallback permitted |
| Browser | Checkout retry verification and screenshot | Required |
| Obsidian Vault Adapter | Read/stage Markdown engineering memory | Required |

## P1 integrations

- Obsidian plugin panel using the official TypeScript plugin and Vault APIs.
- GitHub PR creation against a public demo repository.
- CI status retrieval.

## Safety policy

Tools are capability-scoped. The implementation agent has no direct production, network-purchase, secret, merge, or deployment permissions. The browser only visits the locally running demo application.
