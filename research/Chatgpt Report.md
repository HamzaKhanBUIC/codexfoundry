# Executive Summary  
OpenAI’s vision for AI-driven software engineering centers on **agentic, multi-step workflows** where Codex (GPT-5.3 and beyond) operates autonomously across long-horizon tasks. The ideal winning project will **embody that vision**: it should leverage Codex and GPT-5.6 deeply (not as a throwaway ingredient) to solve a real, high-impact problem. Judges will explicitly score *technical implementation, design/UX, impact,* and *idea quality*, and they “strongly reward thoughtful use of GPT‑5.6 and Codex”.  In practice this means a **polished, fully-functional prototype** with clear demo and documentation, that transparently highlights how Codex was used (e.g. providing session IDs, code samples from agent output). Projects that stand out will go **beyond one-step chat**: they’ll show agents planning, coding, testing, and iterating to completion.  

By analyzing OpenAI’s official guidance and past AI hackathon winners, we find recurring success patterns: *multi-agent orchestration*, domain-specific tool integration, memory/context handling, and complete end-to-end flows. Recent winners (e.g. an autonomous research agent, NVIDIA’s logistics and travel assistants) all feature multi-step pipelines and user-centric design. In contrast, *generic chatbots or single-feature demos* have little chance. The **state of the art** now includes agent frameworks (LangChain, CrewAI, etc.), LLM memory/RAG systems, and long-context models (GPT-5.6’s compaction). Many are mature enough to prototype, but require careful design (e.g. context curation).  

**Strategic insights:** Judges want evidence that the team truly **“built with Codex”** – not just slapped an LLM on a trivial app. High-probability winners will align with OpenAI’s goals (showing why we built Codex) by tackling substantial dev challenges, using Codex to accelerate or automate real engineering work. They will prioritize clarity and polish: a succinct 2–3 minute demo that clearly narrates the problem, approach, and Codex’s role is more important than breadth. Small, complete projects typically outperform overambitious ones. **Tactically**, teams should follow OpenAI’s Codex best practices: plan tasks in *Ask Mode*, switch to *Code Mode* for implementation, use an `AGENTS.md` for context, and iterate with “best-of-N” sampling. They should build automated tests and CI (to catch hallucinations), structure the repo around incremental agent tasks, and record rigorous logging (including the required Codex session IDs) to prove genuine Codex usage. Common pitfalls include neglecting the submission requirements (missing video or code), forgetting to include Codex interaction proofs (e.g. the `/feedback` session ID), or delivering an incomplete core feature.  

Overall, the **highest-probability winner** will be a *high-impact, user-friendly system* built with a rich agentic architecture: one that clearly **demonstrates Codex’s unique strengths** (long-context reasoning, autonomous code generation and editing, multi-agent planning) on a problem that matters. Such a project would exemplify “exactly why we built Codex,” earning praise from judges and possibly a keynote spot.  

## OpenAI Engineering Playbook  

**Vision & Philosophy:** OpenAI treats Codex as a *coding agent platform*, not just a completion engine. Codex is “designed for multi-agent workflows” with built-in worktrees and cloud environments to let agents work in parallel “completing weeks of work in days”. The product philosophy emphasizes **raising engineering quality and speed**: Codex should help “build features, refactor, migrate codebases” thoroughly, including design, testing, and code review. Technically, GPT-5.6 (the backbone of Codex) offers **“multi-hour reasoning”** and “multi-agent” operation, enabling delegation of long-horizon tasks. OpenAI’s own data shows workers moving from quick chat queries to hours-long Codex sessions, and all departments (even non-technical) now use Codex as their primary tool. Codex’s strength is not in occasional suggestions but in driving substantive chunks of work with autonomy and tool use.  

**AI Agent Philosophy:** OpenAI defines *agents* as LLM-powered systems that manage workflows end-to-end. Agents use tools and can “recognize when a workflow is complete” or adapt if they fail. The ideal Codex scenario is exactly this: a swarm of specialized agents (planners, coders, testers, etc.) coordinating with shared memory. Agents are not simple chatbots but *“digital team members”* each with roles and context. OpenAI’s practical guides and internal blog emphasize use cases where agents solve tasks that traditional automation can’t handle (complex decision-making, rule-system maintenance, unstructured data). 

**OpenAI’s Codex Workflows:** Through interviews and docs, OpenAI recommends workflows that mirror how engineers work. For large tasks, start with **“Ask Mode”** (a natural-language plan) before switching to **“Code Mode”** for implementation. Prompts should be structured like a GitHub issue or task description. Persistent context is provided via an `AGENTS.md` file that the agent reads as if it were documentation. Teams are advised to *“task-decompose”* complex features into smaller tasks (each can be one agent’s job) and to use “Best-of-N” sampling to select the best code output. For example, after generating code, rerun the agent with a high autonomy setting to let it refine or fix errors. OpenAI’s own codex-cli harness (on GitHub) and example prompts serve as templates. 

**Best Practices:** Key tactics from OpenAI docs include:  
- **Set up environment**: Use the `start /startup-script.js` field to initialize the repo (install packages, set env vars) so the agent can run code out of the box.  
- **Context management**: Use *compaction* to let Codex handle multi-hour tasks without hitting token limits. Store codebase context in AGENTS.md or the `context/` folder as instructions for the agent.  
- **Prompt design**: Begin with the standard “Codex-Max” agent prompt, emphasizing autonomy, codebase exploration, and tool use. Remove unnecessary preambles so the agent doesn’t prematurely stop. Use instructions like “Implement feature X” (e.g. *“Implement dark mode across the app”* as shown above) rather than open-ended Q&A.  
- **Iterate and verify**: Always review Codex outputs. Use code reviews (as shown above) or automated tests. Feed results back to the agent for refinement. OpenAI suggests using linting and code-check tools (e.g. `apply_patch`, `rg` for search) to improve speed and correctness.  
- **Collaboration**: Teach Codex your project’s style via “skills” or instructions. Integrate Codex into code review by asking it to comment on diffs. Use multiple specialized agents if possible: for example, one agent might focus on writing code, another on writing tests, a third on documentation.  
- **Checkpoints and Metrics**: Periodically ask Codex to summarize progress (“What have you done?”) and estimate remaining work, keeping you in the loop. Implement guardrails (unit tests, rate limits) to avoid regressions. Use OpenAI’s evaluators or integration tests to verify functionality.  
- **Repository Organization**: Structure the repo into subfolders per agent or feature (as seen in multi-agent examples). Include an `AGENTS.md` at the root explaining the purpose of each agent and how to run them. Maintain clear commit history to show Codex-driven changes.  

In summary, OpenAI’s playbook is: **think in agents, not single prompts**. Leverage Codex’s strength in code-generation and its ability to *persist over a project*, using all available tokens and tools. Follow published guidelines on prompt style and repository setup, and prioritize quality (tests, review) because Codex expects to operate in a fully functioning codebase.

## Judge’s Mental Model  

**Explicit Criteria:** According to OpenAI, projects are judged on **(1) Technical Implementation, (2) Design & UX, (3) Potential Impact,** and **(4) Idea Quality**. The official FAQ emphasizes that *strong submissions must* clearly communicate the problem and solution, and **demonstrate “thoughtful use of GPT‑5.6 and Codex”**. In practice, this means judges will check: *Did Codex meaningfully contribute?* (e.g. by providing the required chat session ID or marked code outputs), *how polished and user-friendly is the interface*, *what real-world problem does this solve*, and *is the idea novel or creative*. Quality of idea scores novelty—projects that just rehash obvious apps (e.g. a simple chatbot without a strong twist) will score lower.

**Implicit Signals & Expectations:** Beyond the rubric, judges look for genuine **integration of Codex**. A moderator explicitly confirmed that using Codex is mandatory: teams must include the Codex session ID where the core functionality was built. As [OpenAI’s FAQ] states, they want to see that teams “really built with Codex/GPT-5.6,” not just slapped on an LLM. Thus, judges will likely inspect code for evidence of Codex-generated content (for example, large blocks of code with minimal human edits, or commit logs showing `/feedback` use). They will also reward projects that embody the spirit of agentic AI: multi-step flows, parallel agents, and tool orchestration, as opposed to one-off API calls.

Other hidden expectations include **clarity of communication**. Because judges will review hundreds of projects, a clear problem statement and concise demo (covering the Codex/GPT-5.6 role) is crucial. A community analysis notes judges prefer a *pitch-style* demo: start with *“This is the problem we solve,” then “Here’s our solution,”* and walk through a live use-case. Novelty also matters: judges will compare similar submissions. A comment from a hackathon analysis warns that a **smaller project executed cleanly** often beats a half-finished grand idea. Expect judges to reward polish in all dimensions (e.g. UX flows logically, code is well-organized and tested, demo video is professional).

**Common Mistakes / Disqualifications:**  
- **Missing Codex evidence:** Failing to submit the required ChatGPT/Codex session ID or logs is essentially disqualification.  
- **Ignoring rules:** Not meeting submission requirements (e.g. forgetting the video, demoing on unsupported platform, omitting a license in the repo) will get your team disqualified. Follow the *“What to Submit”* checklists meticulously.  
- **Scope creep:** Teams that bite off too much often deliver nothing fully working. Judges favor complete features with solid polish.  
- **Generic apps:** Projects that don’t clearly leverage Codex’s strengths (e.g. a purely frontend web app with minimal LLM use) will not stand out.  

**Beyond the Rubric:** Judges may give extra credit for: *real-world applicability* (the NVIDIA hackathon noted this as a criterion), *creative agent pipelines* (multi-agent orchestration can impress judges), and *metrics* (if you can quantify some impact or performance). Tie-breakers aren’t official, but we infer that judges will favor the project that best aligns with OpenAI’s ethos: heavy Codex use, clear problem framing, and strong execution. In summary, imagine the judges are looking for a **miniature showcase of OpenAI’s future**: an agentic system with seamless UX that solves an important problem using GPT-5.6/Codex as the engine.

## Winning Patterns Matrix  

Analysis of recent AI hackathons (2024–2026) reveals **recurring success patterns** among top projects:

- **Category & Focus:** Winning projects often fall into productivity or developer-tool domains (e.g. logistics optimization, automated code review), or high-impact personal apps (e.g. travel planning agent, scientific discovery agent). Education and creative tools also appear but are less dominant. Categories to watch: *multi-agent task solvers*, *intelligent assistants integrating APIs*, and *developer copilot tools*.  

- **Architecture:** Nearly all top projects are **multi-agent systems**. They use several specialized agents (PLM-based) working in concert, often with a central orchestrator. For example, the NVIDIA winner chained together an NLU agent, a constraint-extraction agent, and a routing optimizer. The OpenAI Hackathon winner ran parallel Codex agents with a decision layer evaluating outcomes. They heavily leverage LLMs *plus* domain-specific engines (e.g. cuOpt for optimization). This complexity is doable with frameworks like LangChain or CrewAI, which have matured recently.  

- **Complexity & Depth:** Winning projects are technically deep: they integrate multiple tools (APIs, databases, simulation environments) and handle error cases. They often include memory or retrieval components to maintain context through a user session (e.g. the travel planner saved past choices in a local DB). They may involve frontend/UI work – e.g. an interactive map or visualization (the travel agent unexpectedly had an embedded map feature) – showcasing a polished product. However, depth is carefully managed; they focus on implementing core features well, rather than feature-­creep.  

- **Novelty:** While no hackathon truly reinvents AI, winners commonly exhibit novel combinations: multi-agent orchestration applied to a fresh domain (e.g. end-to-end fleet routing, or fully-automated scientific hypothesis generation). They tend *not* to be run-of-the-mill chatbots or existing plugin clones. Unique idea + solid execution beats a generic idea with rough code.  

- **UX Quality:** Top projects prioritize an intuitive user experience. They often build a simple but clean interface (web or CLI) to demo the AI flow. For instance, the travel agent let users use plain English queries and visualized plans (with a map). Even without fancy UIs, winners make the demo very clear (often through well-commented video walkthroughs). Judges in developer-centric hackathons appreciate UI that clearly shows model output step-by-step.  

- **Team & Execution:** Most winning teams are small (1–3 people) yet skilled in integrating AI with other tech. They spend hackathon time wisely: coding the MVP first, then layering on polish (docs, design). Anecdotally, one solo developer won an Anthropic hackathon by leveraging pre-existing skills and open-sourcing his toolkit. The key is not size but focus and prior experience with LLMs/tools.  

- **Demo Style:** Winning demos are well-scripted: they start with a concise problem statement, then show the tool in action solving a specific task step-by-step. They usually include voice-over explanations of how Codex/LLM is used. Judges often skip beyond 3 minutes, so the core functionality must be upfront and obvious. The demo code fully running on camera (or screen-captured) is mandatory.  

- **Documentation:** Their Devpost/gists include clear READMEs and architecture diagrams. Winners often share all code and specify licenses, showing confidence. They sometimes include short write-ups of technical challenges and how AI solved them, reflecting a deeper understanding.  

- **Evaluation Strategies:** Some teams go the extra mile with metrics or user tests. For instance, the LangChain case study reported *quantitative gains* (93% faster debugging) as evidence of impact. While not strictly required, any measurable improvement (time saved, accuracy) impresses judges.  

These patterns—agentic design, depth, clarity, and polish—emerge repeatedly. A **Winning Patterns Matrix** might look like: 

| Feature            | Observations from Winning Projects (2024–26)       |
|--------------------|----------------------------------------------------|
| **Multi-agent**    | Parallel LLM agents (planning, coding, QA) |
| **Tool Integration**| Uses domain-specific APIs (optimization, APIs) |
| **Complexity**     | Moderate-to-high: full pipeline in scope (setup, run, eval) |
| **Novelty**        | Unique combos or domains; solves real pain points (not generic chat) |
| **User Experience**| Clean interface (chat UI, web dashboard, etc.), smooth flows |
| **Documentation**  | Well-commented code, diagrams, full README, license |
| **Team/Time**      | Small focused teams (1–3 ppl); complete MVP in hackathon |
| **Demo**           | Concise (<3 min), polished video with clear narration, highlights LLM role |

## State-of-the-Art Technology Map  

The cutting edge of AI software engineering spans many interlocking domains. Key trends and maturity levels:

- **Agentic Workflows:** _Mature and action-packed._ Industry and research have moved from single-call assistants to agent orchestration. LangChain et al. describe **“agentic engineering”** as LLM-powered teams mirroring real dev teams. Early adopters report huge gains (e.g. 93% faster debugging with agents). Mature frameworks (LangChain, Autogen, OpenAI’s Agents SDK) support building such systems. **Limitation:** Designing effective agents is non-trivial; orchestration and coordination remain research topics. 
  *Hackathon suitability:* High – building simple multi-agent pipelines (e.g. planner + executor) is within reach in 1–2 weeks, especially using existing frameworks.

- **Multi-Agent Systems:** _Maturing with tools._ Related to above, multi-agent LLM systems (with memory and roles) are a current best practice. Frameworks now provide observability and state-sharing. **Limitation:** Debugging multi-agent runs can be complex, and true emergent behavior is still unpredictable.  
  *Hackathon:* Feasible with boilerplate agent frameworks. Teams should limit to a few agents with clear tasks.

- **Coding Agents:** _Rapidly advancing._ GPT-5.6 is explicitly optimized for coding: it can run as an autonomous coder for hours. Its “Codex” variant is recommended as the frontier coding model. Official guides (like codex-cli) exist. **Limitation:** Even the best models hallucinate occasionally (though GPT-5.6 has improved accuracy).  
  *Hackathon:* Very relevant – Codex is the core tool. Teams should leverage official prompts and best practices to maximize reliability.

- **Autonomous Debugging / Self-Improvement:** _Emerging research._ Some projects (notably [62]) highlight agents that not only write code but also verify and fix it. Self-improving code (agents that iteratively refine their own output) is a hot concept, but still nascent.  
  *Hackathon:* Risky to implement fully. Teams might simulate simple loops (e.g. ask agent to fix a failing test), but beware unpredictability.

- **Tool Use / Browsing:** _Mature._ Modern LLMs easily interface with tools. GPT-5.6 includes **Programmatic Tool Calling**, enabling plugins, web search, math libs, etc. Browser agents and retrieval systems (like those based on **Model Context Protocol (MCP)**) are quickly standardizing. MCP provides a secure way to connect LLMs to data sources.  
  **Limitation:** Tool integration adds complexity (API keys, error handling).  
  *Hackathon:* Achievable with existing APIs or provided SDKs. E.g. use LangChain for web search, or even embed SERP APIs. Setting up MCP-style data pipelines is too ambitious in a week, but lightweight retrieval (vector DB) is doable.

- **Memory Systems / RAG:** _Mature._ Retrieval-augmented generation (RAG) is standard. Many LLM frameworks support plugging in vector stores (FAISS, Pinecone). GPT-5.6’s compaction feature even allows multi-hour reasoning without losing context. Shared memory between agents (LangChain’s chat-memory) is well supported.  
  **Limitation:** Building a robust knowledge base is data-intensive.  
  *Hackathon:* Using embeddings for domain knowledge or storing conversation state is practical. E.g. upload a spec PDF to a vector DB for Codex to query.

- **Planning Systems:** _Maturing._ Chain-of-thought and ReAct are proven for single-session reasoning. For multi-step planning, tools like COT hints or official planning prompts exist (Agents SDK supports planning steps). Hierarchical planning (breaking tasks) is still largely manual work for developers.  
  *Hackathon:* Agents can manually implement planning by spawning subtasks or using libraries (AutoGPT scripts). Basic planner layers are within reach.

- **Long-Context Workflows:** _Emerging strength._ GPT-5.6 supports very long contexts with compaction and can remain “focused for days”. This addresses a major limitation of earlier models.  
  **Limitation:** True weeks-long context (beyond a few hours) still requires careful context-engineering or vector DB.  
  *Hackathon:* Teams can leverage GPT-5.6’s long-context features directly, but must manage tokens. Keeping prompts concise and using tools/algorithms to condense context is key.

- **Evaluation Frameworks:** _Some ecosystem support._ OpenAI’s [Evals](https://platform.openai.com/evals) and other benchmarking tools exist, but applying them in a hackathon is rare. Most teams do manual testing or simple scripts.  
  *Hackathon:* Setting up custom evals is low priority; focus on functional tests.

- **Software Verification & Security:** _Experimental._ Formal methods for LLM output are early research. However, there are practices like sanitizing inputs, limiting external calls, and using sketched guardrails.  
  *Hackathon:* Teams should do basic sanity checks (e.g. verifying API responses) but formal verification is not expected.

- **AI-Native UX / Human-in-Loop:** _Progressing._ AI-native interfaces (e.g. voice coding, code-lens suggestions) are appearing. Teams sometimes build simple UIs (chat windows, toolbars). Human feedback (fine-tuning) is possible but heavy.  
  *Hackathon:* A slick UI or interactive demo helps (see [58], [59]). Human oversight (e.g. displaying LLM thought process) can enhance trust.

- **Secure AI Systems:** _Cautiously emerging._ Concerns like prompt injection and data privacy are active research topics. MCP is one response, providing a standard for secure data connections.  
  *Hackathon:* Likely out of scope. But projects involving sensitive data should at least note security considerations.

**Summary:** Many advanced techniques (agents, RAG, multi-agent orchestration) are now **mature enough** to prototype in a week. Emerging trends like context protocols and continuous self-improvement are *interesting* but riskier. Hackathon teams should leverage established frameworks (LangChain, OpenAI Agents SDK, Codex CLI) and focus on solidifying rather than innovating these core components.

## Competitive Landscape Analysis  

With an estimated ~32,000 participants, the OpenAI Build Week will see intense competition. Based on the hackathon tracks (Apps for Life, Productivity, Dev Tools, Education) and recent AI hackathons, we predict:  

- **Top 20 Project Categories (likely oversubscribed):** Productivity assistants (meeting schedulers, email drafts, to-do managers), AI chatbots/chat assistants, code generation or review tools, educational tutors (language learning, math problem helpers), social/gaming bots, small business tools (marketing copywriter, customer support), IoT/home automation, mental health apps (mood trackers), finance planners, language translation, content creators (meme generators), legal/advice bots. Many teams will build genre‐classics, so judges may tire of *plain chatbots* or *generic task managers*. 

- **Oversaturated Ideas (to avoid):** Simple echo-chatbots, generic “X-ify your life” wrappers, toy apps that do one trivial trick with GPT (e.g. “grocery list app”), apps that don’t clearly require GPT (like a calculator). Many teams will create *novelty “just for fun”* apps (e.g. AI game NPCs) – these may be fun but risk being seen as gimmicky if not done well.  

- **Predictable/Debris Ideas:** The judges will likely have seen variations on popular prompts (story generators, poem bots) and generic Copilot-style IDE plugins. Without a clear innovative twist or domain focus, these won’t stand out. Overlap categories: digital assistants, résumé builders, diet coaches, etc. 

- **White-Space Opportunities (underserved):** There are high-impact domains with few obvious entries: **healthcare (patient-data assistants, diagnosis tools)**, **climate/environmental analysis**, **multilingual global education**, **AI-enhanced accessibility tools** (for disabilities), **scientific research assistants** (e.g. genome / drug discovery, as one NIH hackathon showed), and **enterprise automation** (e.g. consolidating cross-platform data, compliance). Also, **combining Codex with hardware or robotics** (beyond virtual agents) is rare but could wow judges. In short, niches where GPT/Codex can automate *nontrivial* reasoning on specialized data are likely underrepresented.  

- **Emerging Trends:** We expect more teams to try multi-agent pipelines and RAG than past hackathons. Another trend: leveraging multi-modal tools (vision+code) or plugging GPT into VR/AR scenarios, though risky. Also, integration of *internal organizational data* (company docs via vector DB) – corporate teams might explore this. Teams focusing on **continuous AI services** (e.g. a bot that runs in the background and responds to triggers over time) could be rare and impressive.  

- **Potential Pitfalls for the Field:** Judges may grow weary of “cookie-cutter” uses of GPT-4v or Stable Diffusion; they will reward projects where the *AI is doing something demonstrably difficult*. Repetitive ideas include chat-based tutors or trivial script generation. 

Overall, the landscape analysis suggests: **High saturation** in common, easy categories; **fatigue** around simplistic demo apps. The *best opportunities* are at the intersection of AI agents and unsolved high-value problems. Teams that identify a precise, meaningful use case (especially in business or science) and execute it with Codex will differentiate themselves.

## White-Space Opportunity Report  

**Underserved areas and high-impact gaps:**  

- **Vertical Domains:** Few teams are likely to tackle complex domains like healthcare, law, or scientific research due to data needs. However, a successful AI assistant for, say, medical literature review or legal contract analysis would stand out dramatically. Judges often remark on *real-world applicability*, so a medically-oriented Codex app (even if simplified) could be eye-catching. 

- **Global/Local Needs:** Most projects will be in English; a multi-lingual Codex tool (e.g. coding assistant that understands another language or helps local businesses in non-English countries) could be unique. Similarly, address **accessibility** – tools for users with disabilities (e.g. voice-operated coding, AI screen readers) are rare but align with OpenAI’s broad mission. 

- **Emerging Tech Trends:** Integrating Codex with IoT (e.g. controlling physical devices), or blockchain (e.g. smart contract analysis) is mostly unexplored in hackathons. Also, robust **agent training pipelines** (agents that learn over time) or plug-ins with nascent standards like MCP might be novel if doable. 

- **White-space example:** “AI version control” – a GitHub Copilot that not only writes code but automatically generates commit messages, reviews, and PR reports, tied into a CI system – few teams will do this at hackathon scale. Or an **AI business analyst** that consumes company metrics from multiple sources (via APIs or MCP-esque connectors) and generates strategies. 

- **Social Good & Open Source:** Projects addressing sustainability (e.g. analyzing climate data with an agent) or non-profits (like efficient charity resource allocation) are uncommon but high-impact. Judges often note *impact*, and these align well with OpenAI’s values.

**Summary:** The white-space lies in ambitious, domain-specialized applications that are not obvious phone apps. Think along the lines of *“AI as a tool for professionals”* rather than end-users. Judges will reward freshness and utility; going after untapped problem spaces could yield a memorable project, provided the execution is solid.  

## Codex Best Practices Guide  

To maximize Codex/GPT-5.6 effectiveness during the hackathon, teams should adopt a disciplined developer workflow infused with AI collaboration:

1. **Pre-Planning & Architecture:** Before coding, define the project’s *goal hierarchy*. Write a one-paragraph problem statement and success criteria. Break the project into subtasks (e.g. data collection, model integration, UI) and assign each to an agent. Draft these tasks as GitHub-issue style prompts (e.g. “Task: Implement feature X” with details).  

2. **Repository Setup:** Start a clean code repository with the intended language/framework. Include an `AGENTS.md` at the root detailing each agent’s role, any libraries needed, and how to run it. Use the `start /startup-script.js` field (Codex’s console) to include setup code (install dependencies, set environment variables) so the coding agent has everything pre-loaded.

3. **Environment & Tools:** Grant Codex full access to needed tools/APIs. For example, install and configure any needed linters, test runners, or specialized tools (e.g. `apply_patch` or `rg` for fast searches). Ensure external APIs have keys ready. If using multiple models or plugins, list them in `AGENTS.md`. 

4. **Prompt Design:** Always use *Ask Mode first.* For each subtask, prompt Codex with a clear, scoped request (as if raising a ticket). For example, “Implement user login with OAuth; include error handling.” Once a plan is agreed, switch to *Code Mode* to have Codex write code. Use the official **Codex-Max** prompt template (if accessible) and tailor it: it emphasizes autonomy and action. Be concise; state input conditions and expected output. 

5. **Task Decomposition:** Don’t ask Codex to do too much at once. After it writes code for a task, verify correctness and then feed the *result* back (in a new prompt) for the next step. For multi-step flows, iteratively loop: after code generation, run tests or static analysis, then prompt Codex to fix any issues. 

6. **Iterative Verification:** As Codex produces code, continuously test it. Write unit tests or sanity checks yourself, and ask Codex to pass them. For example, if Codex writes a function, immediately write a test and invoke Codex (or itself) to fix failures. This catches hallucinations or edge-case bugs early. Also, incorporate any performance or security checks (e.g. static analyzers) as part of the loop.

7. **Best-of-N Strategy:** For critical sections (complex algorithms, tricky edge cases), use the “best-of-N” approach. Generate several solutions by sampling, compare them, and choose the best. This can be automated by feeding outputs back for evaluation and re-prompting. 

8. **Context Management:** Use **Compaction** to extend effective context. Periodically summarize long conversations or code changes into a shorter prompt that Codex can carry forward. Offload completed task details to project docs or comments to keep the active prompt lean. Keep key information (requirements, API specs) in AGENTS.md or short files.

9. **Continuous Review:** Conduct regular code reviews with Codex (e.g. “Review this diff for bugs”) and with teammates. Encourage feedback loops: after major changes, pause and let Codex audit the code. This not only improves quality but generates content for your submission (screenshots of review sessions, which you can include in documentation). 

10. **Documentation:** Maintain README and code comments as you go. Prompt Codex to generate or refine documentation from code (e.g. Docstrings or markdown summaries). Strong documentation is part of judging (it shows polish).

11. **Security & Reliability:** If your app accesses real data or APIs, instruct Codex not to log sensitive info or violate use policies. Validate all inputs; for example, wrap untrusted input in sanitization prompts or filters. Outline any security considerations in your README.

12. **Final Testing and Optimization:** In the last 1–2 days, shift focus to robustness. Test the whole system end-to-end multiple times. Profile performance if needed (especially if you used GPT calls heavily). Optimize prompt lengths or reasoning mode (e.g. switch Codex to “medium” for speed if full power isn’t needed). 

13. **Demo Preparation:** Reserve ample time to produce the **3-minute demo video**. Script it like a pitch: start with the problem, then a live demo highlighting the core functionality and how Codex assisted. Show actual code execution (not just slides). Narrate clearly how Codex/GPT-5.6 was used (this reinforces to judges the thoughtful use criterion). 

Following this workflow – plan, scaffold, build iteratively, test rigorously, polish UI and docs – maximizes your chances. Teams using Codex as intended (e.g. via the open-source codex-cli example) and adhering to these practices will achieve high quality in limited time.

## Risks and Anti-Patterns  

Even well-intentioned projects can fail. Key risks and mitigations:

- **Scope Creep:** Over-ambition is the killer of hackathon projects. Trying to implement every feature or a full product suite often leads to nothing complete. *Mitigation:* Decide early on a minimal viable prototype, and execute it thoroughly. Use the 80/20 rule: focus on the 20% of features that deliver 80% of value.

- **Missing Requirements:** Not following official guidelines will get you disqualified. For example, **failure to provide the Codex session ID** is explicitly disallowed. Forgetting the 3-min video or code repo link also disqualifies. *Mitigation:* Create a submission checklist from the rules (videos, repos, IDs, license, etc.) and check off items as you proceed.

- **Poor Codex Usage (Reliability Risk):** Relying blindly on Codex can introduce bugs or nonsensical code. Codex can hallucinate variables or APIs. *Mitigation:* Always include a human-in-the-loop for critical outputs. Add automated tests or type checks wherever possible. Treat Codex outputs as drafts, not final code, unless verified.

- **Resource Constraints:** Codex/GPT-5.6 usage may hit rate limits or budget caps, especially if your project is heavy. *Mitigation:* Optimize token usage (use concise prompts, the “medium” reasoning mode if ultra is overkill). Use offline tools for heavy tasks when possible. Request credits early as per rules.

- **Demo Failure:** Crashes or bugs during the demo video are disastrous. *Mitigation:* Prepare canned fallback: if a live run fails, have a video recording of the function working. Validate the demo environment beforehand (network, dependencies, etc.). Rehearse the demo script.

- **Judging Risk – Focus Misalignment:** If the project is clever but not clearly communicated, judges may not appreciate it. *Mitigation:* Emphasize clarity. Explicitly label which parts of the demo are Codex-generated. Ensure the core novelty is obvious: avoid burying it in technical details or too fast narration.

- **Legal/Compliance Issues:** Using copyrighted data, neglecting API terms, or ignoring privacy can invalidate a project. *Mitigation:* Use only open data or APIs you have rights to. Do not include copyrighted content in demos. Clearly document data sources and licenses.

- **Team Coordination:** Miscommunication in a team can waste time. *Mitigation:* Assign clear roles (UI, backend, prompt engineering, QA). Sync early and often. Use shared coding standards.  

In short: **risk-manage** by starting small, testing often, and aligning tightly with the hackathon’s rules and judges’ expectations. Checking these anti-patterns off your list will keep the project on a winning trajectory.

## Strategic Insights  
1. **Align with OpenAI’s Vision:** The project should **embody agentic coding** – automated, multi-step problem solving. Judges will reward projects that feel like a natural extension of Codex’s purpose.  
2. **Demonstrate Deep Codex Use:** Ensure Codex is not just a novelty. It must be central to solving the problem. The winning strategy is to let Codex do the *hard parts* (e.g. writing or refactoring substantial code), showcasing capabilities like memory and multi-turn generation.  
3. **Solve a Real, Well-Defined Problem:** Incremental improvements or toy apps will be forgotten. Pick a problem judges understand and care about (e.g. improving developer productivity, education, or everyday tasks).  
4. **User-Centered Design:** A creative idea alone isn’t enough; execution (UX) matters. Even if it’s a developer tool, make it intuitive. Winning projects often surprise by turning complex tech into simple user flows.  
5. **Focus on Novelty, Not Complexity:** Novel approach in a small scope beats a half-done grand scheme. Judges noticed that **clean execution of core features** trumps incomplete ambition.  
6. **Transparency in AI Role:** Explicitly highlight how Codex/GPT-5.6 was used. Judges look for *“aha” moments* where the agent does something clever. In documentation and demo, annotate steps powered by Codex.  
7. **Quantify Impact if Possible:** If your project has measurable benefits (speedup, accuracy), present that. For example, a LangChain agentic system reported *93% faster debugging*. Hard numbers catch attention.  
8. **Multi-Agent → More Gains:** Multiple collaborating agents can multiply capabilities. A project that effectively uses even 2–3 agents will stand out versus a single-agent demo.  
9. **Leverage New Model Features:** Use GPT-5.6-specific strengths (long context, compaction, multi-agent “ultra” mode) as a selling point.  
10. **Explainability:** Although not required, giving the judges insight into the agent’s “thoughts” can impress (e.g. show chain-of-thought steps or agent logs).  
11. **Novel Domains / Underserved Users:** Tackle a domain less obvious (healthcare, climate, accessibility). Projects that align with social good can create a lasting impact impression.  
12. **Emphasize Code Quality:** Judges are software engineers at heart. Clean, maintainable code with tests can elevate a project from “cool” to “credible”.  
13. **Use Official SDKs / Examples:** Incorporate OpenAI’s codex-cli or workspace examples to avoid reinventing the wheel. This shows you’re leveraging state-of-art tooling.  
14. **Data Preparation:** If using external data, preprocess it to fit Codex well (e.g. summaries, embeddings). Well-prepared context leads to better results.  
15. **Incremental Delivery:** Build the simplest runnable feature first, then layer complexity. This allows continuous demo-able progress, which is strategic for judges who see partial demos.  
16. **Highlight Collaboration:** OpenAI values “collaboration between AI and human” – frame the project as an assistant, not a replacement. Show how Codex frees the human to focus on strategy or design.  
17. **Use Streams and Tools:** GPT-5.6 can stream responses and call tools. Using these (e.g. real-time progress updates) can make the demo dynamic.  
18. **Guardrails & Testing:** Implement basic guardrails (max retries, error handling). A robust demo (no crashes) signals maturity.  
19. **Polish Over Features:** Judges favor polish – nice UI icons, sound muted properly, code comments, etc. These fine details differentiate first vs. runner-up.  
20. **Storytelling:** The narrative of the demo matters. Craft a compelling user story around your tool. Judges remember a “wow” demo when they discuss later.  

Each insight above is backed by evidence of judges’ leanings and documented best practices.

## Tactical Recommendations  
1. **Use Ask Mode for Planning:** Prompt Codex in chat to outline steps before writing code. Example: “Outline how to implement feature X.”  
2. **Follow “GitHub issue” Prompt Structure:** Include a concise title and bullet-point instructions in prompts. This aligns with recommended style.  
3. **Employ AGENTS.md Extensively:** Document requirements, tools, and instructions in `AGENTS.md` for persistent context.  
4. **Set Up CI in the Repo:** Include simple tests or continuous integration scripts so Codex can run them. E.g., a `npm test` in a Node.js project.  
5. **Best-of-N for Critical Code:** Generate multiple variants for any crucial function (e.g. sorting algorithm) and choose the best. Use automated metrics if possible (e.g. code correctness).  
6. **Use Codex “medium” or “high” modes:** For routine tasks, “medium” reasoning is faster. Use “high” or “xhigh” for heavy reasoning per [54]. Reserve “ultra” (multi-agent) only if necessary for parallel execution.  
7. **Enable Compaction:** Activate Codex’s compaction feature early to allow long contexts. Without it, you’ll hit token limits quickly.  
8. **Leverage Code Search Tools:** In prompts, tell Codex to use tools like `rg` (ripgrep) for fast search. This speeds up context lookup.  
9. **Record All Sessions:** Save all Codex chats (session IDs), commit them to the repo, and mention them in the submission to prove compliance.  
10. **Polish the UI:** If you have a UI, use a clean framework (e.g. React, Streamlit) and ensure it won’t glitch during demo (no random resizing, placeholder text, etc.).  
11. **Prepare a Demo Script:** Write the narration and list key points you’ll cover. Time each segment to fit within 3 minutes, leaving extra for unexpected delays.  
12. **Highlight Codex’s Role:** In the video, explicitly say “Codex helped by…” or overlay text pointing out where the AI is used.  
13. **Open-Source Your Repo:** Having a public GitHub (with permissive license) looks good. It shows confidence and lets judges inspect your work easily.  
14. **Name Your Agents:** If using multiple agents, give them clear names (Planner, Coder, Tester) and mention these in docs to illustrate roles.  
15. **Automate the Demo Sequence:** If possible, write scripts to automatically run a demo scenario (so you’re not clicking random inputs live).  
16. **Backup Plan:** Have fallback screens or videos in case something crashes during your recording. Don’t rely on live typing for critical parts.  
17. **Performance Optimization:** If your app is slow, try caching data between runs, or simplifying prompts (e.g. shorter examples). Judges note lag or timeouts unfavorably.  
18. **Handle Edge Cases:** Even if briefly, show that you thought about error conditions (e.g. if user input is empty).  
19. **Collect Metrics:** Log how long Codex takes vs. baseline or success rate of queries. A quick stat can impress (e.g. “Codex solved X tasks 2× faster than manual”).  
20. **Focus on Coherence:** Ensure all parts of the demo (UI, agent outputs, code) work together logically. Disjointed components can confuse judges.  

(Citations: OpenAI’s best practices and others inform these tips.)

## Common Mistakes to Avoid  

1. **Skipping Required Codex ID:** Not including the chat session ID for Codex usage is a fatal error. Always provide evidence of your Codex runs.  
2. **No Video or Repo:** Failing to submit a working demo video or accessible code repository immediately disqualifies. The devpost explicitly requires a video and public code.  
3. **Too Broad Scope:** Trying to do “the whole kitchen sink” often leads to nothing done. Judges penalize incomplete projects. Focus tightly.  
4. **Underestimating UX/Design:** Neglecting interface clarity or usability loses points on the “design” criterion. Even a powerful agent with a clumsy UI will be seen as less polished.  
5. **Ignoring the Problem Statement:** If judges can’t easily understand *what* you’re solving, they won’t score you highly. Be explicit about the problem and solution path.  
6. **Poor Prompt Strategy:** Writing vague or overly complex prompts will confuse Codex. Stick to GitHub-issue style instructions and test prompts incrementally.  
7. **Not Testing Outputs:** Blind faith in AI can produce embarrassing bugs. Always validate outputs (unit tests, peer review). Judges will assume you did, and will notice if you didn’t.  
8. **Late/Disorganized Demo Prep:** A polished demo needs practice. Rushing it can lead to unclear audio, missed features, or going over time.  
9. **Legal Oversight:** Using non-free images, ignoring data privacy, or copying licensed code can get your team disqualified or remove points.  
10. **Neglecting Impact:** Focusing solely on tech and forgetting to explain why it matters. Judges want to see *why* someone would care about your project.  

Avoiding these pitfalls keeps judges focused on your innovation rather than flaws.

## Key Winning Characteristics (Ranked)  

1. **Genuine Codex-Centric Solution:** The project’s core functionality *depends on* Codex/GPT-5.6. Judges recognized this as a must.  
2. **Clear Problem-Solution Narrative:** A succinct framing of the user problem and how the solution addresses it (mentioned in [65]) makes the project memorable.  
3. **Demonstrated Impact:** Showing real-world applicability or improvements (e.g. efficiency gains) signals quality.  
4. **Multi-Agent Design:** Using multiple specialized agents (planning, coding, testing) reflects advanced understanding. Both OpenAI guidance and past winners emphasize this.  
5. **Robust Technical Implementation:** Fully working code with automated testing and error handling. Judges will double-click “technical implementation,” so this must impress.  
6. **Polished UX/UX:** A clean, intuitive interface (even a CLI) or frontend – e.g., the travel planner’s integrated map or the code review chat – shows professionalism.  
7. **Creativity/Novelty:** A creative twist (solving a niche problem or combining features unexpectedly) scores high under “quality of idea.”  
8. **Concise Effective Demo:** A demo video ≤3 minutes that cleanly walks through key features. It should explicitly note Codex’s contributions.  
9. **Documentation & Accessibility:** Thorough README, clear setup instructions, and public repo with license indicate maturity. Bonus if the code is open-source.  
10. **Scalability Consideration:** Even a prototype that hints at how it could scale (e.g. cloud deployment, parallel agents) suggests “future-proofing.” Judges like seeing potential beyond the hack.  

These traits have been repeatedly observed in winners. The strongest projects combine many of these characteristics into a cohesive whole.

**Sources:** This analysis is grounded in OpenAI’s official guidelines, high-quality technical blogs, and reports on recent hackathon-winning projects. Each conclusion is backed by evidence from these sources.