# Phase 2 Final Idea Definition — Codex PatchGuard

## 1. What Problem Does It Solve?

**The Pain Point:** Modern software development teams lose hundreds of hours to broken CI/CD build pipelines. When a GitHub Actions workflow fails (due to a breaking change, failing unit test, lint error, or missing dependency), developers must interrupt their flow, open the CI logs, inspect hundreds of lines of stack traces, locate the faulty code across multiple files, write a fix, and resubmit the PR.

**The Solution:** **Codex PatchGuard** is an autonomous, self-healing CI/CD remediation agent. The moment a build fails on GitHub, PatchGuard captures the failure webhook, extracts stack traces and repository context via Model Context Protocol (MCP) servers, uses GPT-5.6 Sol (Ask Mode) to plan an exact repair strategy via an `ExecPlan`, executes Codex (Code Mode) inside an isolated Git worktree to apply multi-file fixes, verifies the fix against the local test suite in a stop-and-fix loop, and automatically submits a verified Pull Request containing the full repair log and Codex Session ID.

---

## 2. Who Has This Problem?

* **Primary Persona:** Software Engineers, DevOps Engineers, and Engineering Managers working in fast-paced agile teams.
* **Pain Scale:** High urgency. Broken main/feature builds block entire teams, delay releases, and cause developer context-switching burnout.

---

## 3. Why is GPT-5.6 the Perfect Solution?

* **1-Million-Token Context & Compaction:** Ingests massive build logs, stack traces, and multi-file codebase contexts without hitting token limits or losing coherence.
* **GPT-5.6 Sol Reasoning:** Outperforms frontier models on deep architectural reasoning and root-cause analysis of complex, multi-file code failures.
* **Programmatic Tool Calling:** In-memory execution of diagnostic tools and log filters directly on the server side, drastically reducing latency.

---

## 4. Why Codex?

* **Autonomous Cloud Worktrees:** Navigates entire repositories, modifies multiple files concurrently, and generates clean, production-grade code patches.
* **Stop-and-Fix Mechanical Loops:** Runs local test harnesses to verify that generated fixes pass unit tests before opening GitHub Pull Requests.
* **Proven Verification Artifacts:** Generates official Codex Session IDs and ExecPlans proving genuine, autonomous AI engineering.

---

## Phase 2 Milestone Status: COMPLETE

With `strategy/final-idea.md` defined, Phase 2 Product Discovery is **100% Complete**. We have selected our winning idea grounded in deep research, evaluation rubrics, and the 4 core questions.
