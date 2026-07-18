# Problem

## The failure of today’s coding agents

Coding agents can make a patch, but teams still cannot reliably answer:

- Did the patch satisfy the original human requirement?
- What evidence proves it works across the real failure path?
- Which architectural decisions and prior incidents matter next time?
- How can a later agent avoid recreating the same regression?

The result is repeated repository exploration, expensive context loading, fragile trust, and valuable engineering knowledge trapped in issues, chat threads, and individual memory.

## Target problem

When a checkout request times out and a customer retries, an existing system can create two payments. Normal CI may remain green because no test captures retry idempotency. The team needs a fix, proof, a documented decision, and a durable regression guard.

## Non-goals

- Generic code generation or chat over a repository.
- Autonomous production deployment or merging.
- A general-purpose Obsidian knowledge-management app.
- Replacing human approval for high-risk changes.
