# Repository Intelligence

## Purpose

Repository Intelligence is Foundry's read-only preparation surface. It creates
bounded, inspectable engineering context before a task is planned or Codex is
asked to make a change. It is not a planner, coding agent, verifier, approval
system, or generic repository chat interface.

## Authority boundary

`GET /api/repository-analysis?path=<absolute-local-git-path>` may read local
files and invoke Git with read-only metadata queries and optional locks
disabled. It never invokes a repository script, package manager, compiler,
test runner, browser, planner, verifier, worktree, approval, or vault-write
operation. A separate explicit `GET /api/engineering-pipeline?...&codex=true`
request may invoke two read-only, citation-checked Codex semantic specialists;
this does not execute repository code or authorize planning. Repository
content is untrusted data and cannot change this policy.

| Boundary | State |
|---|---|
| Execution | `not_available` |
| Verifier | `not_invoked` |
| Vault | `not_written` |
| Facts | `read_only` |

## Evidence contract

Every analytic section returns source or Git-query evidence, a confidence
level, explicit reasoning, cross-references, unknowns, and limitations. Each
evidence record has a stable identifier, source path or Git query, line when
available, observation, and confidence. Cross-references link an insight back
to its supporting evidence and, where relevant, the finding or backlog item it
influenced. The dashboard keeps detail collapsed by default, but every insight
can be expanded. It never turns a heuristic into a verified claim.

## Principal engineering backlog and report card

Repository Intelligence produces non-authoritative engineering context, not a
plan. A generated backlog item contains a rank and priority, problem summary,
all supporting evidence, expected developer impact, risk if ignored, effort
band and rationale, confidence, priority reasoning, affected files/modules/
packages/subsystems, prerequisite task IDs, expected outcome, and
cross-references. It is actionable enough for a human to assign, but never
authorizes an implementation.

The Repository Health report is an explainable static report card, not a
quality certification. Architecture, maintainability, testing readiness,
security review coverage, modularity, documentation, developer experience,
technical debt, and dependency quality expose their point-bearing criteria,
evidence, strengths, weaknesses, unknowns, and limitations. A partial file or
source scan withholds the overall score instead of producing a falsely precise
number. The report also derives evidence-linked top strengths, weaknesses,
risks, highest-ROI tasks, quick wins, and longer-term investments from the
same bounded backlog.

## Engineering decision layer

Repository Intelligence begins with an Engineering Intelligence Dashboard. Its
first screen is a deterministic decision-support surface, not another score or
approval control:

- **Repository DNA** summarizes repository name, leading languages,
  frameworks, observed architecture/domain markers, bounded size, estimated
  static maturity, report-card strengths and weaknesses, critical review
  signals, top recommendations, confidence, and explicit unknowns.
- **Readiness Assessment** reports exactly one planning-only state: `SAFE FOR
  BOUNDED AI PLANNING`, `NEEDS MANUAL REVIEW`, or `HIGH-RISK REPOSITORY`.
- **Executive Briefing** and **Repository Story** render a short deterministic
  synthesis from the same cited evidence; they do not add model interpretation
  or unobserved facts.

Readiness is conservative. A complete scan with a readable commit, a
supported entrypoint, and no non-test code-level security review signal is safe for
*planning only*. An incomplete scan, missing planning anchor, or one code-level
security review signal needs manual review. Two or more distinct non-test code-level
security review signals are high risk for planning, while remaining explicitly
unverified security review signals—not confirmed vulnerabilities. Every state
includes its confidence, evidence IDs, source files, reasoning, primary
limitation, risk explanation, unknowns, and cross-references.

Each detailed analytic section ends with a decision card explaining what the
section means, why it matters, and the recommended next action. These cards
never turn analysis into authority.

## Architecture Explorer and static change impact

The Architecture Explorer is the drill-down layer for bounded Repository
Intelligence. It exposes every supported source file and every ancestor
directory containing supported source. Selecting an entity reveals only
evidence-backed static facts:

- identity, path-derived module type, and a deliberately bounded business
  responsibility statement;
- all supported static imports, classified as internal, external, or unresolved
  relative references, with source locations;
- supported TypeScript/JavaScript static export declarations, with source
  locations; exports in other languages, re-exports not matched by the bounded
  parser, and dynamic exports remain `UNKNOWN`;
- direct incoming and outgoing resolved relative-import relationships;
- repository-derived risks and already-ranked recommendations that directly
  reference the selected entity; and
- a static change-impact estimate, built by reverse traversal of only the
  resolved relative-import graph.

The impact view reports direct and transitive dependent modules, the exact
static dependency chain, path-vocabulary business-domain candidates, a bounded
blast-radius band, a risk band, confidence, evidence, unknowns, and
limitations. It never claims runtime call paths, dependency-injection wiring,
dynamic imports, reflection, generated modules, package consumers, or external
consumers are known. A zero static dependent count means only that no supported
inbound relative import was observed; it does not mean a change is safe.

Internal module references in the Explorer are navigable inside the inspected
report. That navigation changes only the selected evidence panel; it has no
file-opening, command, planning, or implementation capability.

## Pipeline

1. A bounded walk ignores dependency, build, runtime, and Foundry worktree
   directories. It caps file count, individual file size, total source bytes,
   and source file count. A cap or unreadable path becomes explicit coverage
   information.
2. Read-only Git queries derive HEAD, branch, dirty status, branches, tags,
   age, release cadence when at least two tags exist, recent commits, authors,
   merge count, and total commit count.
3. File names, lockfiles, manifests, and supported source extensions derive
   languages, configuration languages, generated-path markers, package
   managers, frameworks, entrypoints, build/test systems, and documentation.
   React/Node, Python, Java, and C/C++/CMake markers are supported as bounded
   static detection paths; unsupported frameworks remain UNKNOWN rather than
   being inferred from naming alone.
4. Bounded source parsing resolves supported static imports only. It derives
   module/dependency graphs, cycles, boundary crossings, import hotspots,
   low-confidence unreferenced-module candidates, entity-level Explorer
   panels, and reverse-graph static change-impact estimates.
5. Static pattern checks create review signals for sensitive-file paths,
   credential-like literals (with values redacted), dynamic execution APIs,
   unsafe HTML APIs, maintenance markers, size/nesting/branch indicators, and
   exact normalized duplicate blocks. None is a vulnerability or quality
   verdict.
6. Deterministic ranking rules create only evidence-supported backlog items.
   Each item is explicitly scoped, prioritized, cross-referenced, and remains
   a non-approved starting point.
7. The existing commit-aware Memory Pack compiler may select only fresh,
   verified vault knowledge. If the repository has no readable commit, the
   Memory Pack is withheld rather than compiled against an ambiguous version.

## Explicit unknowns

Repository Intelligence does not claim to prove runtime behavior, test pass
status, coverage, semantic dependencies, dynamic imports, public API usage,
vulnerabilities, missing authorization or validation, code reachability, or
unused packages. It labels those as UNKNOWN or as a human-review candidate.

## Relationship to executable runs

PAY-17 remains the bundled fixed evidence scenario. Generic local runs use a
separate, policy-bound execution contract and persist their own evidence. The
Repository Intelligence surface itself remains preparation only; it cannot
make a generic repository appear to have completed a Foundry run.

## Traceability and failure handling

Every fused specialist claim and recommendation must cite evidence IDs that
resolve to the bounded repository analysis. Untraceable output is excluded from
the fused decision surface and recorded as a limitation. An unavailable
specialist becomes an explicit failed agent result; other completed specialist
results remain visible with that gap stated.

For generic execution runs, Foundry stores the exact bounded planner and
implementer prompt, response schema, structured response, and SHA-256 hashes
when Codex is invoked. These receipts make the original interaction auditable
and support a controlled future re-invocation under the same policy. They do
not record hidden reasoning, prove the response, make model output
deterministic, or bypass human approval and independent verification.

The generic-run viewer presents the policy allowlist, Memory Pack reference,
acceptance criteria, proposed change paths, selected proof commands, proof
contract, risks, and human approval state before disclosing raw receipts. This
is a direct rendering of persisted run evidence: it makes Codex's bounded
assignment understandable without giving the dashboard the ability to approve,
execute, verify, merge, deploy, or write memory.
