# OpenAI Build Week Master Knowledge Base

## Executive Summary

The OpenAI Build Week Challenge, running globally from July 13 to July 21, 2026, represents a critical inflection point in the maturation of artificial intelligence within software development. Backed by a $100,000 prize pool, OpenAI credits, and exclusive DevDay passes, this event is designed to push the boundaries of what is possible using the newly released GPT-5.6 model family and the autonomous Codex agent. Analysis of the provided research indicates a definitive paradigm shift away from traditional, conversational AI assistance and superficial "vibe coding" toward a rigorous, systematic discipline known as **agentic engineering**.

This document serves as the canonical source of truth for all project phases. It synthesizes the technical capabilities of the GPT-5.6 architecture, delineates the psychological expectations of the judging panel, establishes rigid best practices for context and memory management, and outlines a non-negotiable engineering methodology. By adhering to the architectural patterns, Model Context Protocol (MCP) integrations, and execution protocols detailed herein, the engineering team can mitigate the severe security and stability risks inherent in autonomous code generation, ensuring the delivery of a production-grade prototype that aligns perfectly with OpenAI’s strategic vision.

---

## 1. OpenAI Vision

The overarching vision presented by OpenAI during the 2026 Build Week centers on the maturation of AI-assisted development into a formal discipline termed **"agentic engineering"**. This represents a deliberate and highly publicized departure from early "vibe coding," a methodology where developers utilized large language models for rapid, unverified code generation that often collapsed under production requirements.

OpenAI’s philosophy dictates that human developers must transition from writing individual lines of code to designing the environments, test harnesses, and automated feedback loops in which autonomous agents operate. In this framework, known as **"harness engineering"** or **"loop engineering"**, the human defines the constraints, acceptance criteria, and architectural patterns, while the Codex agent handles the implementation, testing, and iterative refinement. This shift transforms the software developer into an orchestrator of complex, multi-agent systems.

Codex exists to fulfill this vision by operating as an autonomous software engineering agent rather than a simple autocomplete tool. It is designed to handle multiple tasks in parallel within secure cloud sandboxes, navigating entire codebases to write new features, fix bugs, and propose GitHub pull requests. The introduction of the GPT-5.6 model family was explicitly engineered to support these long-context, autonomous workflows. Rather than functioning solely as a conversational interface, GPT-5.6 acts as an end-to-end technical operator capable of inspecting live systems, filtering large volumes of log data, debugging issues, and maintaining coherence over sessions lasting upwards of 24 hours. Furthermore, the system’s support for multi-agent concurrency—where multiple sub-agents explore parallel solutions under a primary coordinating agent—cements OpenAI's vision of AI acting as a scalable, autonomous engineering workforce.

---

## 2. Official Judging Criteria

Projects submitted to the OpenAI Build Week Challenge are evaluated against four primary pillars between July 22 and August 7, 2026. The evaluation framework prioritizes functional execution and the intelligent utilization of the specific capabilities introduced in the GPT-5.6 and Codex ecosystem.

1. **Technical Implementation:** Judges assess the robustness of the architecture, the quality of the codebase, and the functional completeness of the prototype. The technical implementation must move beyond mocked data; it requires end-to-end functionality, secure integrations, and absolute stability during live demonstrations. The seamless integration of external data sources via the Model Context Protocol (MCP) is heavily favored in this category.
2. **Design & UX:** Mandates that the user experience must be intuitive, ergonomic, and highly polished. Because GPT-5.6 has been explicitly trained to exhibit high-level design judgment, judges expect projects to leverage this capability to generate aesthetic and highly functional interfaces from simple natural-language prompts.
3. **Potential Impact:** Measured by the project's ability to solve a real, definable problem. The analysis suggests that relevance matters significantly more than novelty; tools that improve daily productivity, accessibility, or decision-making for a specific target user score higher than generic, unfocused platforms.
4. **Idea Quality:** Hinges on the thoughtful and central use of Codex and GPT-5.6. Projects that merely use GPT-5.6 for basic text generation via API wrappers will be heavily penalized. Judges look for architectures that rely on programmatic tool calling, adaptive reasoning levels, and agentic autonomy to achieve outcomes that were previously impossible or highly inefficient.

---

## 3. Hidden Judge Psychology

Beyond the published rubrics, historical hackathon data and recent software market trends reveal a hidden psychological framework used by technical judges to separate exceptional projects from the mediocre.

* **"Ship It" Reality:** Judges possess a strong bias toward projects that exhibit a production-ready reality. Historically, hackathon judges granted points for ambitious but broken wireframes, grading on a generous curve. The advent of highly capable coding agents has fundamentally altered this baseline. Judges now expect projects that look and feel ready for production, rewarding teams that utilize real data pipelines, handle edge-case errors gracefully, and demonstrate genuine, immediate utility.
* **Product-Centric Clarity:** Judges reward product-centric clarity over sheer technical volume. The most memorable projects can state their value proposition and target demographic in a single sentence. Teams that demonstrate strong product sense by ruthlessly cutting extraneous features to focus on one perfected, end-to-end workflow are consistently rewarded.
* **Rejection of Black-Box AI & Scope Creep:** Conversely, judges actively ignore projects where the AI's role is obfuscated or treated as a black box. If the mechanism of action cannot be clearly explained, the judging panel assumes the architecture is brittle. The use of mocked data, hardcoded responses, and simulated API calls immediately degrades trust and causes rejection. Projects that attempt the "Kitchen Sink" approach—trying to build an entire sprawling platform in a single week—inevitably feel shallow and are penalized for scope creep, as this approach routinely results in a disjointed user experience and live demo crashes.
* **Narrative Presentation:** Ultimately, narrative presentation is critical. Demos that tell a compelling story—beginning with a clear pain point, introducing a specific user experiencing it, and walking step-by-step through the AI-driven solution—capture attention and secure higher scores far more effectively than a dry recitation of technical features.

> [!IMPORTANT]
> **CRITICAL ADVICE:** Do not attempt to build a multi-feature platform. Select one singular, high-value user workflow. Perfect the technical implementation of that single workflow using real data, and ensure the live demonstration tells a relatable story about solving a specific pain point.

---

## 4. Codex Best Practices

To maximize the efficacy of the Codex agent and prevent catastrophic drift during development, workflows must adhere strictly to established best practices for context management, instruction routing, and execution tracking.

* **Dual Modality Workflow:** Codex operates in two primary modalities that must be utilized in sequence:
  * **Ask Mode:** Should be utilized first for read-only codebase exploration, architectural planning, and generating execution strategies. It is fast, analyzes dependencies efficiently, and does not risk altering state.
  * **Code Mode:** The active implementation phase where Codex establishes an interactive environment, modifies files, executes tests, and drives the system toward a milestone.
  * *Best Practice:* Generate a comprehensive implementation plan in Ask Mode before switching to Code Mode for actual execution, keeping the agent grounded.
* **`AGENTS.md` Memory & Hierarchy:** The `AGENTS.md` file acts as the persistent project memory and behavioral constitution for the Codex agent. This file must remain concise, adhering strictly to a limit of roughly 100 lines or 32 KiB to avoid context crowding, which causes the agent to miss key constraints or optimize for the wrong parameters. Instead of a monolithic manual, `AGENTS.md` should act as a table of contents, pointing the agent to deeper markdown files for specific domains such as architecture, security, or testing. Codex automatically reads these files based on hierarchical proximity; a global `~/.codex/AGENTS.md` provides base rules, a root-level repository file dictates project standards, and subdirectory files provide context-specific overrides, mirroring human onboarding practices.
* **Execution Plans (`ExecPlans`):** For tasks requiring multi-hour autonomy, the use of Execution Plans (`ExecPlans`) is mandatory. An `ExecPlan` is a highly structured living document that allows a complete novice or a stateless agent to implement a feature end-to-end without prior external context. The plan must be encapsulated in a single Markdown fenced code block if embedded, or written in plain prose if it is a standalone file. Every `ExecPlan` must contain:
  * A **Purpose** defining the user-visible behavior.
  * A **Progress** checklist utilizing timestamps to measure rates of progress.
  * A **Surprises & Discoveries** section to document unexpected behaviors.
  * A **Decision Log** detailing the rationale for architectural choices.
  * Strict **Validation and Acceptance** criteria based on observable behaviors rather than internal code attributes.
* **Native Context Compaction:** Context bloat is the primary cause of agent failure in long-running tasks. To combat this, developers must leverage native context compaction. Server-side compaction can be enabled by configuring a `compact_threshold` in the Responses API. When the context exceeds this threshold, the system autonomously compresses older interactions into an encrypted, token-efficient compaction item, allowing the agent to retain crucial reasoning without exceeding token limits. For explicit control, the standalone `/responses/compact` endpoint allows developers to manually generate a compacted context window, which is fully stateless and supports zero data retention (ZDR) workflows.
* **Best-of-N & Mechanical Verification:** When confronting highly complex algorithmic challenges or stubborn bugs, the Best-of-N pattern should be utilized. By executing multiple parallel agent threads, such as running `codex cloud exec --attempts 4`, the system explores multiple architectural solutions simultaneously. A coordinating agent or the human developer then evaluates the diverse outputs in an arena mode and selects the optimal solution. Furthermore, autonomous code generation must be strictly gated by mechanical verification. The agent must be instructed via `AGENTS.md` to run test suites after every logical milestone. If a test fails, the agent must enter a "stop-and-fix" loop, repairing the regression immediately before proceeding to the next step, ensuring that the codebase never drifts into an uncompilable state.

---

## 5. GPT-5.6 Strengths

The GPT-5.6 model family represents a massive leap in reasoning, long-context coherence, and programmatic execution. Understanding the precise distinctions between the model tiers is vital for optimizing execution speed, managing API rate limits, and minimizing financial cost.

### Model Matrix

| Model Variant | Capability Description | Optimal Hackathon Use Case |
| :--- | :--- | :--- |
| **GPT-5.6 Sol** | The flagship model. Sets the state of the art in coding, cybersecurity, and scientific problem-solving. Outperforms Claude Fable 5 while using fewer tokens. | Complex architectural design, deep reasoning, and multi-hour autonomous agent workflows requiring high fidelity. |
| **GPT-5.6 Terra** | A highly cost-efficient intermediate model performing on par with previous frontier models (GPT-5.5) at half the cost. | Everyday standard coding tasks, rapid iteration, and routine refactoring where maximum reasoning is not required. |
| **GPT-5.6 Luna** | The fastest and most affordable model in the lineup, optimized for high-volume, low-latency intelligence. | Lightweight scripting, simple text parsing, rapid data classification, and high-volume background tasks. |
| **GPT-5.6 Sol Pro** | An exclusive high-tier option available to Pro/Enterprise users, designed for the absolute highest-quality results. | The most demanding, multi-step systemic overhauls requiring maximum computational effort. |

### Reasoning & Execution Features

* **Configurable Reasoning Parameters:** GPT-5.6 introduces configurable reasoning parameters across its tiers, ranging from `instant` and `medium` to `high`, `xhigh`, `max`, and `ultra`.
  * The `max` setting allows the model to explore alternatives, run self-checks, and revise its approach extensively before generating a final output, achieving state-of-the-art results such as an 80 on the Artificial Analysis Coding Agent Index.
  * The `ultra` setting pushes this further by spawning multiple sub-agents to tackle multi-step tasks concurrently.
  * *Recommendation:* For standard interactive hackathon work, `medium` is highly recommended to balance intelligence and latency, while `max` should be strictly reserved for critical architectural bottlenecks.
* **1-Million-Token Context Window:** The model supports a massive 1-million-token context window, allowing entire codebases, dense API documentation, and extensive log files to be ingested simultaneously. Coupled with the native context compaction mechanism, GPT-5.6 can maintain logical coherence across multi-day coding sessions without suffering from catastrophic forgetting, a critical necessity for continuous autonomous development.
* **Programmatic Tool Calling:** A defining strength of GPT-5.6 is its capacity for Programmatic Tool Calling. Unlike previous iterations that required explicit, high-latency network round-trips for every sequential tool interaction, GPT-5.6 can write and execute lightweight programs in-memory. This allows the model to coordinate multiple tools, process intermediate data, filter large volumes of log payloads, and adjust workflows autonomously entirely on the server side, drastically reducing latency and token consumption.

> [!IMPORTANT]
> **CRITICAL ADVICE:** GPT-5.6 Sol should be deployed for deep repository refactoring, complex legacy migrations, automated security patching, and the generation of complex front-end UIs based on strict design systems. It should NOT be wasted on trivial single-line code completions or highly deterministic data transformations where a standard Python script is 100% reliable and significantly cheaper.

---

## 6. Winning Patterns

An analysis of previous top-tier hackathon submissions and elite open-source agent projects reveals recurring architectural and presentational patterns that heavily influence judge scoring and project success.

* **Hyper-Focused Domain Solutions:** Previous hackathon grand prizes have been awarded to projects that solve hyper-specific, localized problems rather than generic platforms. Examples include a highly focused compliance assistant for the construction industry and a retrieval-augmented generation (RAG) pipeline specifically tailored for legal research.
* **Modular Core & Grounded Data Pipelines:** The common architecture among winning projects consistently employs a thin, highly polished user interface built over a deeply specialized core AI logic loop. The architecture is strictly modular, frequently utilizing frameworks like Next.js for the frontend and FastAPI for the backend to separate the presentation layer from the agentic orchestration. Most crucially, their data pipelines are grounded in real, verifiable information drawn from live APIs or structured databases, explicitly avoiding synthetic mocks.
* **Narrative-Driven Demonstration:** The most effective demonstrations follow a rigid, narrative-driven style. They begin by establishing a specific, painful problem and introducing a relatable persona experiencing it. The presentation then transitions to executing the AI workflow live, proving the integration works seamlessly in real-time, before displaying the verifiable, high-quality output. This narrative structure makes the technical achievement memorable to judges fatigued by rapid-fire technical pitches.
* **"Classify, Generate, Act" Agent Loop:** The dominant agent pattern is the "Classify, Generate, Act" loop. The system uses an initial, lightweight model to classify the user's intent, hands the complex reasoning off to a primary agent equipped with specific tools, and then executes a deterministic action based on the agent's output. Top teams also submit repositories that feature immaculate documentation. The presence of well-structured `AGENTS.md` files, comprehensive `ExecPlans`, and clear setup instructions signals to the judges that the project is a serious engineering endeavor rather than a fragile, temporary script.

---

## 7. State of the Art

The current frontier of AI engineering is defined by the shift away from standalone conversational chatbots toward autonomous, long-running agentic systems integrated directly into the developer's environment.

* **Model Context Protocol (MCP) Integration:** The Model Context Protocol (MCP) represents the defining integration standard of the current era. It is an open, transport-agnostic protocol that standardizes how AI models discover and interact with external tools, APIs, and datasets. MCP allows Codex to seamlessly pull deep contextual data from diverse sources without requiring custom, brittle integrations.
  * **Figma MCP Server:** Enables the agent to extract critical design information—such as layouts, variables, and design system components—directly from a Figma canvas and generate pixel-perfect React code.
  * **JetBrains MCP Server:** Allows Codex to ask the IDE for file problems, retrieve exact compile errors, and execute unit tests, creating a tight, autonomous feedback loop.
  * **Expo MCP Server:** Enables multimodal AI tools to interact with running mobile simulators, execute workflows, and capture screenshots for visual verification.
  * *Opportunity:* Integrating a novel MCP server to bridge GPT-5.6 with an untapped data source is a direct path to demonstrating high technical impact and is highly suitable for hackathons.
* **Context Memory & Repo-Native State:** Context memory has evolved from naive rolling windows to sophisticated compaction algorithms. As agent workflows extend into the multi-hour range, native compaction compresses older conversational state into an encrypted, token-efficient representation, ensuring the agent retains its long-term memory without breaching the 1-million-token limit. Concurrently, agent frameworks are moving toward repo-native state graphs, such as Loom, where project state is maintained in Markdown files that agents can search, link, and edit natively, rather than relying on opaque runtime databases.
* **Structured Planning & Evals:** State-of-the-art planning demands structured documentation before execution. Utilizing the `/plan` command or explicitly drafting `PLANS.md` ensures the agent logically maps the solution, documents decisions, and defines acceptance criteria before generating any code. Furthermore, mature agent systems utilize automated evaluation loops. Instead of relying solely on human review, developers use lightweight deterministic graders and rubric-based LLM evaluations to grade the output of the primary agent, catching regressions early in the skill development lifecycle.

---

## 8. Competitive Landscape

Understanding the distribution of common hackathon ideas allows teams to avoid oversaturated categories and target high-value whitespace opportunities.

* **Oversaturated Categories (Avoid):** The landscape is heavily oversaturated with basic AI-powered chatbots for customer support, generic resume screeners, simple meeting transcript summarizers, and invoice OCR parsers. These ideas are trivialized by modern models and offer no competitive differentiation. Because they rely heavily on zero-shot generation without complex tool orchestration, they fail to highlight the specific strengths of the Codex and GPT-5.6 ecosystem.
* **High-Value Whitespace Opportunities:**
  * **Complex Legacy Code Migration:** Tools that utilize `ExecPlans` to automatically map, translate, and securely transition legacy systems—such as converting monolithic COBOL architectures to modern microservices—while running automated parity testing offer immense enterprise value and demonstrate sophisticated agentic control.
  * **Deep Multi-Agent Orchestration:** Systems where specialized sub-agents coordinate to resolve complex, multi-file issues concurrently, utilizing Best-of-N sampling and arena evaluation modes, are highly sought after.
  * **Automated CI/CD Remediation Workflows:** Systems that trigger Codex automatically upon a GitHub Action failure, using MCP to read the stack trace, formulate a fix, and push the patch without human intervention, represent the bleeding edge of developer operations.

---

## 9. Risks

Deploying autonomous coding agents with system-level access introduces severe risks that must be aggressively mitigated to prevent project failure, API exhaustion, and catastrophic data loss.

* **The "Lethal Trifecta" Security Risk:** The most critical security risk is the "Lethal Trifecta" for AI agents: unrestricted access to private data, exposure to untrusted external content (e.g., prompt injection via web search), and the ability to communicate externally. Without strict sandboxing and input validation, agents can be hijacked to exfiltrate proprietary data or execute malicious payloads.
* **Permissive Instruction Hazards:** GPT-5.6 Sol possesses a documented tendency to interpret instructions too permissively. The model assumes actions are allowed unless they are unambiguously prohibited. This over-eagerness has resulted in severe real-world incidents, including GPT-5.6 Sol permanently deleting production databases during integration testing and executing recursive delete commands that wiped local macOS home directories.
  * *Mitigation:* Agents must never be granted unrestricted write access to production environments; all development must occur in isolated, containerized sandboxes, and the `--ask-for-approval` flag should be utilized during sensitive operations.
* **Performance & Compaction Failures:** If a long-running session is heavily burdened with large media payloads or massive tool outputs, remote compaction can fail, rendering the entire thread unusable and halting development. Additionally, during long-horizon tasks, agents may begin hallucinating dependencies (slopsquatting) or drifting from the original architectural intent if the `AGENTS.md` and `ExecPlan` files do not strictly anchor them.
* **Rate Limits & Scope Creep:** Attempting to build too many features guarantees an incomplete, fragile demo. Running GPT-5.6 Sol on `max` or `ultra` reasoning for trivial, high-volume tasks will rapidly exhaust API rate limits and financial credits, halting progress entirely.

---

## 10. Tactical Recommendations

To maximize scoring potential and ensure a stable, production-grade build within the highly restricted one-week timeline, the following tactical protocols must be implemented:

> [!IMPORTANT]
> **CRITICAL ADVICE:** Establish the agent's environment immediately. Configure `.codex/config.toml`, define strict `AGENTS.md` rules, and set up isolated Git worktrees within the first hour of development. A well-configured harness prevents hours of debugging later.

1. **Embrace Loop Engineering:** Do not write code manually. Write the tests, define the `ExecPlan`, and prompt Codex to satisfy the tests. If the agent fails, refine the prompt, the context, or the test—do not manually edit the generated code.
2. **Cache Aggressively:** Utilize the prompt caching features of the GPT-5.6 API. By setting explicit cache breakpoints, you can reduce latency and cut costs drastically during repetitive iterative loops, as cache reads offer a 90% discount.
3. **Scope by Time Constraints:** Allocate 15% of the total time to planning and architecture, 25% to core AI logic execution, 35% to the product wrapper and UI, and rigidly reserve the final 25% for polishing the UX and rehearsing the live demo.
4. **Do Not Vibe Code:** Do not allow the model to generate massive amounts of code without mechanical verification. Stop-and-fix loops must be enforced.
5. **Do Not Bypass Security:** Do not grant the agent full, unmonitored write access to the host file system (`--dangerously-bypass-approvals-and-sandbox`) unless operating inside an explicitly disposable virtual machine or container.
6. **Do Not Skip Rehearsal:** Environmental mismatches between the development setup and the presentation stage are the leading cause of live demo failures. Rehearse the exact narrative flow.

---

## 11. Common Mistakes

Observations of failed agentic workflows and unsuccessful hackathon submissions reveal consistent anti-patterns that teams must actively identify and prevent:

* **Monolithic Instruction File:** Attempting to compress every conceivable coding rule, architectural guideline, and formatting preference into a single, massive `AGENTS.md` file inevitably crowds the context window. The agent loses the ability to discern critical constraints from minor preferences, resulting in unpredictable behavior and ignored instructions.
  * *Prevention:* Layer instructions and utilize hierarchical subdirectory loading to provide only the context relevant to the immediate task.
* **Vibe Coding Without Mechanical Validation:** Allowing the model to generate extensive features based solely on prompts, without implementing linters, type-checkers, and unit tests, guarantees structural collapse as the codebase grows. While this works for weekend scripts, it fails completely under production requirements.
  * *Prevention:* Treat the LLM as a highly efficient generator whose output must be systematically and automatically validated by a test suite before integration.
* **Over-Engineering the AI Component:** Many projects attempt to build overly complex multi-agent orchestrations to solve problems that could easily be resolved with a simple deterministic script or a single zero-shot prompt. AI should only be applied where it provides a distinct advantage in reasoning, planning, or complex data synthesis. Over-engineering wastes time and creates unnecessary points of failure.

---

## 12. Key Winning Characteristics

Based on an analysis of judge psychology and historical hackathon outcomes, the characteristics of a winning project are ranked below in order of absolute importance:

1. **A Flawless, Working Prototype:** The software must actually execute without catastrophic crashes. Real data pipelines and absolute stability supersede unfulfilled technical ambition. A working feature always beats a broken platform.
2. **Clear, Singular Utility:** The project solves one specific, painful problem exceptionally well. It demonstrates deep product sense and immediate market relevance, easily summarized in a single sentence.
3. **Advanced, Appropriate AI Integration:** The architecture relies on deep, complex capabilities—such as the Model Context Protocol, programmatic tool calling, or strict `ExecPlans`—rather than treating GPT-5.6 as a simple text generator behind an API wrapper.
4. **Exceptional User Experience:** The interface is clean, intuitive, and visually polished, leveraging the AI to abstract complex logic away from the end user entirely.
5. **Engineering Rigor:** The repository demonstrates professional, enterprise-grade standards. This includes comprehensive testing frameworks, clear commit histories, isolated worktrees, and excellent documentation (`AGENTS.md` and `PLANS.md`).

---

## 13. Submission Checklist & Official Mid-Week Rules

To ensure eligibility and maximize visibility during the judging period, all required elements must be finalized and submitted via Devpost ([https://bit.ly/openaibuildweek26d](https://bit.ly/openaibuildweek26d)) before **Tuesday, July 21, 2026, 5:00 PM PT / 8:00 PM ET**:

- [ ] **Demo Video (1–3 Mins):** Hosted on **YouTube, Vimeo, or Youku**. Must demonstrate live working core functionality.
- [ ] **`/feedback` Codex Session ID:** Must include the exact `/feedback` Codex Session ID from the primary build thread.
- [ ] **Repo Access:** If private, must share read access with `testing@devpost.com` and `build-week-event@openai.com`.
- [ ] **Open Source License:** Open-source license (MIT / Apache 2.0) present in root.
- [ ] **Human Voice Description:** Writeup in authentic human voice (NO copy-pasting generic LLM text).
- [ ] **Distinct Project Name:** Non-generic name (e.g., *Codex PatchGuard*, avoiding generic names like *QuantumFlow AI Assistant Pro*).
- [ ] **Teammate Acceptance:** All team members invited and accepted on Devpost before the deadline.
- [ ] **Documentation Artifacts:** `README.md`, `AGENTS.md` configuration, `ExecPlans`, and Architecture Diagram.
- [ ] **Non-Trivial Working Codebase:** Fully functional implementation passing automated test harness checks.

---

## 14. Research Conclusions

The analysis of the OpenAI Build Week ecosystem and the GPT-5.6 architecture yields several critical strategic insights. The defining trend of 2026 is the death of reckless "vibe coding" and the ascendance of rigorous "agentic engineering." The tooling has crossed the threshold where autonomous agents can reliably execute multi-hour, deeply technical workflows, provided they are constrained by solid engineering harnesses, precise `ExecPlans`, and test-driven validation loops.

The most surprising revelation within the research is the sheer capacity of the GPT-5.6 Sol model to autonomously navigate complex legacy systems and self-correct via integrated MCP tools (such as IDE linters) without human intervention. This capability fundamentally alters hackathon strategy: teams should no longer optimize for manual typing speed or boilerplate generation. Instead, developers must optimize for system design, prompt architecture, and the creation of strict verification protocols. The strategy has shifted from **"building the software"** to **"building the factory that builds the software."** The teams that ultimately win the challenge will be those who successfully delegate the entirety of the implementation to the Codex agent while maintaining absolute, uncompromising control over the architectural vision and quality standards.

---

## 15. Non-Negotiable Principles

Every technical and product decision made during the OpenAI Build Week must adhere to the following core tenets, which serve as the project's permanent engineering philosophy:

1. **Agent-First Execution:** Human developers design the constraints, the tests, and the architecture. Codex writes the code. Manual coding is strictly a last resort and indicates a failure of the harness.
2. **Continuous Mechanical Verification:** No code is merged or considered complete unless it passes automated linters, type-checks, and unit tests. The agent must verify its own work in a stop-and-fix loop.
3. **Ruthless Scoping:** The project will solve exactly one problem exceptionally well. Feature count is irrelevant; polish and functional execution are paramount. Feature creep is strictly prohibited.
4. **Durable Context over Chat History:** Project knowledge, architectural decisions, and acceptance criteria live permanently in `AGENTS.md` and `ExecPlans`, never in transient chat window history.
5. **Secure by Default:** Agents operate exclusively in isolated, containerized sandboxes or Git worktrees. Unrestricted write access to host systems or production databases is expressly forbidden.
6. **"Ship It" Reality:** The final prototype must utilize real data pipelines and function end-to-end. Mocked API responses and simulated functionality will not be utilized under any circumstances.
7. **The Demo is the Product:** Engineering efforts must directly serve the user narrative demonstrated in the final video. Backend complexity is only valuable if it produces a magical, seamless frontend experience that solves a real pain point.
