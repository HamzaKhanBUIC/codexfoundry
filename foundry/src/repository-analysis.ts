import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { compileMemoryPack, loadVault } from "@codex-foundry/memory";

/**
 * Repository Intelligence is intentionally a static, bounded reader.  It may
 * invoke Git's read-only metadata queries, but never invokes a repository
 * script, package manager, compiler, test runner, or model.
 */
const MAX_FILES = 1_500;
const MAX_FILE_BYTES = 1_000_000;
const MAX_SOURCE_FILES = 500;
const MAX_SOURCE_BYTES = 4_000_000;
const MAX_FINDINGS = 24;
const IGNORED_DIRECTORIES = new Set([
  ".git", "node_modules", "dist", "build", "coverage", ".next", ".nuxt", ".turbo",
  ".foundry-runtime", ".foundry-worktrees", ".codex-worktrees", ".venv", "venv", "target",
]);
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".go", ".rs", ".java", ".cs", ".rb", ".php", ".vue", ".svelte", ".c", ".cc", ".cpp", ".cxx", ".h", ".hh", ".hpp"]);
const SENSITIVE_PATH = /(^|\/)(\.env(?:\.|$)|.*\.(?:pem|key|p12|pfx)$|credentials?(?:\.|$)|secrets?(?:\.|$))/i;
const DOMAIN_PATTERNS: Record<string, RegExp> = {
  Payments: /payment|checkout|invoice|billing|charge/i,
  Authentication: /auth|login|session|oauth|password|identity/i,
  "E-commerce": /cart|catalog|product|order|checkout/i,
  Healthcare: /patient|clinical|medical|healthcare/i,
  Education: /course|student|lesson|education/i,
  CRM: /customer|lead|contact|crm/i,
  AI: /llm|model|prompt|embedding|inference/i,
  Security: /security|policy|permission|authorization|audit/i,
  Analytics: /analytics|metric|telemetry|reporting|dashboard/i,
};

export type Confidence = "high" | "medium" | "low";

export interface EvidenceReference {
  id: string;
  source: string;
  observation: string;
  line?: number;
  confidence: Confidence;
}

export interface CrossReference {
  id: string;
  kind: "evidence" | "finding" | "module" | "task";
  label: string;
  relationship: string;
}

export interface DecisionCard {
  whatThisMeans: string;
  whyItMatters: string;
  recommendedNextAction: string;
  confidence: Confidence;
  evidenceIds: string[];
  crossReferences: CrossReference[];
}

export interface AnalysisSection<T> {
  items: T;
  evidence: EvidenceReference[];
  confidence: Confidence;
  reasoning: string[];
  crossReferences: CrossReference[];
  unknowns: string[];
  limitations: string[];
  decision: DecisionCard;
}

export interface GitCommit {
  hash: string;
  author: string;
  date: string;
  subject: string;
}

export interface Finding {
  id: string;
  title: string;
  detail: string;
  confidence: Confidence;
  paths: string[];
  evidence: EvidenceReference[];
  reasoning?: string[];
  crossReferences?: CrossReference[];
}

export interface SuggestedTask {
  id: string;
  rank: number;
  priority: "P0" | "P1" | "P2" | "P3";
  title: string;
  problemSummary: string;
  evidence: EvidenceReference[];
  businessImpact: { level: "high" | "medium" | "low"; explanation: string };
  engineeringImpact: { areas: ("developer_productivity" | "reliability" | "maintainability" | "security" | "technical_debt" | "onboarding" | "architecture_quality")[]; explanation: string };
  developerProductivityImpact: { level: "high" | "medium" | "low"; explanation: string };
  expectedDeveloperImpact: { areas: ("developer_productivity" | "reliability" | "maintainability" | "security" | "technical_debt" | "onboarding" | "architecture_quality")[]; explanation: string };
  riskIfIgnored: string;
  estimatedEngineeringEffort: { size: "XS" | "Small" | "Medium" | "Large" | "Very Large"; rationale: string };
  confidence: Confidence;
  priorityReasoning: string;
  affectedRepositoryAreas: { files: string[]; modules: string[]; packages: string[]; subsystems: string[] };
  dependencies: string[];
  expectedOutcome: string;
  successCriteria: string[];
  crossReferences: CrossReference[];
}

export interface RepositoryReadinessAssessment {
  state: "safe_for_bounded_ai_planning" | "needs_manual_review" | "high_risk_repository";
  label: "SAFE FOR BOUNDED AI PLANNING" | "NEEDS MANUAL REVIEW" | "HIGH-RISK REPOSITORY";
  confidence: Confidence;
  recommendation: string;
  notRecommended: string[];
  reasoning: string[];
  evidenceIds: string[];
  supportingFiles: string[];
  unknowns: string[];
  riskExplanation: string;
  primaryLimitation: string;
  crossReferences: CrossReference[];
}

export interface RepositoryDna {
  repositoryName: string;
  primaryLanguages: string[];
  frameworks: string[];
  architectureStyles: string[];
  businessDomains: string[];
  repositorySize: { label: "Small" | "Medium" | "Large" | "Unknown"; files: number; sourceFiles: number; sourceLines: number; reasoning: string };
  estimatedMaturity: { label: "Early" | "Developing" | "Established" | "Unknown"; confidence: Confidence; reasoning: string };
  currentHealth: { overallScore: number | null; summary: string };
  strengths: string[];
  weaknesses: string[];
  criticalRisks: string[];
  valuableOpportunities: { id: string; title: string; priority: SuggestedTask["priority"] }[];
  overallConfidence: Confidence;
  unknownAreas: string[];
  readiness: RepositoryReadinessAssessment["label"];
}

export interface EngineeringDecisionSupport {
  repositoryDna: AnalysisSection<RepositoryDna>;
  readiness: AnalysisSection<RepositoryReadinessAssessment>;
  executiveBriefing: AnalysisSection<{ text: string }>;
  repositoryStory: AnalysisSection<{ text: string }>;
}

export interface ExplorerDependency {
  specifier: string;
  target: string;
  kind: "internal" | "external" | "unresolved_relative";
  evidence: EvidenceReference;
}

export interface ExplorerExport {
  name: string;
  kind: "function" | "class" | "type" | "interface" | "constant" | "default" | "named";
  sourcePath: string;
  evidence: EvidenceReference;
}

export interface ExplorerImpact {
  impactedModules: { path: string; dependencyChain: string[]; distance: number; evidence: EvidenceReference[] }[];
  impactedBusinessDomains: { name: string; confidence: Confidence; evidence: EvidenceReference[] }[];
  estimatedBlastRadius: { level: "isolated" | "contained" | "moderate" | "high"; directDependents: number; transitiveDependents: number; reasoning: string };
  riskLevel: "low" | "medium" | "high";
  confidence: Confidence;
  evidence: EvidenceReference[];
  unknowns: string[];
  limitations: string[];
}

export interface ArchitectureExplorerEntity {
  id: string;
  kind: "file" | "directory";
  path: string;
  moduleType: string;
  responsibility: { summary: string; businessDomains: string[]; confidence: Confidence; evidence: EvidenceReference[] };
  confidence: Confidence;
  imports: ExplorerDependency[];
  exportedSymbols: ExplorerExport[];
  incomingDependencies: ExplorerDependency[];
  outgoingDependencies: ExplorerDependency[];
  relatedRisks: Finding[];
  relatedRecommendations: { id: string; title: string; priority: SuggestedTask["priority"]; confidence: Confidence; reason: string; evidence: EvidenceReference[]; crossReferences: CrossReference[] }[];
  changeImpact: ExplorerImpact;
  evidence: EvidenceReference[];
  crossReferences: CrossReference[];
  unknowns: string[];
  limitations: string[];
}

export interface ArchitectureExplorer {
  entities: ArchitectureExplorerEntity[];
  totalFiles: number;
  totalDirectories: number;
}

export interface HealthCategory {
  id: string;
  category: string;
  score: number | null;
  confidence: Confidence;
  scoreExplanation: { label: string; points?: number; evidence: EvidenceReference[] }[];
  strengths: string[];
  weaknesses: string[];
  evidence: EvidenceReference[];
  crossReferences: CrossReference[];
  unknowns: string[];
  limitations: string[];
}

export interface RepositoryHealthReport {
  categories: HealthCategory[];
  overallScore: number | null;
  summary: string;
  topStrengths: string[];
  topWeaknesses: string[];
  biggestEngineeringRisks: string[];
  highestRoiImprovements: string[];
  quickWins: string[];
  longTermInvestments: string[];
}

interface PackageJson {
  name?: string;
  main?: string;
  bin?: string | Record<string, string>;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface SourceFile {
  path: string;
  size: number;
  content: string;
  lines: string[];
}

interface ScanResult {
  files: string[];
  sourceFiles: SourceFile[];
  largeFiles: string[];
  sensitiveFiles: string[];
  scanLimited: boolean;
  sourceLimited: boolean;
  unreadablePaths: string[];
}

interface InternalEdge {
  from: string;
  to: string;
  specifier: string;
  evidence: EvidenceReference;
}

export interface RepositoryAnalysis {
  mode: "repository_analysis";
  repository: {
    path: string;
    name: string;
    commit: string | null;
    dirty: boolean | null;
    activeBranch: string | null;
    branches: string[];
    tags: string[];
    recentCommits: GitCommit[];
  };
  coverage: { scannedFiles: number; sourceFilesRead: number; scanLimited: boolean; sourceLimited: boolean; unreadablePaths: string[] };
  summary: { languages: string[]; frameworks: string[]; packageManagers: string[]; testFrameworks: string[]; ciFiles: string[]; documentation: string[]; fileCount: number; scannedFiles: number; scanLimited: boolean };
  commands: { build: string[]; test: string[]; run: string[] };
  git: AnalysisSection<{ repositoryAgeDays: number | null; totalCommits: number | null; mergeCommitCount: number | null; releaseTags: string[]; releaseCadenceDays: number | null; authors: { name: string; commits: number }[]; recentCommits: GitCommit[] }>;
  languages: AnalysisSection<{ name: string; files: number; role: "primary" | "secondary" | "configuration" | "generated"; evidence: EvidenceReference[] }[]>;
  frameworks: AnalysisSection<{ name: string; evidence: EvidenceReference[]; confidence: Confidence }[]>;
  packageManagers: AnalysisSection<{ name: string; evidence: EvidenceReference[]; confidence: Confidence }[]>;
  entryPoints: AnalysisSection<{ path: string; kind: string; confidence: Confidence; evidence: EvidenceReference[] }[]>;
  dependencies: AnalysisSection<{ production: string[]; development: string[]; scripts: Record<string, string>; externalImports: string[]; unobservedDirectDependencies: string[]; hotspots: { module: string; connections: number; evidence: EvidenceReference[]; reasoning: string; crossReferences: CrossReference[] }[] }>;
  moduleGraph: AnalysisSection<{ modules: { path: string; domain: string; layer: string | null; evidence: EvidenceReference[] }[]; internalEdges: { from: string; to: string; evidence: EvidenceReference }[]; circularDependencies: string[][]; boundaries: { from: string; to: string; connections: number; evidence: EvidenceReference[] }[] }>;
  architecture: AnalysisSection<{ styles: { name: string; confidence: Confidence; evidence: EvidenceReference[] }[]; directories: string[]; riskyDirectories: string[]; generatedDirectories: string[]; largeFiles: string[] }>;
  domains: AnalysisSection<{ name: string; confidence: Confidence; evidence: EvidenceReference[] }[]>;
  buildSystem: AnalysisSection<{ scripts: Record<string, string>; toolchains: string[]; ciFiles: string[]; containerFiles: string[]; buildFiles: string[] }>;
  testSystem: AnalysisSection<{ frameworks: string[]; kinds: { name: string; files: number; evidence: EvidenceReference[] }[]; testFiles: string[]; missing: string[] }>;
  security: AnalysisSection<Finding[]>;
  codeSmells: AnalysisSection<Finding[]>;
  technicalDebt: AnalysisSection<Finding[]>;
  complexity: AnalysisSection<{ sourceFiles: number; totalLines: number; averageLinesPerFile: number; largestModules: { path: string; lines: number; complexityIndicators: number; maxNesting: number }[]; longFunctions: Finding[] }>;
  deadCode: AnalysisSection<Finding[]>;
  todos: AnalysisSection<{ tag: "TODO" | "FIXME" | "HACK" | "XXX" | "BUG" | "NOTE"; priority: "high" | "medium" | "low"; path: string; line: number; excerpt: string; evidence: EvidenceReference[] }[]>;
  duplicates: AnalysisSection<Finding[]>;
  health: AnalysisSection<RepositoryHealthReport>;
  architectureExplorer: AnalysisSection<ArchitectureExplorer>;
  decisionSupport: EngineeringDecisionSupport;
  memoryPack: {
    id: string;
    available: boolean;
    estimatedTokens: number;
    tokenBudget: number;
    confidence: number;
    selected: { id: string; title: string; reason: string; freshness: string; confidence: number }[];
    omitted: { id: string; reason: string }[];
    staleKnowledgeExcluded: boolean;
    evidence: EvidenceReference[];
    unknowns: string[];
    limitations: string[];
  };
  suggestions: SuggestedTask[];
  trust: { execution: "not_available"; verifier: "not_invoked"; vault: "not_written"; facts: "read_only"; limitation: string };
}

function normalize(value: string): string {
  return value.split(path.sep).join("/");
}

function stableIdentifier(prefix: string, value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}-${(hash >>> 0).toString(36)}`;
}

function evidenceReference(item: EvidenceReference, relationship = "Supports this conclusion."): CrossReference {
  return { id: item.id, kind: "evidence", label: `${item.source}${item.line ? `:${item.line}` : ""}`, relationship };
}

function section<T>(items: T, evidenceItems: EvidenceReference[], confidence: Confidence, unknowns: string[] = [], limitations: string[] = [], reasoning: string[] = []): AnalysisSection<T> {
  const uniqueEvidence = unique(evidenceItems.map((item) => item.id)).map((id) => evidenceItems.find((item) => item.id === id)!);
  const resolvedReasoning = reasoning.length > 0 ? reasoning : [`Derived from ${uniqueEvidence.length} bounded repository evidence item${uniqueEvidence.length === 1 ? "" : "s"}.`];
  const crossReferences = uniqueEvidence.map((item) => evidenceReference(item));
  return {
    items,
    evidence: uniqueEvidence,
    confidence,
    reasoning: resolvedReasoning,
    crossReferences,
    unknowns,
    limitations,
    decision: {
      whatThisMeans: resolvedReasoning[0] ?? "No conclusion was derived beyond the cited evidence.",
      whyItMatters: "This constrains the evidence available to later human-approved planning; it grants no authority to modify the repository.",
      recommendedNextAction: unknowns.length > 0 || limitations.length > 0 ? "Keep the stated unknowns and limitations in scope before relying on this section for bounded planning." : "Use only the cited repository facts as bounded planning context; keep verification and approval separate.",
      confidence,
      evidenceIds: uniqueEvidence.map((item) => item.id),
      crossReferences,
    },
  };
}

function evidence(source: string, observation: string, line?: number, confidence: Confidence = "high"): EvidenceReference {
  const id = stableIdentifier("EVD", `${source}\u001f${line ?? ""}\u001f${observation}`);
  return line === undefined ? { id, source, observation, confidence } : { id, source, observation, line, confidence };
}

function sourceEvidence(file: string, observation: string, line?: number, confidence: Confidence = "high"): EvidenceReference {
  return evidence(file, observation, line, confidence);
}

function enrichFindings(findings: Finding[], allFindings: Finding[]): Finding[] {
  return findings.map((finding) => {
    const related = allFindings.filter((candidate) => candidate.id !== finding.id && candidate.paths.some((path) => finding.paths.includes(path))).slice(0, 4);
    return {
      ...finding,
      reasoning: finding.reasoning ?? [finding.detail, `The finding is bounded to ${finding.paths.length} observed repository path${finding.paths.length === 1 ? "" : "s"}.`],
      crossReferences: [
        ...finding.evidence.map((item) => evidenceReference(item, "Direct supporting evidence.")),
        ...related.map((item) => ({ id: item.id, kind: "finding" as const, label: item.title, relationship: "Shares an affected repository path." })),
      ],
    };
  });
}

function confidenceForScan(scan: ScanResult): Confidence {
  return scan.scanLimited || scan.sourceLimited ? "medium" : "high";
}

function git(repository: string, args: string[]): string | undefined {
  try {
    return execFileSync("git", ["-C", repository, "--no-optional-locks", ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
    }).trim();
  } catch {
    return undefined;
  }
}

function gitLines(repository: string, args: string[]): string[] {
  return (git(repository, args) ?? "").split("\n").map((value) => value.trim()).filter(Boolean);
}

async function scanRepository(root: string): Promise<ScanResult> {
  const files: string[] = [];
  const largeFiles: string[] = [];
  const sensitiveFiles: string[] = [];
  const unreadablePaths: string[] = [];
  const queue = [root];
  let scanLimited = false;

  while (queue.length > 0 && files.length < MAX_FILES) {
    const directory = queue.shift()!;
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      unreadablePaths.push(normalize(path.relative(root, directory)) || ".");
      continue;
    }
    for (const entry of entries) {
      const full = path.join(directory, entry.name);
      const relative = normalize(path.relative(root, full));
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) queue.push(full);
        continue;
      }
      if (!entry.isFile()) continue;
      files.push(relative);
      if (SENSITIVE_PATH.test(relative)) sensitiveFiles.push(relative);
      try {
        if ((await stat(full)).size > MAX_FILE_BYTES) largeFiles.push(relative);
      } catch {
        unreadablePaths.push(relative);
      }
      if (files.length >= MAX_FILES) {
        scanLimited = queue.length > 0;
        break;
      }
    }
  }

  const sourceFiles: SourceFile[] = [];
  let sourceBytes = 0;
  let sourceLimited = false;
  for (const relative of files.sort()) {
    if (!SOURCE_EXTENSIONS.has(path.extname(relative).toLowerCase()) || SENSITIVE_PATH.test(relative)) continue;
    if (sourceFiles.length >= MAX_SOURCE_FILES) {
      sourceLimited = true;
      break;
    }
    const full = path.join(root, relative);
    let fileStat;
    try {
      fileStat = await stat(full);
    } catch {
      unreadablePaths.push(relative);
      continue;
    }
    if (fileStat.size > MAX_FILE_BYTES || sourceBytes + fileStat.size > MAX_SOURCE_BYTES) {
      sourceLimited = true;
      continue;
    }
    try {
      const content = await readFile(full, "utf8");
      sourceFiles.push({ path: relative, size: fileStat.size, content, lines: content.split(/\r?\n/) });
      sourceBytes += fileStat.size;
    } catch {
      unreadablePaths.push(relative);
    }
  }
  return { files: files.sort(), sourceFiles, largeFiles: largeFiles.sort(), sensitiveFiles: sensitiveFiles.sort(), scanLimited, sourceLimited, unreadablePaths: [...new Set(unreadablePaths)].sort() };
}

function languageName(file: string): string | undefined {
  const mapping: Record<string, string> = {
    ".ts": "TypeScript", ".tsx": "TypeScript", ".js": "JavaScript", ".jsx": "JavaScript", ".mjs": "JavaScript", ".cjs": "JavaScript",
    ".py": "Python", ".go": "Go", ".rs": "Rust", ".java": "Java", ".cs": "C#", ".rb": "Ruby", ".php": "PHP", ".vue": "Vue", ".svelte": "Svelte",
    ".c": "C", ".cc": "C++", ".cpp": "C++", ".cxx": "C++", ".h": "C/C++ header", ".hh": "C++ header", ".hpp": "C++ header",
  };
  return mapping[path.extname(file).toLowerCase()];
}

function configurationLanguage(file: string): string | undefined {
  if (/^(Dockerfile|Makefile)$/i.test(path.posix.basename(file))) return path.posix.basename(file);
  const mapping: Record<string, string> = { ".json": "JSON", ".yaml": "YAML", ".yml": "YAML", ".toml": "TOML", ".xml": "XML", ".gradle": "Gradle", ".properties": "Properties", ".tf": "Terraform" };
  return mapping[path.extname(file).toLowerCase()];
}

function fileEvidence(files: string[], observation: string): EvidenceReference[] {
  return files.slice(0, 12).map((file) => sourceEvidence(file, observation));
}

function parsePackageJson(root: string): Promise<{ manifest: PackageJson; error?: string }> {
  const manifestPath = path.join(root, "package.json");
  if (!existsSync(manifestPath)) return Promise.resolve({ manifest: {} });
  return readFile(manifestPath, "utf8")
    .then((content) => ({ manifest: JSON.parse(content) as PackageJson }))
    .catch(() => ({ manifest: {}, error: "package.json exists but could not be parsed as JSON." }));
}

async function rootText(root: string, files: string[], filename: string): Promise<string | undefined> {
  if (!files.includes(filename)) return undefined;
  try {
    const content = await readFile(path.join(root, filename), "utf8");
    return content.length <= MAX_FILE_BYTES ? content : undefined;
  } catch {
    return undefined;
  }
}

function frameworkFindings(manifest: PackageJson, rootFiles: Record<string, string | undefined>): { name: string; evidence: EvidenceReference[]; confidence: Confidence }[] {
  const packages = { ...manifest.dependencies, ...manifest.devDependencies };
  const packageFrameworks: Record<string, string> = {
    react: "React", next: "Next.js", vue: "Vue", "@angular/core": "Angular", express: "Express", fastify: "Fastify", "@nestjs/core": "NestJS",
    electron: "Electron", "@tauri-apps/api": "Tauri", vite: "Vite", webpack: "Webpack", rollup: "Rollup", jest: "Jest", vitest: "Vitest", playwright: "Playwright", cypress: "Cypress",
  };
  const findings = Object.entries(packageFrameworks)
    .filter(([name]) => packages[name] !== undefined)
    .map(([name, label]) => ({ name: label, evidence: [sourceEvidence("package.json", `Dependency '${name}' is declared.`)], confidence: "high" as Confidence }));
  if (Object.keys(manifest.scripts ?? {}).length > 0 || Object.keys(packages).length > 0) findings.push({ name: "Node.js", evidence: [sourceEvidence("package.json", "Node package manifest with scripts or dependencies is present.")], confidence: "high" });
  const textFrameworks: { label: string; source: string; pattern: RegExp }[] = [
    { label: "Laravel", source: "composer.json", pattern: /laravel\/framework/i }, { label: "Django", source: "pyproject.toml / requirements.txt", pattern: /django/i },
    { label: "Flask", source: "pyproject.toml / requirements.txt", pattern: /flask/i }, { label: "Spring", source: "pom.xml / build.gradle", pattern: /spring-boot|org\.springframework/i },
    { label: "FastAPI", source: "pyproject.toml / requirements.txt", pattern: /fastapi/i }, { label: "pytest", source: "pyproject.toml / requirements.txt", pattern: /pytest/i },
    { label: "JUnit", source: "pom.xml / build.gradle", pattern: /junit|org\.junit/i }, { label: "GoogleTest", source: "CMakeLists.txt", pattern: /googletest|gtest/i },
    { label: ".NET", source: "*.csproj", pattern: /Microsoft\.NET\.Sdk/i }, { label: "Tauri", source: "src-tauri/tauri.conf.json", pattern: /./ },
  ];
  for (const item of textFrameworks) {
    const match = Object.entries(rootFiles).find(([file, content]) => content && item.pattern.test(content) && (item.source.includes(file) || item.source === "src-tauri/tauri.conf.json"));
    if (match && !findings.some((finding) => finding.name === item.label)) findings.push({ name: item.label, evidence: [sourceEvidence(match[0], `Framework marker for ${item.label} is present.`)], confidence: "high" });
  }
  return findings.sort((left, right) => left.name.localeCompare(right.name));
}

function packageManagerFindings(files: string[]): { name: string; evidence: EvidenceReference[]; confidence: Confidence }[] {
  const markers: [string, string][] = [
    ["package-lock.json", "npm"], ["pnpm-lock.yaml", "pnpm"], ["yarn.lock", "Yarn"], ["bun.lock", "Bun"], ["bun.lockb", "Bun"], ["Cargo.lock", "Cargo"],
    ["go.mod", "Go modules"], ["composer.lock", "Composer"], ["Pipfile.lock", "Pipenv"], ["poetry.lock", "Poetry"], ["pyproject.toml", "Python packaging (pyproject)"], ["requirements.txt", "pip"], ["gradlew", "Gradle"], ["pom.xml", "Maven"],
  ];
  const findings = markers.filter(([marker]) => files.includes(marker)).map(([marker, name]) => ({ name, evidence: [sourceEvidence(marker, `Package-manager marker '${marker}' is present.`)], confidence: "high" as Confidence }));
  // A manifest alone does not prove a lockfile choice, but it is sufficient to
  // report npm as the conventional Node package-manager candidate at medium confidence.
  if (files.includes("package.json") && !findings.some((item) => item.name === "npm" || item.name === "pnpm" || item.name === "Yarn" || item.name === "Bun")) {
    findings.push({ name: "npm", evidence: [sourceEvidence("package.json", "Node package manifest is present; no lockfile identifies a different package manager.", undefined, "medium")], confidence: "medium" });
  }
  return findings;
}

function parseGitCommits(lines: string[]): GitCommit[] {
  return lines.map((line) => {
    const [hash = "", author = "Unknown", date = "Unknown", ...subject] = line.split("\u001f");
    return { hash, author, date, subject: subject.join("\u001f") };
  }).filter((commit) => commit.hash.length > 0);
}

function parseAuthors(lines: string[]): { name: string; commits: number }[] {
  return lines.slice(0, 12).map((line) => {
    const match = line.match(/^\s*(\d+)\s+(.+)$/);
    return match ? { commits: Number(match[1]), name: match[2] } : { commits: 0, name: line };
  }).filter((author) => author.commits > 0);
}

function lineAt(content: string, offset: number): number {
  return content.slice(0, offset).split(/\r?\n/).length;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function resolveInternalImport(from: string, specifier: string, paths: Set<string>): string | undefined {
  if (!specifier.startsWith(".")) return undefined;
  const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(from), specifier));
  const base = resolved.replace(/\.(?:ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|c|cc|cpp|cxx|h|hh|hpp)$/, "");
  const candidates = [resolved, base, ...[".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".go", ".rs", ".java", ".c", ".cc", ".cpp", ".cxx", ".h", ".hh", ".hpp"].map((extension) => `${base}${extension}`), ...["index.ts", "index.tsx", "index.js", "index.py"].map((index) => `${base}/${index}`)];
  return candidates.find((candidate) => paths.has(candidate));
}

function externalPackage(specifier: string): string {
  if (specifier.startsWith("@")) return specifier.split("/").slice(0, 2).join("/");
  return specifier.split("/")[0];
}

function collectSpecifiers(source: SourceFile): { specifier: string; line: number }[] {
  const matches: { specifier: string; line: number }[] = [];
  const patterns = [/(?:from\s*|import\s*|require\(\s*|import\(\s*)["']([^"']+)["']/g, /^\s*(?:from|import)\s+([A-Za-z0-9_\.]+)/gm];
  for (const pattern of patterns) {
    for (const match of source.content.matchAll(pattern)) matches.push({ specifier: match[1], line: lineAt(source.content, match.index ?? 0) });
  }
  return matches;
}

function explorerImports(source: SourceFile, paths: Set<string>): ExplorerDependency[] {
  const imports = new Map<string, ExplorerDependency>();
  for (const item of collectSpecifiers(source)) {
    const internal = resolveInternalImport(source.path, item.specifier, paths);
    const value: ExplorerDependency = internal
      ? { specifier: item.specifier, target: internal, kind: "internal", evidence: sourceEvidence(source.path, `Static import '${item.specifier}' resolves to '${internal}'.`, item.line, "medium") }
      : item.specifier.startsWith(".")
        ? { specifier: item.specifier, target: item.specifier, kind: "unresolved_relative", evidence: sourceEvidence(source.path, `Static relative import '${item.specifier}' could not be resolved by the supported static resolver.`, item.line, "low") }
        : { specifier: item.specifier, target: externalPackage(item.specifier), kind: "external", evidence: sourceEvidence(source.path, `Static external import '${item.specifier}' resolves to package '${externalPackage(item.specifier)}'.`, item.line, "medium") };
    imports.set(`${value.kind}\u001f${value.specifier}\u001f${value.evidence.line ?? 0}`, value);
  }
  return [...imports.values()].sort((left, right) => left.evidence.line! - right.evidence.line! || left.specifier.localeCompare(right.specifier));
}

function staticExports(source: SourceFile): ExplorerExport[] {
  const exports = new Map<string, ExplorerExport>();
  const add = (name: string, kind: ExplorerExport["kind"], line: number): void => {
    const value: ExplorerExport = { name, kind, sourcePath: source.path, evidence: sourceEvidence(source.path, `Supported static ${kind} export '${name}' was declared.`, line, "medium") };
    exports.set(`${kind}\u001f${name}\u001f${line}`, value);
  };
  source.lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const declaration = line.match(/^\s*export\s+(?:default\s+)?(?:async\s+)?(function|class|interface|type|const|let|var)\s+([A-Za-z_$][\w$]*)/);
    if (declaration) {
      const kind: ExplorerExport["kind"] = declaration[1] === "function" ? "function" : declaration[1] === "class" ? "class" : declaration[1] === "interface" ? "interface" : declaration[1] === "type" ? "type" : "constant";
      add(declaration[2], kind, lineNumber);
    }
    if (/^\s*export\s+default\b/.test(line) && !declaration) add("default", "default", lineNumber);
    const named = line.match(/^\s*export\s*{([^}]+)}/);
    if (named) named[1].split(",").map((value) => value.trim()).filter(Boolean).forEach((value) => add(value.replace(/\s+as\s+.+$/, ""), "named", lineNumber));
  });
  return [...exports.values()].sort((left, right) => left.sourcePath.localeCompare(right.sourcePath) || (left.evidence.line ?? 0) - (right.evidence.line ?? 0) || left.name.localeCompare(right.name));
}

function explorerDomains(paths: string[]): { name: string; confidence: Confidence; evidence: EvidenceReference[] }[] {
  return Object.entries(DOMAIN_PATTERNS).flatMap(([name, pattern]) => {
    const matches = paths.filter((candidate) => pattern.test(candidate));
    if (matches.length === 0) return [];
    return [{ name, confidence: matches.length >= 3 ? "high" as Confidence : "medium" as Confidence, evidence: fileEvidence(matches.slice(0, 6), `Path vocabulary is associated with the ${name} domain.`) }];
  });
}

function explorerModuleType(entityPath: string, kind: ArchitectureExplorerEntity["kind"], entrypointPaths: Set<string>): string {
  if (kind === "directory") return "directory";
  if (entrypointPaths.has(entityPath)) return "entrypoint";
  if (/(^|\/)(test|tests|__tests__|spec|e2e|integration|browser)(\/|$)|\.(test|spec)\.[^.]+$/i.test(entityPath)) return "test module";
  const layer = moduleLayer(entityPath);
  if (layer) return layer.replace(/s$/, "") + " module";
  if (/(^|\/)(config|configuration)\//i.test(entityPath)) return "configuration module";
  return "source module";
}

function explorerResponsibility(entityPath: string, kind: ArchitectureExplorerEntity["kind"], moduleType: string, memberCount: number, domains: { name: string; confidence: Confidence; evidence: EvidenceReference[] }[]): ArchitectureExplorerEntity["responsibility"] {
  const evidenceItems = combineEvidence([sourceEvidence(entityPath, kind === "directory" ? `Directory contains ${memberCount} scanned source module${memberCount === 1 ? "" : "s"}.` : `File was included as a ${moduleType} in the bounded static source scan.`)], ...domains.map((domain) => domain.evidence));
  const domainNames = domains.map((domain) => domain.name);
  const confidence = domainNames.length === 0 ? "low" : lowestConfidence(...domains.map((domain) => domain.confidence), "medium");
  const subject = domainNames.length > 0 ? `${domainNames.join(", ")} path vocabulary` : "UNKNOWN business domain";
  const summary = kind === "directory"
    ? `Directory grouping ${memberCount} scanned source module${memberCount === 1 ? "" : "s"}; responsibility is limited to observed ${subject}.`
    : `${moduleType} classified from its path; responsibility is limited to observed ${subject} and static relationships.`;
  return { summary, businessDomains: domainNames, confidence, evidence: evidenceItems };
}

function findCycles(edges: { from: string; to: string }[]): string[][] {
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) adjacency.set(edge.from, [...(adjacency.get(edge.from) ?? []), edge.to]);
  const state = new Map<string, "visiting" | "done">();
  const stack: string[] = [];
  const cycles: string[][] = [];
  const visit = (node: string): void => {
    if (cycles.length >= MAX_FINDINGS) return;
    if (state.get(node) === "visiting") {
      const index = stack.indexOf(node);
      if (index >= 0) cycles.push([...stack.slice(index), node]);
      return;
    }
    if (state.get(node) === "done") return;
    state.set(node, "visiting"); stack.push(node);
    for (const target of adjacency.get(node) ?? []) visit(target);
    stack.pop(); state.set(node, "done");
  };
  [...adjacency.keys()].sort().forEach(visit);
  return cycles;
}

function moduleLayer(file: string): string | null {
  const segments = file.toLowerCase().split("/");
  const layer = segments.find((segment) => ["controllers", "controller", "services", "service", "repositories", "repository", "models", "model", "views", "components", "domain", "application", "infrastructure", "utils", "lib"].includes(segment));
  return layer ?? null;
}

function entryPoints(files: string[], manifest: PackageJson): { path: string; kind: string; confidence: Confidence; evidence: EvidenceReference[] }[] {
  const entries = new Map<string, { path: string; kind: string; confidence: Confidence; evidence: EvidenceReference[] }>();
  const add = (file: string, kind: string, confidence: Confidence, itemEvidence: EvidenceReference): void => { entries.set(file, { path: file, kind, confidence, evidence: [itemEvidence] }); };
  if (typeof manifest.main === "string" && files.includes(manifest.main)) add(manifest.main, "package main", "high", sourceEvidence("package.json", `The 'main' field targets '${manifest.main}'.`));
  const bins = typeof manifest.bin === "string" ? [manifest.bin] : Object.values(manifest.bin ?? {});
  bins.filter((file) => files.includes(file)).forEach((file) => add(file, "CLI binary", "high", sourceEvidence("package.json", `The 'bin' field targets '${file}'.`)));
  files.filter((file) => /(^|\/)(main|server|app|index)\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|cs|php|c|cc|cpp|cxx)$/i.test(file)).slice(0, MAX_FINDINGS).forEach((file) => {
    if (!entries.has(file)) add(file, "conventional filename", "medium", sourceEvidence(file, "Conventional entrypoint filename."));
  });
  return [...entries.values()].sort((left, right) => left.path.localeCompare(right.path));
}

function architectureStyles(files: string[]): { name: string; confidence: Confidence; evidence: EvidenceReference[] }[] {
  const all = new Set(files.flatMap((file) => file.toLowerCase().split("/").slice(0, -1)));
  const has = (...names: string[]) => names.filter((name) => all.has(name));
  const findings: { name: string; confidence: Confidence; evidence: EvidenceReference[] }[] = [];
  const layered = has("controllers", "services", "repositories", "models");
  if (layered.length >= 2) findings.push({ name: "Layered", confidence: layered.length >= 3 ? "high" : "medium", evidence: layered.map((directory) => sourceEvidence(directory, `Directory '${directory}' supplies a named layer.`)) });
  const mvc = has("controllers", "models", "views");
  if (mvc.length >= 2) findings.push({ name: "MVC", confidence: mvc.length === 3 ? "high" : "medium", evidence: mvc.map((directory) => sourceEvidence(directory, `Directory '${directory}' is an MVC marker.`)) });
  const hexagonal = has("domain", "application", "infrastructure", "adapters");
  if (hexagonal.length >= 2) findings.push({ name: "Hexagonal / ports-and-adapters", confidence: hexagonal.length >= 3 ? "high" : "medium", evidence: hexagonal.map((directory) => sourceEvidence(directory, `Directory '${directory}' is a ports-and-adapters marker.`)) });
  const ddd = has("domain", "entities", "aggregates", "value-objects");
  if (ddd.length >= 2) findings.push({ name: "Domain-driven design markers", confidence: ddd.length >= 3 ? "high" : "medium", evidence: ddd.map((directory) => sourceEvidence(directory, `Directory '${directory}' is a DDD marker.`)) });
  const eventDriven = has("events", "consumers", "producers", "handlers");
  if (eventDriven.length >= 2) findings.push({ name: "Event-driven markers", confidence: eventDriven.length >= 3 ? "high" : "medium", evidence: eventDriven.map((directory) => sourceEvidence(directory, `Directory '${directory}' is an event-driven marker.`)) });
  const pipeline = has("pipeline", "pipelines", "stages");
  if (pipeline.length >= 1) findings.push({ name: "Pipeline markers", confidence: pipeline.length >= 2 ? "high" : "medium", evidence: pipeline.map((directory) => sourceEvidence(directory, `Directory '${directory}' is a pipeline marker.`)) });
  const plugins = has("plugins", "extensions");
  if (plugins.length >= 1) findings.push({ name: "Plugin markers", confidence: plugins.length === 2 ? "high" : "medium", evidence: plugins.map((directory) => sourceEvidence(directory, `Directory '${directory}' is a plugin marker.`)) });
  const cqrs = has("commands", "queries");
  if (cqrs.length === 2) findings.push({ name: "CQRS markers", confidence: "high", evidence: cqrs.map((directory) => sourceEvidence(directory, `Directory '${directory}' is a CQRS marker.`)) });
  const serviceNames = unique(files.filter((file) => /^services\/[^/]+\//i.test(file)).map((file) => file.split("/")[1]));
  if (serviceNames.length >= 2) findings.push({ name: "Microservice markers", confidence: "medium", evidence: serviceNames.slice(0, 6).map((service) => sourceEvidence(`services/${service}`, "Distinct service root detected.")) });
  return findings;
}

function businessDomains(files: string[]): { name: string; confidence: Confidence; evidence: EvidenceReference[] }[] {
  return Object.entries(DOMAIN_PATTERNS).flatMap(([name, pattern]) => {
    const matches = files.filter((file) => pattern.test(file)).slice(0, 6);
    return matches.length >= 2 ? [{ name, confidence: matches.length >= 3 ? "high" as Confidence : "medium" as Confidence, evidence: fileEvidence(matches, `Path name matches the ${name} domain vocabulary.`) }] : [];
  });
}

function extractTodos(sourceFiles: SourceFile[]): { tag: "TODO" | "FIXME" | "HACK" | "XXX" | "BUG" | "NOTE"; priority: "high" | "medium" | "low"; path: string; line: number; excerpt: string; evidence: EvidenceReference[] }[] {
  const marker = /\b(TODO|FIXME|HACK|XXX|BUG|NOTE)\b\s*[:\-]?\s*(.*)$/i;
  const values: { tag: "TODO" | "FIXME" | "HACK" | "XXX" | "BUG" | "NOTE"; priority: "high" | "medium" | "low"; path: string; line: number; excerpt: string; evidence: EvidenceReference[] }[] = [];
  for (const source of sourceFiles) source.lines.forEach((line, index) => {
    const match = line.match(marker);
    if (!match || values.length >= MAX_FINDINGS) return;
    const tag = match[1].toUpperCase() as "TODO" | "FIXME" | "HACK" | "XXX" | "BUG" | "NOTE";
    const priority = ["FIXME", "HACK", "BUG", "XXX"].includes(tag) ? "high" : tag === "TODO" ? "medium" : "low";
    const excerpt = match[2].replace(/[\r\n]/g, " ").replace(/[`<>]/g, "").slice(0, 140) || "Marker has no descriptive text.";
    values.push({ tag, priority, path: source.path, line: index + 1, excerpt, evidence: [sourceEvidence(source.path, `${tag} marker found; text is untrusted source content.`, index + 1)] });
  });
  return values;
}

function sourceMetrics(source: SourceFile[]): { sourceFiles: number; totalLines: number; averageLinesPerFile: number; largestModules: { path: string; lines: number; complexityIndicators: number; maxNesting: number }[]; longFunctions: Finding[] } {
  const all = source.map((file) => {
    const nesting = file.lines.reduce((max, line) => Math.max(max, Math.floor((line.match(/^\s*/)?.[0].replace(/\t/g, "  ").length ?? 0) / 2)), 0);
    const indicators = (file.content.match(/\b(if|for|while|case|catch)\b|&&|\|\||\?/g) ?? []).length;
    return { path: file.path, lines: file.lines.length, complexityIndicators: indicators, maxNesting: nesting };
  }).sort((left, right) => right.lines - left.lines || right.complexityIndicators - left.complexityIndicators || left.path.localeCompare(right.path));
  const longFunctions: Finding[] = [];
  for (const file of source) {
    let start: number | undefined; let depth = 0;
    file.lines.forEach((line, index) => {
      if (start === undefined && /\bfunction\s+\w+|(?:const|let|var)\s+\w+\s*=.*=>\s*\{/.test(line)) { start = index; depth = 0; }
      if (start !== undefined) {
        depth += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;
        if (depth <= 0 && index > start) {
          const length = index - start + 1;
          if (length > 80 && longFunctions.length < MAX_FINDINGS) longFunctions.push({ id: `long-function:${file.path}:${start + 1}`, title: "Long function candidate", detail: `A function-like block spans ${length} lines; static brace matching is heuristic.`, confidence: "medium", paths: [file.path], evidence: [sourceEvidence(file.path, `Function-like block begins here and spans ${length} lines.`, start + 1)] });
          start = undefined; depth = 0;
        }
      }
    });
  }
  const totalLines = all.reduce((total, file) => total + file.lines, 0);
  return { sourceFiles: source.length, totalLines, averageLinesPerFile: source.length === 0 ? 0 : Math.round(totalLines / source.length), largestModules: all.slice(0, 12), longFunctions };
}

function duplicateBlocks(source: SourceFile[]): Finding[] {
  const blocks = new Map<string, { path: string; line: number }[]>();
  for (const file of source) {
    const meaningful = file.lines.map((line, index) => ({ text: line.trim(), line: index + 1 })).filter((item) => item.text.length > 0 && !item.text.startsWith("//") && !item.text.startsWith("#"));
    for (let index = 0; index + 3 < meaningful.length; index += 1) {
      const text = meaningful.slice(index, index + 4).map((item) => item.text.replace(/\s+/g, " ").replace(/["'][^"']{0,64}["']/g, "<literal>").replace(/\b\d+\b/g, "<number>")).join(" ");
      if (text.length < 120) continue;
      blocks.set(text, [...(blocks.get(text) ?? []), { path: file.path, line: meaningful[index].line }]);
    }
  }
  return [...blocks.values()].filter((locations) => unique(locations.map((item) => item.path)).length >= 2).slice(0, MAX_FINDINGS).map((locations, index) => ({
    id: `duplicate:${index + 1}`, title: "Exact normalized code block is repeated", detail: `The same four-line normalized block occurs in ${unique(locations.map((item) => item.path)).length} source files.`, confidence: "medium" as Confidence,
    paths: unique(locations.map((item) => item.path)), evidence: locations.slice(0, 6).map((item) => sourceEvidence(item.path, "Normalized duplicate block starts here.", item.line)),
  }));
}

function codeSmells(metrics: ReturnType<typeof sourceMetrics>): Finding[] {
  const items: Finding[] = [];
  for (const module of metrics.largestModules) {
    if (module.lines > 350) items.push({ id: `large-module:${module.path}`, title: "Large source module", detail: `${module.path} has ${module.lines} lines.`, confidence: "high", paths: [module.path], evidence: [sourceEvidence(module.path, `Static line count is ${module.lines}.`)] });
    if (module.maxNesting >= 5) items.push({ id: `deep-nesting:${module.path}`, title: "Deep nesting indicator", detail: `${module.path} reaches estimated indentation depth ${module.maxNesting}.`, confidence: "medium", paths: [module.path], evidence: [sourceEvidence(module.path, `Maximum indentation depth is ${module.maxNesting}; indentation is only a heuristic.`)] });
    if (module.complexityIndicators > 30) items.push({ id: `complexity:${module.path}`, title: "High branch-indicator count", detail: `${module.path} contains ${module.complexityIndicators} static branch indicators.`, confidence: "medium", paths: [module.path], evidence: [sourceEvidence(module.path, "Counted if/for/while/case/catch, boolean operators, and ternaries.")] });
  }
  return items.slice(0, MAX_FINDINGS);
}

function securitySignals(source: SourceFile[], sensitiveFiles: string[]): Finding[] {
  const signals: Finding[] = sensitiveFiles.slice(0, MAX_FINDINGS).map((file) => ({ id: `sensitive-path:${file}`, title: "Sensitive configuration path present", detail: "The path was observed but its contents were intentionally not read.", confidence: "high", paths: [file], evidence: [sourceEvidence(file, "Filename matches the sensitive-file exclusion policy.")] }));
  const rules: { id: string; title: string; detail: string; pattern: RegExp }[] = [
    { id: "possible-secret", title: "Potential hard-coded credential pattern", detail: "A credential-like assignment has a non-empty literal value. The value is intentionally redacted; this is a review signal, not a confirmed secret.", pattern: /(?:api[_-]?key|secret|token|password)\s*[:=]\s*["'][^"']{8,}["']/ig },
    { id: "dynamic-execution", title: "Dynamic execution API", detail: "A dynamic execution API requires context-aware security review; this is not a vulnerability finding.", pattern: /\b(?:eval|Function)\s*\(|child_process\.(?:exec|execSync)\s*\(/g },
    { id: "unsafe-html", title: "Raw HTML rendering API", detail: "A raw HTML rendering API requires data-source review; this is not a vulnerability finding.", pattern: /dangerouslySetInnerHTML|innerHTML\s*=/g },
  ];
  for (const sourceFile of source) for (const rule of rules) {
    const match = rule.pattern.exec(sourceFile.content);
    const line = match ? lineAt(sourceFile.content, match.index) : undefined;
    const sourceLine = line === undefined ? "" : sourceFile.lines[line - 1] ?? "";
    // Analyzer rule declarations are inert pattern metadata, not use sites. A
    // bounded scanner must not treat its own (or another tool's) `pattern: /…/`
    // definition as an invocation or raw-rendering occurrence.
    const detectorDefinition = /\bpattern\s*:\s*\/.*\/[a-z]*\s*[,}]/.test(sourceLine);
    if (match && !detectorDefinition && signals.length < MAX_FINDINGS) signals.push({ id: `${rule.id}:${sourceFile.path}:${match.index}`, title: rule.title, detail: rule.detail, confidence: "medium", paths: [sourceFile.path], evidence: [sourceEvidence(sourceFile.path, `Static pattern '${rule.id}' matched.`, line)] });
    rule.pattern.lastIndex = 0;
  }
  return signals;
}

interface BacklogDraft {
  title: string;
  urgency: number;
  problemSummary: string;
  evidence: EvidenceReference[];
  expectedDeveloperImpact: SuggestedTask["expectedDeveloperImpact"];
  riskIfIgnored: string;
  estimatedEngineeringEffort: SuggestedTask["estimatedEngineeringEffort"];
  confidence: Confidence;
  priorityBasis: string;
  affectedRepositoryAreas: SuggestedTask["affectedRepositoryAreas"];
  expectedOutcome: string;
  relatedFindingIds: string[];
  dependencyTitles?: string[];
}

function suggestedTasks(input: { testSystem: RepositoryAnalysis["testSystem"]; security: Finding[]; debt: Finding[]; complexity: ReturnType<typeof sourceMetrics>; duplicates: Finding[]; deadCode: Finding[]; ciFiles: string[]; moduleGraph: RepositoryAnalysis["moduleGraph"]; dependencies: RepositoryAnalysis["dependencies"] }): SuggestedTask[] {
  const drafts: BacklogDraft[] = [];
  const add = (draft: BacklogDraft): void => { drafts.push(draft); };
  if (input.testSystem.items.missing.length > 0) add({ title: "Establish a deterministic test boundary", urgency: 88, problemSummary: input.testSystem.items.missing.join(" "), evidence: input.testSystem.evidence, expectedDeveloperImpact: { areas: ["reliability", "developer_productivity", "maintainability"], explanation: "A discoverable deterministic test boundary gives future work an executable contract instead of relying on manual confidence." }, riskIfIgnored: "Future changes will have no repository-discoverable regression signal, increasing review cost and the chance that behavior breaks silently.", estimatedEngineeringEffort: { size: "Medium", rationale: "The repository needs a test command plus at least one focused deterministic scenario; the analyzer cannot estimate implementation details beyond that evidence." }, confidence: input.testSystem.confidence, priorityBasis: "Blocks trustworthy regression evidence for every later change.", affectedRepositoryAreas: { files: ["package.json"], modules: [], packages: input.testSystem.items.frameworks, subsystems: ["test system"] }, expectedOutcome: "A bounded static scan can identify a test command and at least one test path; later verification remains a separate approved activity.", relatedFindingIds: [] });
  input.security.slice(0, 3).forEach((finding) => add({ title: `Review security boundary: ${finding.title}`, urgency: finding.title.includes("credential") ? 92 : 80, problemSummary: finding.detail, evidence: finding.evidence, expectedDeveloperImpact: { areas: ["security", "reliability"], explanation: "The observed pattern touches a security-sensitive boundary and requires an engineer to establish its data flow and intended safeguards." }, riskIfIgnored: "The observed pattern may retain an unreviewed security boundary, increasing incident impact or remediation cost if it is later misused.", estimatedEngineeringEffort: { size: "Small", rationale: "The first deliverable is a focused review and decision, not an assumed code change." }, confidence: finding.confidence, priorityBasis: "Ranks ahead of maintainability work because the supporting evidence touches a potentially high-impact security boundary.", affectedRepositoryAreas: { files: finding.paths, modules: finding.paths, packages: [], subsystems: ["security review"] }, expectedOutcome: "A human-reviewed security decision links the observed pattern to its input, controls, and verification expectations.", relatedFindingIds: [finding.id] }));
  input.moduleGraph.items.circularDependencies.slice(0, 2).forEach((cycle, index) => add({ title: "Break a static module dependency cycle", urgency: 76, problemSummary: `A supported static import cycle was resolved: ${cycle.join(" → ")}.`, evidence: input.moduleGraph.items.internalEdges.filter((edge) => cycle.includes(edge.from) && cycle.includes(edge.to)).map((edge) => edge.evidence), expectedDeveloperImpact: { areas: ["architecture_quality", "maintainability", "reliability"], explanation: "Cycles obscure initialization and ownership boundaries, making changes harder to isolate and test." }, riskIfIgnored: "The cycle can increase coupling and make future changes require wider, riskier edits across the same modules.", estimatedEngineeringEffort: { size: "Medium", rationale: "Breaking a cycle usually requires choosing an ownership boundary or extracting a dependency; static evidence cannot select the design." }, confidence: "high", priorityBasis: "Ranks above local cleanup because it is a graph-level architecture constraint affecting multiple modules.", affectedRepositoryAreas: { files: cycle, modules: cycle, packages: [], subsystems: ["module graph"] }, expectedOutcome: "The affected modules no longer form the currently resolved static import cycle.", relatedFindingIds: [], dependencyTitles: ["Establish a deterministic test boundary"] }));
  input.debt.filter((finding) => finding.title.includes("FIXME") || finding.title.includes("HACK") || finding.title.includes("BUG")).slice(0, 3).forEach((finding) => add({ title: `Resolve or triage: ${finding.title}`, urgency: 58, problemSummary: finding.detail, evidence: finding.evidence, expectedDeveloperImpact: { areas: ["technical_debt", "maintainability"], explanation: "An explicit maintenance marker is known engineering context that should become a decision, bounded task, or consciously retained debt." }, riskIfIgnored: "The marker can become stale institutional knowledge, increasing future discovery and maintenance cost.", estimatedEngineeringEffort: { size: "Small", rationale: "Triage produces a clear owner and decision; the eventual repair is intentionally not pre-estimated from a comment alone." }, confidence: finding.confidence, priorityBasis: "Ranks after security and graph constraints because the evidence identifies debt but does not establish a current production impact.", affectedRepositoryAreas: { files: finding.paths, modules: finding.paths, packages: [], subsystems: ["technical debt"] }, expectedOutcome: "The marker has a documented engineering disposition or is removed with a verified replacement.", relatedFindingIds: [finding.id] }));
  input.complexity.largestModules.filter((module) => module.lines > 350 || module.complexityIndicators > 30).slice(0, 2).forEach((module) => add({ title: `Inspect complexity hotspot: ${module.path}`, urgency: 54, problemSummary: `Static analysis found ${module.lines} lines, ${module.complexityIndicators} branch indicators, and estimated nesting ${module.maxNesting}.`, evidence: [sourceEvidence(module.path, "Complexity metrics crossed the configured engineering-review threshold.", undefined, "medium")], expectedDeveloperImpact: { areas: ["maintainability", "reliability", "developer_productivity"], explanation: "A concentrated complex module can slow review, hide edge cases, and expand the blast radius of routine changes." }, riskIfIgnored: "Future work in this module may require larger reviews and make regressions harder to isolate.", estimatedEngineeringEffort: { size: "Medium", rationale: "The evidence supports investigation; any extraction or simplification must follow a human-approved design." }, confidence: "medium", priorityBasis: "Ranks after explicit graph and security signals because complexity is a heuristic rather than a proven defect.", affectedRepositoryAreas: { files: [module.path], modules: [module.path], packages: [], subsystems: ["complexity hotspot"] }, expectedOutcome: "An engineer identifies a smaller reviewed boundary or records why the module should remain cohesive.", relatedFindingIds: [] }));
  input.duplicates.slice(0, 2).forEach((finding) => add({ title: "Confirm repeated logic before consolidation", urgency: 40, problemSummary: finding.detail, evidence: finding.evidence, expectedDeveloperImpact: { areas: ["maintainability", "technical_debt"], explanation: "Confirmed repeated logic can create multiple future edit sites for the same behavior." }, riskIfIgnored: "Related behavior may drift as future changes update one copy but not another.", estimatedEngineeringEffort: { size: "Small", rationale: "The static result is exact normalized repetition; semantic equivalence and safe consolidation require human confirmation." }, confidence: finding.confidence, priorityBasis: "Ranks below direct risk and structural work because static duplication does not prove the copies should be unified.", affectedRepositoryAreas: { files: finding.paths, modules: finding.paths, packages: [], subsystems: ["duplicate code"] }, expectedOutcome: "The repeated block is either documented as intentionally distinct or consolidated behind a verified shared boundary.", relatedFindingIds: [finding.id], dependencyTitles: ["Establish a deterministic test boundary"] }));
  input.deadCode.slice(0, 2).forEach((finding) => add({ title: "Confirm module reachability", urgency: 34, problemSummary: finding.detail, evidence: finding.evidence, expectedDeveloperImpact: { areas: ["maintainability", "developer_productivity"], explanation: "Clarifying ownership or reachability reduces future cognitive load without assuming safe deletion." }, riskIfIgnored: "Engineers may keep navigating and maintaining a module whose ownership or runtime path remains unclear.", estimatedEngineeringEffort: { size: "XS", rationale: "The first step is a reachability/ownership decision; no removal is proposed from static evidence alone." }, confidence: finding.confidence, priorityBasis: "Ranks low because dynamic loading and external consumers are explicitly unknown.", affectedRepositoryAreas: { files: finding.paths, modules: finding.paths, packages: [], subsystems: ["reachability review"] }, expectedOutcome: "The module is either linked to an owner/runtime entrypoint or queued for a separately verified removal.", relatedFindingIds: [finding.id], dependencyTitles: ["Establish a deterministic test boundary"] }));
  input.dependencies.items.unobservedDirectDependencies.slice(0, 3).forEach((dependency) => add({ title: `Confirm declared dependency usage: ${dependency}`, urgency: 32, problemSummary: `The dependency is declared but was not observed in supported static import patterns.`, evidence: input.dependencies.evidence, expectedDeveloperImpact: { areas: ["maintainability", "technical_debt"], explanation: "A confirmed unused direct dependency can reduce install surface and maintenance obligations." }, riskIfIgnored: "The dependency may remain an unexplained maintenance and supply-chain surface.", estimatedEngineeringEffort: { size: "XS", rationale: "This begins with a usage audit because plugins, scripts, and dynamic loading are outside the static graph." }, confidence: "low", priorityBasis: "Ranks low because absence from supported static imports is deliberately not treated as proof of unused code.", affectedRepositoryAreas: { files: ["package.json"], modules: [], packages: [dependency], subsystems: ["dependency management"] }, expectedOutcome: "The dependency has a documented usage reason or is removed only after an approved verification path.", relatedFindingIds: [] }));
  if (input.ciFiles.length === 0 && input.testSystem.items.testFiles.length > 0) add({ title: "Document the existing test signal", urgency: 25, problemSummary: "Test paths exist, but no supported CI workflow file was detected.", evidence: input.testSystem.evidence, expectedDeveloperImpact: { areas: ["onboarding", "developer_productivity"], explanation: "Documented test entrypoints reduce discovery time without proposing CI configuration." }, riskIfIgnored: "New contributors may not know which local test signal exists, increasing onboarding and review friction.", estimatedEngineeringEffort: { size: "XS", rationale: "The task is documentation-only and does not configure or invoke CI." }, confidence: "medium", priorityBasis: "Ranks after code and risk work because it improves discoverability rather than a repository behavior boundary.", affectedRepositoryAreas: { files: ["README.md"], modules: [], packages: [], subsystems: ["developer experience"] }, expectedOutcome: "A contributor can locate the existing test command from repository documentation.", relatedFindingIds: [] });

  const sorted = drafts.sort((left, right) => right.urgency - left.urgency || left.title.localeCompare(right.title));
  const identifiers = new Map(sorted.map((draft) => [draft.title, stableIdentifier("TASK", draft.title)]));
  return sorted.map((draft, index) => {
    const rank = index + 1;
    const priority: SuggestedTask["priority"] = draft.urgency >= 90 ? "P0" : draft.urgency >= 70 ? "P1" : draft.urgency >= 45 ? "P2" : "P3";
    const dependencies = (draft.dependencyTitles ?? []).map((title) => identifiers.get(title)).filter((id): id is string => Boolean(id));
    const id = identifiers.get(draft.title)!;
    const next = sorted[index + 1];
    const businessLevel: SuggestedTask["businessImpact"]["level"] = draft.expectedDeveloperImpact.areas.some((area) => area === "security" || area === "reliability") ? "high" : draft.urgency >= 45 ? "medium" : "low";
    const productivityLevel: SuggestedTask["developerProductivityImpact"]["level"] = draft.expectedDeveloperImpact.areas.includes("developer_productivity") || draft.expectedDeveloperImpact.areas.includes("maintainability") ? draft.urgency >= 45 ? "high" : "medium" : "low";
    const priorityReasoning = `Rank ${rank} (${priority}): ${draft.priorityBasis}${next ? ` It ranks above #${rank + 1}, ${next.title}, because its deterministic urgency is ${draft.urgency} versus ${next.urgency}.` : " It is the final evidence-supported item in this bounded backlog."} It does not authorize implementation.`;
    return {
      id, rank, priority, title: draft.title, problemSummary: draft.problemSummary, evidence: draft.evidence,
      businessImpact: { level: businessLevel, explanation: businessLevel === "high" ? "The observed issue can affect reliability or a security-sensitive boundary if left unresolved." : businessLevel === "medium" ? "The observed issue can raise ongoing delivery and maintenance cost across the affected area." : "The evidence supports a local improvement opportunity, not a demonstrated customer-impacting defect." },
      engineeringImpact: draft.expectedDeveloperImpact,
      developerProductivityImpact: { level: productivityLevel, explanation: productivityLevel === "high" ? "The affected area is likely to impose repeated review, debugging, or change-isolation cost." : productivityLevel === "medium" ? "Clarifying or improving this area can reduce future discovery and maintenance effort." : "No material developer-productivity impact was established beyond the cited local context." },
      expectedDeveloperImpact: draft.expectedDeveloperImpact, riskIfIgnored: draft.riskIfIgnored, estimatedEngineeringEffort: draft.estimatedEngineeringEffort, confidence: draft.confidence,
      priorityReasoning, affectedRepositoryAreas: draft.affectedRepositoryAreas, dependencies, expectedOutcome: draft.expectedOutcome, successCriteria: [draft.expectedOutcome],
      crossReferences: [
        ...draft.evidence.map((item) => evidenceReference(item, "Supports this backlog item.")),
        ...draft.relatedFindingIds.map((findingId) => ({ id: findingId, kind: "finding" as const, label: findingId, relationship: "Finding that generated this backlog item." })),
        ...(next ? [{ id: identifiers.get(next.title)!, kind: "task" as const, label: next.title, relationship: "This item ranks above the next backlog item under the deterministic urgency rule." }] : []),
      ],
    };
  });
}

function healthScores(input: { architecture: RepositoryAnalysis["architecture"]; entryPoints: RepositoryAnalysis["entryPoints"]; testSystem: RepositoryAnalysis["testSystem"]; security: RepositoryAnalysis["security"]; codeSmells: RepositoryAnalysis["codeSmells"]; debt: RepositoryAnalysis["technicalDebt"]; duplicates: RepositoryAnalysis["duplicates"]; deadCode: RepositoryAnalysis["deadCode"]; documentation: string[]; build: RepositoryAnalysis["buildSystem"]; moduleGraph: RepositoryAnalysis["moduleGraph"]; dependencies: RepositoryAnalysis["dependencies"]; coverage: RepositoryAnalysis["coverage"]; backlog: SuggestedTask[] }): RepositoryAnalysis["health"] {
  const confidence: Confidence = input.coverage.scanLimited || input.coverage.sourceLimited ? "low" : "medium";
  const canScore = !input.coverage.scanLimited && !input.coverage.sourceLimited;
  const makeCategory = (id: string, category: string, contributions: { label: string; points: number; evidence: EvidenceReference[] }[], strengths: string[], weaknesses: string[], unknowns: string[], limitations: string[], relatedFindingIds: string[] = []): HealthCategory => {
    const evidenceItems = contributions.flatMap((item) => item.evidence);
    return { id, category, score: canScore ? Math.min(100, contributions.reduce((total, item) => total + item.points, 0)) : null, confidence, scoreExplanation: contributions, strengths, weaknesses, evidence: evidenceItems, crossReferences: [...evidenceItems.map((item) => evidenceReference(item, "Supports this report-card criterion.")), ...relatedFindingIds.map((findingId) => ({ id: findingId, kind: "finding" as const, label: findingId, relationship: "Finding affecting this report-card category." }))], unknowns, limitations };
  };
  const noCycles = input.moduleGraph.items.circularDependencies.length === 0;
  const categories: HealthCategory[] = [
    makeCategory("architecture", "Architecture", [{ label: "Named architecture markers", points: input.architecture.items.styles.length > 0 ? 30 : 0, evidence: input.architecture.items.styles.flatMap((item) => item.evidence) }, { label: "Resolved module boundaries", points: Math.min(30, input.moduleGraph.items.boundaries.length * 5), evidence: input.moduleGraph.items.boundaries.flatMap((item) => item.evidence) }, { label: "No resolved static cycles", points: noCycles ? 25 : 0, evidence: input.moduleGraph.evidence }, { label: "Explicit entrypoints", points: Math.min(15, input.entryPoints.items.length * 5), evidence: input.entryPoints.evidence }], input.architecture.items.styles.length > 0 ? ["Named structure markers are present."] : [], noCycles ? [] : ["Static dependency cycles reduce boundary clarity."], input.architecture.unknowns, ["This rubric describes observed structural signals, not intended architecture or runtime topology."], []),
    makeCategory("maintainability", "Maintainability", [{ label: "No configured smell threshold crossed", points: input.codeSmells.items.length === 0 ? 35 : 0, evidence: input.codeSmells.evidence }, { label: "No explicit debt marker", points: input.debt.items.length === 0 ? 30 : 0, evidence: input.debt.evidence }, { label: "No exact normalized duplicate block", points: input.duplicates.items.length === 0 ? 15 : 0, evidence: input.duplicates.evidence }, { label: "No resolved static cycle", points: noCycles ? 20 : 0, evidence: input.moduleGraph.evidence }], input.codeSmells.items.length === 0 ? ["No configured smell threshold was crossed in the bounded scan."] : [], [...input.codeSmells.items.map((item) => item.title), ...input.debt.items.map((item) => item.title), ...input.duplicates.items.map((item) => item.title)], [], ["Absence of a static signal does not prove maintainability; semantic duplication and runtime coupling remain outside this scan."], [...input.codeSmells.items.map((item) => item.id), ...input.debt.items.map((item) => item.id), ...input.duplicates.items.map((item) => item.id)]),
    makeCategory("testing", "Testing readiness", [{ label: "Test paths detected", points: input.testSystem.items.testFiles.length > 0 ? 45 : 0, evidence: input.testSystem.evidence }, { label: "Declared test framework", points: input.testSystem.items.frameworks.length > 0 ? 20 : 0, evidence: input.testSystem.evidence }, { label: "Multiple test conventions", points: Math.min(20, input.testSystem.items.kinds.length * 10), evidence: input.testSystem.evidence }, { label: "Discoverable test command", points: Object.keys(input.build.items.scripts).some((name) => /test/i.test(name)) ? 15 : 0, evidence: input.build.evidence }], input.testSystem.items.testFiles.length > 0 ? [`${input.testSystem.items.testFiles.length} test-like paths are discoverable.`] : [], input.testSystem.items.missing, [], ["No test command or test file was executed; this is a discoverability/readiness report, not coverage or pass-status evidence."], []),
    makeCategory("security", "Security review coverage", [{ label: "Bounded source security scan completed", points: input.coverage.sourceFilesRead > 0 ? 45 : 0, evidence: input.security.evidence }, { label: "Sensitive paths intentionally excluded from content reads", points: input.security.items.some((item) => item.title.includes("Sensitive configuration")) ? 15 : 0, evidence: input.security.evidence }, { label: "No unresolved static security-review signal", points: input.security.items.length === 0 ? 40 : 0, evidence: input.security.evidence }], input.security.items.length === 0 ? ["No supported static security-review pattern was observed."] : [], input.security.items.map((item) => item.title), ["Vulnerability status, authentication correctness, authorization coverage, and dependency CVEs are UNKNOWN."], ["This score measures bounded review coverage only; it is not a security assurance or vulnerability score."], input.security.items.map((item) => item.id)),
    makeCategory("modularity", "Modularity", [{ label: "Resolved internal module graph", points: input.moduleGraph.items.internalEdges.length > 0 ? 25 : 0, evidence: input.moduleGraph.evidence }, { label: "Cross-domain boundaries visible", points: Math.min(30, input.moduleGraph.items.boundaries.length * 5), evidence: input.moduleGraph.items.boundaries.flatMap((item) => item.evidence) }, { label: "No resolved static cycle", points: noCycles ? 30 : 0, evidence: input.moduleGraph.evidence }, { label: "Hotspots remain bounded", points: input.dependencies.items.hotspots.every((item) => item.connections < 12) ? 15 : 0, evidence: input.dependencies.items.hotspots.flatMap((item) => item.evidence) }], input.moduleGraph.items.boundaries.length > 0 ? ["Cross-domain static boundaries are visible."] : [], noCycles ? [] : ["At least one resolved static cycle exists."], input.moduleGraph.unknowns, ["Aliases, dynamic imports, generated code, and runtime composition are outside the module graph."], []),
    makeCategory("documentation", "Documentation", [{ label: "README or docs paths", points: Math.min(70, input.documentation.length * 15), evidence: fileEvidence(input.documentation, "Documentation path detected.") }, { label: "Documented repository commands", points: Object.keys(input.build.items.scripts).length > 0 && input.documentation.length > 0 ? 30 : 0, evidence: [...input.build.evidence, ...fileEvidence(input.documentation, "Documentation path detected.")] }], input.documentation.length > 0 ? [`${input.documentation.length} documentation paths were found.`] : [], input.documentation.length === 0 ? ["No README or docs path was found."] : [], [], ["Static path presence does not establish accuracy, freshness, or onboarding quality of documentation."], []),
    makeCategory("developer-experience", "Developer experience", [{ label: "Discoverable scripts", points: Math.min(40, Object.keys(input.build.items.scripts).length * 8), evidence: input.build.evidence }, { label: "Detected toolchains", points: Math.min(25, input.build.items.toolchains.length * 10), evidence: input.build.evidence }, { label: "CI marker present", points: input.build.items.ciFiles.length > 0 ? 20 : 0, evidence: input.build.evidence }, { label: "Documentation path present", points: input.documentation.length > 0 ? 15 : 0, evidence: fileEvidence(input.documentation, "Documentation path detected.") }], Object.keys(input.build.items.scripts).length > 0 ? ["Repository commands are discoverable from metadata."] : [], input.build.items.ciFiles.length === 0 ? ["No supported CI workflow marker was found."] : [], [], ["Commands are never executed in Repository Intelligence, so usability and correctness remain unverified."], []),
    makeCategory("technical-debt", "Technical debt", [{ label: "No high-priority maintenance markers", points: input.debt.items.filter((item) => /FIXME|HACK|BUG|XXX/.test(item.title)).length === 0 ? 40 : 0, evidence: input.debt.evidence }, { label: "No exact normalized duplicate block", points: input.duplicates.items.length === 0 ? 20 : 0, evidence: input.duplicates.evidence }, { label: "No candidate unreferenced module", points: input.deadCode.items.length === 0 ? 20 : 0, evidence: input.deadCode.evidence }, { label: "No resolved static cycle", points: noCycles ? 20 : 0, evidence: input.moduleGraph.evidence }], input.debt.items.length === 0 ? ["No explicit debt marker was found."] : [], [...input.debt.items.map((item) => item.title), ...input.duplicates.items.map((item) => item.title), ...input.deadCode.items.map((item) => item.title)], [], ["Debt that is undocumented, semantic, or runtime-only is outside this static assessment."], [...input.debt.items.map((item) => item.id), ...input.duplicates.items.map((item) => item.id), ...input.deadCode.items.map((item) => item.id)]),
    makeCategory("dependency-quality", "Dependency quality", [{ label: "Manifest dependencies inspected", points: input.dependencies.items.production.length + input.dependencies.items.development.length > 0 ? 25 : 0, evidence: input.dependencies.evidence }, { label: "Observed static external imports", points: input.dependencies.items.externalImports.length > 0 ? 25 : 0, evidence: input.dependencies.evidence }, { label: "No unobserved dependency candidate", points: input.dependencies.items.unobservedDirectDependencies.length === 0 ? 25 : 0, evidence: input.dependencies.evidence }, { label: "Build metadata marker", points: input.build.items.buildFiles.length > 0 ? 25 : 0, evidence: input.build.evidence }], input.dependencies.items.externalImports.length > 0 ? ["Supported static imports reveal part of the external dependency surface."] : [], input.dependencies.items.unobservedDirectDependencies.length > 0 ? [`${input.dependencies.items.unobservedDirectDependencies.length} dependency candidates require a usage audit.`] : [], ["Runtime, plugin, script, and CVE dependency usage remain UNKNOWN."], ["This does not assess dependency versions, licenses, or vulnerabilities."], []),
  ];
  const numeric = categories.map((item) => item.score).filter((score): score is number => score !== null);
  const overallScore = canScore && numeric.length === categories.length ? Math.round(numeric.reduce((total, score) => total + score, 0) / numeric.length) : null;
  const ordered = [...categories].filter((item) => item.score !== null).sort((left, right) => (right.score ?? 0) - (left.score ?? 0));
  const quickWins = input.backlog.filter((item) => item.estimatedEngineeringEffort.size === "XS" || item.estimatedEngineeringEffort.size === "Small").slice(0, 3).map((item) => `${item.priority} · ${item.title}`);
  const longTermInvestments = input.backlog.filter((item) => item.estimatedEngineeringEffort.size === "Medium" || item.estimatedEngineeringEffort.size === "Large" || item.estimatedEngineeringEffort.size === "Very Large").slice(0, 3).map((item) => `${item.priority} · ${item.title}`);
  const report: RepositoryHealthReport = { categories, overallScore, summary: overallScore === null ? "Repository Intelligence withholds a single overall score because the bounded scan cannot credibly score every required dimension." : `${ordered[0]?.category ?? "No category"} has the strongest observed static evidence; ${ordered.at(-1)?.category ?? "no category"} is the primary evidence-backed improvement area.`, topStrengths: ordered.slice(0, 3).map((item) => `${item.category}: ${item.score}`), topWeaknesses: ordered.slice(-3).reverse().map((item) => `${item.category}: ${item.score}`), biggestEngineeringRisks: [...input.security.items.map((item) => item.title), ...input.moduleGraph.items.circularDependencies.map((cycle) => `Static dependency cycle: ${cycle.join(" → ")}`), ...input.backlog.filter((item) => item.priority === "P0" || item.priority === "P1").slice(0, 3).map((item) => `${item.priority}: ${item.title}`)].slice(0, 5), highestRoiImprovements: input.backlog.slice(0, 3).map((item) => `${item.priority} · ${item.title}`), quickWins, longTermInvestments };
  return section(report, categories.flatMap((item) => item.evidence).slice(0, 32), confidence, input.coverage.scanLimited ? ["The file scan reached its cap, so report-card scores are withheld."] : [], ["Scores are explicit bounded static rubrics, not release decisions, runtime behavior, security assurance, or verification evidence."], ["Each category exposes the criteria and evidence that contributed to its score.", "The summary ranks only observed static signals and keeps unmeasured dimensions explicit."]);
}

function combineEvidence(...groups: EvidenceReference[][]): EvidenceReference[] {
  const result = new Map<string, EvidenceReference>();
  groups.flat().forEach((item) => result.set(item.id, item));
  return [...result.values()];
}

function lowestConfidence(...values: Confidence[]): Confidence {
  return values.includes("low") ? "low" : values.includes("medium") ? "medium" : "high";
}

function buildDecisionSupport(input: { repositoryName: string; repositoryCommit: string | null; coverage: RepositoryAnalysis["coverage"]; languages: RepositoryAnalysis["languages"]; frameworks: RepositoryAnalysis["frameworks"]; architecture: RepositoryAnalysis["architecture"]; domains: RepositoryAnalysis["domains"]; entryPoints: RepositoryAnalysis["entryPoints"]; moduleGraph: RepositoryAnalysis["moduleGraph"]; security: RepositoryAnalysis["security"]; testSystem: RepositoryAnalysis["testSystem"]; complexity: RepositoryAnalysis["complexity"]; health: RepositoryAnalysis["health"]; backlog: SuggestedTask[]; git: RepositoryAnalysis["git"] }): EngineeringDecisionSupport {
  const sourceLines = input.complexity.items.totalLines;
  const sizeLabel: RepositoryDna["repositorySize"]["label"] = input.coverage.scannedFiles === 0 ? "Unknown" : input.coverage.scannedFiles <= 150 && sourceLines <= 20_000 ? "Small" : input.coverage.scannedFiles <= 600 && sourceLines <= 100_000 ? "Medium" : "Large";
  const staticScore = input.health.items.overallScore;
  const maturity: RepositoryDna["estimatedMaturity"] = staticScore === null ? { label: "Unknown", confidence: "low", reasoning: "A bounded scan reached a cap, so an estimated maturity label is withheld." } : staticScore >= 70 && (input.git.items.totalCommits ?? 0) >= 5 ? { label: "Established", confidence: input.health.confidence, reasoning: "The observed static report card is at least 70 and Git history contains at least five commits." } : staticScore >= 40 ? { label: "Developing", confidence: input.health.confidence, reasoning: "The observed static report card is between 40 and 69; this is a bounded structural estimate, not a delivery-quality claim." } : { label: "Early", confidence: input.health.confidence, reasoning: "The observed static report card is below 40; this is a bounded structural estimate, not a statement about team capability." };
  const isTestPath = (file: string): boolean => /(^|\/)(test|tests|__tests__|spec|e2e|integration|browser)(\/|$)|\.(test|spec)\.[^.]+$/i.test(file);
  const testOnlySecuritySignals = input.security.items.filter((item) => item.title !== "Sensitive configuration path present" && item.paths.length > 0 && item.paths.every(isTestPath));
  const explicitSecuritySignals = input.security.items.filter((item) => item.title !== "Sensitive configuration path present" && !testOnlySecuritySignals.includes(item));
  const incomplete = input.coverage.scanLimited || input.coverage.sourceLimited || input.coverage.unreadablePaths.length > 0;
  const noPlanningAnchor = input.repositoryCommit === null || input.entryPoints.items.length === 0;
  const state: RepositoryReadinessAssessment["state"] = explicitSecuritySignals.length >= 2 ? "high_risk_repository" : incomplete || noPlanningAnchor || explicitSecuritySignals.length > 0 ? "needs_manual_review" : "safe_for_bounded_ai_planning";
  const label: RepositoryReadinessAssessment["label"] = state === "safe_for_bounded_ai_planning" ? "SAFE FOR BOUNDED AI PLANNING" : state === "needs_manual_review" ? "NEEDS MANUAL REVIEW" : "HIGH-RISK REPOSITORY";
  const readinessConfidence = lowestConfidence(input.health.confidence, input.architecture.confidence, input.moduleGraph.confidence, state === "safe_for_bounded_ai_planning" ? "high" : "medium");
  const blockers = [
    ...(incomplete ? ["The bounded inventory is incomplete."] : []),
    ...(input.repositoryCommit === null ? ["No readable Git commit anchors the repository version."] : []),
    ...(input.entryPoints.items.length === 0 ? ["No supported entrypoint was found."] : []),
    ...explicitSecuritySignals.map((item) => `Security review signal: ${item.title}.`),
  ];
  const readinessEvidence = combineEvidence(input.git.evidence, input.entryPoints.evidence, input.architecture.evidence, input.moduleGraph.evidence, input.security.evidence, input.testSystem.evidence, input.health.evidence);
  const readinessUnknowns = unique([...
    input.architecture.unknowns,
    ...input.moduleGraph.unknowns,
    ...input.security.unknowns,
    ...input.testSystem.limitations,
    ...(testOnlySecuritySignals.length > 0 ? [`${testOnlySecuritySignals.length} static security review signal(s) occur only in test paths and do not block planning readiness.`] : []),
    ...(incomplete ? ["The file/source inventory is incomplete, so unscanned paths are UNKNOWN."] : []),
  ]);
  const primaryLimitation = blockers[0] ?? (input.testSystem.items.missing[0] ?? "Static analysis does not prove runtime behavior, test pass status, or production configuration.");
  const readiness: RepositoryReadinessAssessment = {
    state, label, confidence: readinessConfidence,
    recommendation: state === "safe_for_bounded_ai_planning" ? "The cited repository structure is sufficient to prepare a bounded plan. Planning remains non-executing and must retain all listed unknowns." : state === "needs_manual_review" ? "Resolve or explicitly accept the cited review condition before relying on this repository for bounded AI planning." : "Do not begin bounded AI planning until a human reviews the cited high-risk static signals and records the decision.",
    notRecommended: [
      ...(state === "safe_for_bounded_ai_planning" ? [] : ["Bounded AI planning"]),
      "Codex implementation", "Patch verification", "Deployment", "Repository modification", "Worktree creation", "Vault write",
    ],
    reasoning: state === "safe_for_bounded_ai_planning" ? ["The bounded scan completed, a Git commit and supported entrypoint were found, and no code-level security review signal was detected.", `Static report-card summary: ${input.health.items.summary}`] : blockers,
    evidenceIds: readinessEvidence.map((item) => item.id),
    supportingFiles: unique(readinessEvidence.filter((item) => !item.source.startsWith("git ") && item.source !== "bounded file inventory").map((item) => item.source)),
    unknowns: readinessUnknowns,
    riskExplanation: state === "safe_for_bounded_ai_planning" ? "No production-path static blocker was observed for planning. This is not a claim that implementation, runtime behavior, or security is verified." : state === "needs_manual_review" ? "At least one bounded-scan gap, missing planning anchor, or production-path code-level review signal prevents an automatic planning recommendation." : "Multiple production-path code-level security review signals were observed. They are not confirmed vulnerabilities, but together require human review before AI planning.",
    primaryLimitation,
    crossReferences: readinessEvidence.map((item) => evidenceReference(item, "Supports the readiness decision.")),
  };
  const dnaEvidence = combineEvidence(input.languages.evidence, input.frameworks.evidence, input.architecture.evidence, input.domains.evidence, input.complexity.evidence, input.health.evidence, readinessEvidence);
  const dna: RepositoryDna = {
    repositoryName: input.repositoryName,
    primaryLanguages: input.languages.items.filter((item) => item.role === "primary" || item.role === "secondary").slice(0, 2).map((item) => item.name),
    frameworks: input.frameworks.items.map((item) => item.name),
    architectureStyles: input.architecture.items.styles.map((item) => item.name),
    businessDomains: input.domains.items.map((item) => item.name),
    repositorySize: { label: sizeLabel, files: input.coverage.scannedFiles, sourceFiles: input.coverage.sourceFilesRead, sourceLines, reasoning: `The bounded scan observed ${input.coverage.scannedFiles} paths, ${input.coverage.sourceFilesRead} source files, and ${sourceLines} source lines.` },
    estimatedMaturity: maturity,
    currentHealth: { overallScore: staticScore, summary: input.health.items.summary },
    strengths: input.health.items.topStrengths,
    weaknesses: input.health.items.topWeaknesses,
    criticalRisks: input.health.items.biggestEngineeringRisks,
    valuableOpportunities: input.backlog.slice(0, 3).map((item) => ({ id: item.id, title: item.title, priority: item.priority })),
    overallConfidence: readinessConfidence,
    unknownAreas: readinessUnknowns,
    readiness: label,
  };
  const dnaSection = section(dna, dnaEvidence, readinessConfidence, readinessUnknowns, ["Repository DNA is a bounded static synthesis. It is neither a runtime assessment nor approval to modify code."], ["Repository DNA combines only evidence already exposed by the underlying analysis sections.", `Readiness is ${label} with ${readinessConfidence} confidence.`]);
  const readinessSection = section(readiness, readinessEvidence, readinessConfidence, readinessUnknowns, ["Readiness is a decision-support recommendation for planning only. It never authorizes implementation, execution, verification, or approval."], readiness.reasoning);
  const architecturePhrase = dna.architectureStyles.length > 0 ? `Observed architecture markers: ${dna.architectureStyles.join(", ")}.` : "No named architecture style crossed the evidence threshold.";
  const domainPhrase = dna.businessDomains.length > 0 ? `Observed domain vocabulary: ${dna.businessDomains.join(", ")}.` : "Business domain is UNKNOWN from bounded path vocabulary.";
  const testPhrase = input.testSystem.items.missing.length > 0 ? `Primary limitation: ${input.testSystem.items.missing[0]}` : "Test conventions were detected, but no test command was executed.";
  const briefingText = `${architecturePhrase} ${domainPhrase} ${testPhrase} Readiness: ${label}. Confidence: ${readinessConfidence}.`;
  const storyText = `This repository ${dna.architectureStyles.length > 0 ? `shows ${dna.architectureStyles.join(", ")} structural markers` : "has no named architecture style proven by the bounded scan"}. ${input.moduleGraph.items.circularDependencies.length === 0 ? "No supported static dependency cycle was resolved." : `${input.moduleGraph.items.circularDependencies.length} supported static dependency cycle(s) require review.`} ${testPhrase} Overall, it is ${label.toLowerCase()} for bounded AI planning, subject to the explicit unknowns and without any implementation authority.`;
  const briefingEvidence = combineEvidence(dnaEvidence, readinessEvidence, input.testSystem.evidence);
  return {
    repositoryDna: dnaSection,
    readiness: readinessSection,
    executiveBriefing: section({ text: briefingText }, briefingEvidence, readinessConfidence, readinessUnknowns, ["The briefing is a deterministic synthesis of static evidence and does not state runtime behavior."], [architecturePhrase, domainPhrase, testPhrase, `Readiness derives from the cited readiness assessment: ${label}.`]),
    repositoryStory: section({ text: storyText }, briefingEvidence, readinessConfidence, readinessUnknowns, ["The story is a deterministic narrative over bounded static facts, not a software-quality certification."], [architecturePhrase, `Static graph result: ${input.moduleGraph.items.circularDependencies.length} resolved cycle(s).`, testPhrase]),
  };
}

function uniqueExplorerDependencies(items: ExplorerDependency[]): ExplorerDependency[] {
  const result = new Map<string, ExplorerDependency>();
  items.forEach((item) => result.set(`${item.kind}\u001f${item.specifier}\u001f${item.target}\u001f${item.evidence.source}\u001f${item.evidence.line ?? 0}`, item));
  return [...result.values()].sort((left, right) => left.target.localeCompare(right.target) || left.specifier.localeCompare(right.specifier) || (left.evidence.line ?? 0) - (right.evidence.line ?? 0));
}

function buildArchitectureExplorer(input: { sourceFiles: SourceFile[]; importsBySource: Map<string, ExplorerDependency[]>; internalEdges: InternalEdge[]; entrypointPaths: Set<string>; findings: Finding[]; suggestions: SuggestedTask[]; coverage: RepositoryAnalysis["coverage"]; scanEvidence: EvidenceReference }): AnalysisSection<ArchitectureExplorer> {
  const sourceByPath = new Map(input.sourceFiles.map((source) => [source.path, source]));
  const directories = unique(input.sourceFiles.flatMap((source) => {
    const parent = path.posix.dirname(source.path);
    if (parent === ".") return ["."];
    const segments = parent.split("/");
    return [".", ...segments.map((_, index) => segments.slice(0, index + 1).join("/"))];
  })).sort();
  const entityId = (kind: ArchitectureExplorerEntity["kind"], entityPath: string): string => stableIdentifier("MOD", `${kind}\u001f${entityPath}`);
  const staticConfidence = input.coverage.scanLimited || input.coverage.sourceLimited ? "low" as Confidence : "medium" as Confidence;

  const buildEntity = (kind: ArchitectureExplorerEntity["kind"], entityPath: string, memberPaths: string[]): ArchitectureExplorerEntity => {
    const members = new Set(memberPaths);
    const memberSources = memberPaths.map((memberPath) => sourceByPath.get(memberPath)).filter((source): source is SourceFile => source !== undefined);
    const moduleType = explorerModuleType(entityPath, kind, input.entrypointPaths);
    const domains = explorerDomains(memberPaths);
    const responsibility = explorerResponsibility(entityPath, kind, moduleType, memberPaths.length, domains);
    const imports = uniqueExplorerDependencies(memberPaths.flatMap((memberPath) => input.importsBySource.get(memberPath) ?? []));
    const incomingEdges = input.internalEdges.filter((edge) => members.has(edge.to) && !members.has(edge.from));
    const outgoingEdges = input.internalEdges.filter((edge) => members.has(edge.from) && !members.has(edge.to));
    const incomingDependencies = uniqueExplorerDependencies(incomingEdges.map((edge) => ({ specifier: edge.specifier, target: edge.from, kind: "internal" as const, evidence: edge.evidence })));
    const outgoingDependencies = uniqueExplorerDependencies(outgoingEdges.map((edge) => ({ specifier: edge.specifier, target: edge.to, kind: "internal" as const, evidence: edge.evidence })));
    const exportedSymbols = memberSources.flatMap(staticExports);
    const relatedRisks = input.findings.filter((finding) => finding.paths.some((findingPath) => members.has(findingPath)));
    const touchingEdges = [...incomingEdges, ...outgoingEdges];
    if (touchingEdges.length >= 8) relatedRisks.push({
      id: stableIdentifier("RISK", `${kind}\u001f${entityPath}\u001fstatic-dependency-surface`),
      title: "Large static dependency surface",
      detail: `${touchingEdges.length} direct resolved static dependency relationship(s) cross this ${kind} boundary. Runtime impact remains UNKNOWN.`,
      confidence: staticConfidence,
      paths: memberPaths,
      evidence: touchingEdges.map((edge) => edge.evidence),
      reasoning: ["The count is limited to directly resolved static relative imports.", "Dynamic composition and external consumers were not evaluated."],
    });
    const cycles = findCycles(input.internalEdges).filter((cycle) => cycle.some((memberPath) => members.has(memberPath)));
    if (cycles.length > 0) relatedRisks.push({
      id: stableIdentifier("RISK", `${kind}\u001f${entityPath}\u001fstatic-cycle`),
      title: "Static dependency cycle candidate",
      detail: `${cycles.length} resolved static dependency cycle(s) include this ${kind}.`,
      confidence: staticConfidence,
      paths: unique(cycles.flat()),
      evidence: cycles.flatMap((cycle) => input.internalEdges.filter((edge) => cycle.includes(edge.from) && cycle.includes(edge.to)).map((edge) => edge.evidence)),
      reasoning: ["A cycle was found only among supported, resolved static relative imports."],
    });

    const reverse = new Map<string, InternalEdge[]>();
    input.internalEdges.forEach((edge) => reverse.set(edge.to, [...(reverse.get(edge.to) ?? []), edge]));
    const queue: { path: string; chain: string[]; evidence: EvidenceReference[] }[] = [];
    memberPaths.forEach((memberPath) => (reverse.get(memberPath) ?? []).filter((edge) => !members.has(edge.from)).forEach((edge) => queue.push({ path: edge.from, chain: [edge.from, memberPath], evidence: [edge.evidence] })));
    const impacted = new Map<string, { path: string; dependencyChain: string[]; distance: number; evidence: EvidenceReference[] }>();
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (members.has(current.path) || impacted.has(current.path)) continue;
      impacted.set(current.path, { path: current.path, dependencyChain: current.chain, distance: current.chain.length - 1, evidence: current.evidence });
      (reverse.get(current.path) ?? []).forEach((edge) => {
        if (!members.has(edge.from) && !impacted.has(edge.from)) queue.push({ path: edge.from, chain: [edge.from, ...current.chain], evidence: [...current.evidence, edge.evidence] });
      });
    }
    const impactedModules = [...impacted.values()].sort((left, right) => left.distance - right.distance || left.path.localeCompare(right.path));
    const directDependents = impactedModules.filter((item) => item.distance === 1).length;
    const transitiveDependents = impactedModules.filter((item) => item.distance > 1).length;
    const impactDomains = explorerDomains(impactedModules.map((item) => item.path));
    const blastLevel: ExplorerImpact["estimatedBlastRadius"]["level"] = impactedModules.length === 0 ? "isolated" : impactedModules.length <= 2 ? "contained" : impactedModules.length <= 6 ? "moderate" : "high";
    const riskLevel: ExplorerImpact["riskLevel"] = blastLevel === "high" || relatedRisks.length >= 2 ? "high" : blastLevel === "moderate" || relatedRisks.length > 0 ? "medium" : "low";
    const impactEvidence = combineEvidence(...impactedModules.map((item) => item.evidence), ...impactDomains.map((domain) => domain.evidence));
    const changeImpact: ExplorerImpact = {
      impactedModules,
      impactedBusinessDomains: impactDomains,
      estimatedBlastRadius: { level: blastLevel, directDependents, transitiveDependents, reasoning: `${directDependents} direct and ${transitiveDependents} transitive dependent module(s) were reached through supported static relative-import edges.` },
      riskLevel,
      confidence: input.coverage.scanLimited || input.coverage.sourceLimited ? "low" : impactedModules.length === 0 ? "medium" : "medium",
      evidence: impactEvidence,
      unknowns: ["Runtime call paths, dependency injection, dynamic imports, generated modules, reflection, package consumers, and external consumers are UNKNOWN.", ...(impactDomains.length === 0 ? ["No impacted business domain met the path-vocabulary evidence threshold."] : [])],
      limitations: ["Blast radius is a static dependency estimate, not runtime impact, test coverage, or a change authorization decision."],
    };

    const relatedRecommendations = input.suggestions.filter((task) => task.affectedRepositoryAreas.files.some((file) => members.has(file)) || task.affectedRepositoryAreas.modules.some((module) => memberPaths.some((memberPath) => memberPath === module || memberPath.startsWith(`${module}/`) || module.startsWith(`${memberPath}/`)))).map((task) => ({
      id: task.id,
      title: task.title,
      priority: task.priority,
      confidence: task.confidence,
      reason: `This recommendation names an affected repository area within ${entityPath}.`,
      evidence: task.evidence,
      crossReferences: task.crossReferences,
    }));
    const evidenceItems = combineEvidence(...memberSources.map((source) => [sourceEvidence(source.path, "Source module is inspectable in the Architecture Explorer.")]), responsibility.evidence, ...imports.map((item) => [item.evidence]), ...incomingDependencies.map((item) => [item.evidence]), ...outgoingDependencies.map((item) => [item.evidence]), ...exportedSymbols.map((item) => [item.evidence]), ...relatedRisks.map((risk) => risk.evidence), impactEvidence);
    const unknowns = [
      ...(responsibility.businessDomains.length === 0 ? ["Business responsibility is UNKNOWN beyond path, file type, and resolved static relationships."] : []),
      ...(memberSources.some((source) => !/\.(?:ts|tsx|js|jsx|mjs|cjs)$/i.test(source.path)) ? ["Exported-symbol inspection supports TypeScript and JavaScript static export syntax only; other languages remain UNKNOWN."] : []),
      ...changeImpact.unknowns,
    ];
    const crossReferences = [
      ...evidenceItems.map((item) => evidenceReference(item, "Supports this inspected entity.")),
      ...incomingDependencies.map((item) => ({ id: entityId("file", item.target), kind: "module" as const, label: item.target, relationship: "Direct static dependent of this entity." })),
      ...outgoingDependencies.map((item) => ({ id: entityId("file", item.target), kind: "module" as const, label: item.target, relationship: "Direct static dependency of this entity." })),
      ...relatedRisks.map((risk) => ({ id: risk.id, kind: "finding" as const, label: risk.title, relationship: "Repository-derived risk related to this entity." })),
      ...relatedRecommendations.map((task) => ({ id: task.id, kind: "task" as const, label: task.title, relationship: "Evidence-backed engineering recommendation related to this entity." })),
    ];
    return { id: entityId(kind, entityPath), kind, path: entityPath, moduleType, responsibility, confidence: lowestConfidence(responsibility.confidence, changeImpact.confidence), imports, exportedSymbols, incomingDependencies, outgoingDependencies, relatedRisks, relatedRecommendations, changeImpact, evidence: evidenceItems, crossReferences, unknowns: unique(unknowns), limitations: ["Only supported static import and export patterns are inspected. No repository code, script, package manager, build, test, browser, planner, Codex, verifier, worktree, approval, or vault operation was invoked."], };
  };

  const fileEntities = input.sourceFiles.map((source) => buildEntity("file", source.path, [source.path]));
  const directoryEntities = directories.map((directory) => buildEntity("directory", directory, input.sourceFiles.filter((source) => directory === "." || source.path.startsWith(`${directory}/`)).map((source) => source.path)));
  const entities = [...fileEntities, ...directoryEntities].sort((left, right) => left.kind.localeCompare(right.kind) || left.path.localeCompare(right.path));
  const explorerEvidence = combineEvidence([input.scanEvidence], ...entities.slice(0, 40).map((entity) => entity.evidence));
  return section({ entities, totalFiles: fileEntities.length, totalDirectories: directoryEntities.length }, explorerEvidence, staticConfidence, ["Only source files within the bounded scan are inspectable. Directories without supported source files are UNKNOWN.", "Runtime behavior and dynamic dependency resolution remain UNKNOWN."], ["Architecture Explorer is a read-only static inspection surface. It does not execute repository code or authorize any later Foundry stage."], [`${fileEntities.length} source file(s) and ${directoryEntities.length} source directory grouping(s) are available for evidence-backed inspection.`, "Change impact is limited to reverse traversal of resolved static relative-import edges."]);
}

/** Reads a user-selected local Git repository. It never executes project scripts or creates a worktree. */
export async function analyzeLocalRepository(repositoryPath: string, vaultPath: string): Promise<RepositoryAnalysis> {
  const root = path.resolve(repositoryPath);
  if (!existsSync(root) || !existsSync(path.join(root, ".git"))) throw new Error("Repository analysis requires an existing local Git repository.");

  const scan = await scanRepository(root);
  const scanEvidence = evidence("bounded file inventory", `Scanned ${scan.files.length} paths and read ${scan.sourceFiles.length} supported source files without executing repository code.`);
  const { manifest, error: manifestError } = await parsePackageJson(root);
  const rootFiles = Object.fromEntries(await Promise.all(["composer.json", "pyproject.toml", "requirements.txt", "Pipfile", "pom.xml", "build.gradle", "build.gradle.kts", "CMakeLists.txt", "src-tauri/tauri.conf.json", ...scan.files.filter((file) => file.endsWith(".csproj"))].map(async (file) => [file, await rootText(root, scan.files, file)] as const)));
  const scripts = Object.fromEntries(Object.entries(manifest.scripts ?? {}).filter(([, command]) => typeof command === "string").sort(([left], [right]) => left.localeCompare(right)));
  const commands = Object.keys(scripts).reduce((result, name) => {
    const command = `npm run ${name}`;
    if (/build/i.test(name)) result.build.push(command);
    else if (/test|check|lint/i.test(name)) result.test.push(command);
    else if (/start|dev|serve/i.test(name)) result.run.push(command);
    return result;
  }, { build: [] as string[], test: [] as string[], run: [] as string[] });

  const commit = git(root, ["rev-parse", "HEAD"]);
  const activeBranch = git(root, ["branch", "--show-current"]) || null;
  const status = git(root, ["status", "--porcelain"]);
  const branches = gitLines(root, ["for-each-ref", "--format=%(refname:short)", "refs/heads"]);
  const tags = gitLines(root, ["tag", "--sort=-creatordate"]);
  const releaseDates = gitLines(root, ["for-each-ref", "--sort=creatordate", "--format=%(creatordate:short)", "refs/tags"])
    .map((date) => Date.parse(date)).filter((date) => !Number.isNaN(date));
  const releaseCadenceDays = releaseDates.length >= 2
    ? Math.round(releaseDates.slice(1).reduce((total, date, index) => total + ((date - releaseDates[index]) / 86_400_000), 0) / (releaseDates.length - 1))
    : null;
  const gitCommits = parseGitCommits(gitLines(root, ["log", "-10", "--pretty=format:%h%x1f%an%x1f%ad%x1f%s", "--date=short"]));
  const firstDate = git(root, ["log", "--reverse", "-1", "--format=%ad", "--date=short"]);
  const repositoryAgeDays = firstDate && !Number.isNaN(Date.parse(firstDate)) ? Math.max(0, Math.floor((Date.now() - Date.parse(firstDate)) / 86_400_000)) : null;
  const totalCommits = Number(git(root, ["rev-list", "--all", "--count"]) ?? NaN);
  const mergeCommitCount = Number(git(root, ["rev-list", "--all", "--merges", "--count"]) ?? NaN);
  const authors = parseAuthors(gitLines(root, ["shortlog", "-sne", "--all"]));
  const gitEvidence = [evidence("git rev-parse HEAD", commit ? "Readable repository HEAD was returned." : "Repository has no readable HEAD."), evidence("git status --porcelain", status === undefined ? "Working-tree status was unavailable." : "Read-only working-tree status was queried."), evidence("git log --pretty", `${gitCommits.length} recent commits were read.`), evidence("git for-each-ref refs/tags", releaseDates.length >= 2 ? `Release cadence was calculated from ${releaseDates.length} dated tags.` : "Fewer than two dated tags; release cadence is UNKNOWN.")];
  const gitSection = section({ repositoryAgeDays, totalCommits: Number.isFinite(totalCommits) ? totalCommits : null, mergeCommitCount: Number.isFinite(mergeCommitCount) ? mergeCommitCount : null, releaseTags: tags.slice(0, 12), releaseCadenceDays, authors, recentCommits: gitCommits }, gitEvidence, commit ? "high" : "low", [...(commit ? [] : ["No readable Git HEAD; commit-derived facts are unknown."]), ...(releaseCadenceDays === null ? ["Release cadence is UNKNOWN because fewer than two dated tags were found."] : [])], ["Git is invoked only with read-only metadata queries and optional locks disabled."]);

  const languageCounts = new Map<string, string[]>();
  scan.files.forEach((file) => { const language = languageName(file); if (language) languageCounts.set(language, [...(languageCounts.get(language) ?? []), file]); });
  const languageItems: { name: string; files: number; role: "primary" | "secondary" | "configuration" | "generated"; evidence: EvidenceReference[] }[] = [...languageCounts.entries()].sort((left, right) => right[1].length - left[1].length || left[0].localeCompare(right[0])).map(([name, paths], index) => ({ name, files: paths.length, role: index === 0 ? "primary" as const : "secondary" as const, evidence: fileEvidence(paths, `${name} extension detected.`) }));
  const configGroups = new Map<string, string[]>();
  scan.files.forEach((file) => { const language = configurationLanguage(file); if (language) configGroups.set(language, [...(configGroups.get(language) ?? []), file]); });
  [...configGroups.entries()].forEach(([name, paths]) => languageItems.push({ name, files: paths.length, role: "configuration", evidence: fileEvidence(paths, `${name} configuration file detected.`) }));
  const generatedPaths = scan.files.filter((file) => /(^|\/)(generated|vendor)\/|\.generated\./i.test(file));
  if (generatedPaths.length > 0) languageItems.push({ name: "Generated code", files: generatedPaths.length, role: "generated", evidence: fileEvidence(generatedPaths, "Generated-path or generated-filename marker detected.") });
  const languageSection = section(languageItems, languageItems.flatMap((item) => item.evidence).slice(0, 20), confidenceForScan(scan), scan.scanLimited ? ["Unscanned paths may contain additional languages."] : [], ["Language detection uses file extensions and does not parse every language grammar."]);

  const frameworkItems = frameworkFindings(manifest, rootFiles);
  const packageManagers = packageManagerFindings(scan.files);
  const entrypointItems = entryPoints(scan.files, manifest);
  const frameworkSection = section(frameworkItems, [...frameworkItems.flatMap((item) => item.evidence), scanEvidence], frameworkItems.length > 0 ? "high" : "low", frameworkItems.length === 0 ? ["No supported framework marker was observed; framework is UNKNOWN."] : [], ["Framework detection is signature-based and cannot prove runtime usage."]);
  const managerSection = section(packageManagers, [...packageManagers.flatMap((item) => item.evidence), scanEvidence], packageManagers.length > 0 ? "high" : "low", packageManagers.length === 0 ? ["No supported package-manager lock or manifest marker was observed."] : [], ["Only recognized local marker files are detected."]);
  const entrypointSection = section(entrypointItems, [...entrypointItems.flatMap((item) => item.evidence), scanEvidence], entrypointItems.some((item) => item.confidence === "high") ? "high" : entrypointItems.length > 0 ? "medium" : "low", entrypointItems.length === 0 ? ["No conventional or manifest-declared entrypoint was found."] : [], ["Dynamic loaders, generated entrypoints, and framework conventions may not be discovered."]);

  const sourcePaths = new Set(scan.sourceFiles.map((file) => file.path));
  const importsBySource = new Map<string, ExplorerDependency[]>();
  const internalEdges: InternalEdge[] = [];
  const externalImports = new Set<string>();
  scan.sourceFiles.forEach((source) => {
    const imports = explorerImports(source, sourcePaths);
    importsBySource.set(source.path, imports);
    imports.forEach((item) => {
      if (item.kind === "internal") internalEdges.push({ from: source.path, to: item.target, specifier: item.specifier, evidence: item.evidence });
      else if (item.kind === "external") externalImports.add(item.target);
    });
  });
  const production = Object.keys(manifest.dependencies ?? {}).sort();
  const development = Object.keys(manifest.devDependencies ?? {}).sort();
  const unobservedDirectDependencies = [...production, ...development].filter((dependency) => !externalImports.has(dependency)).sort();
  const connectionCounts = new Map<string, number>();
  internalEdges.forEach((edge) => { connectionCounts.set(edge.from, (connectionCounts.get(edge.from) ?? 0) + 1); connectionCounts.set(edge.to, (connectionCounts.get(edge.to) ?? 0) + 1); });
  const hotspots = [...connectionCounts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])).slice(0, 10).map(([module, connections]) => {
    const supportingEdges = internalEdges.filter((edge) => edge.from === module || edge.to === module);
    return { module, connections, evidence: supportingEdges.map((edge) => edge.evidence), reasoning: `${connections} resolved static import relationship${connections === 1 ? "" : "s"} touch this module.`, crossReferences: supportingEdges.map((edge) => evidenceReference(edge.evidence, "Import relationship contributing to this hotspot.")) };
  });
  const dependencySection = section({ production, development, scripts, externalImports: [...externalImports].sort(), unobservedDirectDependencies, hotspots }, [existsSync(path.join(root, "package.json")) ? sourceEvidence("package.json", `${production.length} production and ${development.length} development dependencies are declared.`) : scanEvidence, ...internalEdges.slice(0, 12).map((edge) => edge.evidence)], confidenceForScan(scan), manifestError ? [manifestError] : [], ["Dependencies not observed in static imports are candidates only; configuration, plugins, and dynamic loading can use them."], [`${internalEdges.length} resolvable static import edges were used to identify dependency hotspots.`, `${unobservedDirectDependencies.length} declared packages were not observed in supported static imports and remain review candidates only.`]);
  const modules = scan.sourceFiles.map((file) => ({ path: file.path, domain: file.path.split("/")[0] || ".", layer: moduleLayer(file.path), evidence: [sourceEvidence(file.path, "Module was included in the bounded static source scan.")] }));
  const boundaryCounts = new Map<string, number>();
  internalEdges.forEach((edge) => { const from = edge.from.split("/")[0]; const to = edge.to.split("/")[0]; if (from !== to) { const key = `${from}\u001f${to}`; boundaryCounts.set(key, (boundaryCounts.get(key) ?? 0) + 1); } });
  const boundaries = [...boundaryCounts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])).slice(0, 12).map(([key, connections]) => { const [from, to] = key.split("\u001f"); const supportingEdges = internalEdges.filter((edge) => edge.from.split("/")[0] === from && edge.to.split("/")[0] === to); return { from, to, connections, evidence: supportingEdges.map((edge) => edge.evidence) }; });
  const cycles = findCycles(internalEdges);
  const moduleGraph = section({ modules: modules.slice(0, 300), internalEdges: internalEdges.slice(0, 600), circularDependencies: cycles, boundaries }, [...internalEdges.slice(0, 20).map((edge) => edge.evidence), scanEvidence], confidenceForScan(scan), scan.sourceLimited ? ["Module graph is partial because source-read limits were reached."] : [], ["Only supported static import syntaxes and resolvable relative paths create graph edges. Dynamic imports, aliases, and runtime discovery are unknown."], [`${modules.length} supported source modules and ${internalEdges.length} resolvable relative imports were scanned.`, `${cycles.length} static cycle${cycles.length === 1 ? " was" : "s were"} detected.`]);

  const topDirectories = unique(scan.files.map((file) => file.split("/")[0]).filter((directory) => !directory.startsWith("."))).sort();
  const riskyDirectories = topDirectories.filter((directory) => /^(auth|security|config|infra|migrations|database|db|deploy|ops)$/i.test(directory));
  const generatedDirectories = topDirectories.filter((directory) => /^(generated|vendor|coverage)$/i.test(directory));
  const styles = architectureStyles(scan.files);
  const architectureSection = section({ styles, directories: topDirectories, riskyDirectories, generatedDirectories, largeFiles: scan.largeFiles }, [...styles.flatMap((item) => item.evidence), ...fileEvidence(riskyDirectories, "Top-level directory has a high-impact name."), scanEvidence], styles.some((item) => item.confidence === "high") ? "high" : styles.length > 0 ? "medium" : "low", styles.length === 0 ? ["No architecture pattern met the evidence threshold; architecture style is UNKNOWN."] : [], ["Named directories are structural signals, not proof of intended architecture."]);
  const domainItems = businessDomains(scan.files);
  const domainSection = section(domainItems, [...domainItems.flatMap((item) => item.evidence), scanEvidence], domainItems.some((item) => item.confidence === "high") ? "high" : domainItems.length > 0 ? "medium" : "low", domainItems.length === 0 ? ["No product domain met the two-path evidence threshold; domain is UNKNOWN."] : [], ["Domain inference uses only repository path vocabulary and never source-code guesses."]);

  const ciFiles = scan.files.filter((file) => file.startsWith(".github/workflows/") || [".gitlab-ci.yml", "azure-pipelines.yml", ".circleci/config.yml", "Jenkinsfile"].includes(file));
  const containerFiles = scan.files.filter((file) => /(^|\/)(Dockerfile|docker-compose(?:\.[\w-]+)?\.ya?ml)$/i.test(file));
  const buildFiles = scan.files.filter((file) => /(^|\/)(tsconfig\.json|vite\.config\.|webpack\.config\.|rollup\.config\.|Makefile|Cargo\.toml|go\.mod|pom\.xml|build\.gradle(?:\.kts)?|CMakeLists\.txt|pyproject\.toml)$/i.test(file));
  const toolchains = unique([...(scan.files.some((file) => /^tsconfig(?:\..+)?\.json$/.test(file)) ? ["TypeScript"] : []), ...frameworkItems.filter((item) => ["Vite", "Webpack", "Rollup"].includes(item.name)).map((item) => item.name), ...(scan.files.includes("Cargo.toml") ? ["Cargo"] : []), ...(scan.files.includes("go.mod") ? ["Go toolchain"] : []), ...(scan.files.includes("pom.xml") ? ["Maven"] : []), ...(scan.files.some((file) => /^build\.gradle/.test(file)) ? ["Gradle"] : []), ...(scan.files.includes("pyproject.toml") || scan.files.includes("requirements.txt") ? ["Python"] : []), ...(scan.files.includes("CMakeLists.txt") ? ["CMake"] : [])]);
  const buildSection = section({ scripts, toolchains, ciFiles, containerFiles, buildFiles }, [existsSync(path.join(root, "package.json")) ? sourceEvidence("package.json", `${Object.keys(scripts).length} package scripts were read; none were executed.`) : scanEvidence, ...fileEvidence([...ciFiles, ...containerFiles, ...buildFiles], "Build, CI, container, or toolchain marker detected.")], confidenceForScan(scan), manifestError ? [manifestError] : [], ["Build scripts are reported as unexecuted repository metadata. CI configuration is detected but never invoked."]);
  const testFiles = scan.files.filter((file) => /(^|\/)(test|tests|__tests__|spec|e2e|integration|browser)(\/|$)|\.(test|spec)\.[^.]+$/i.test(file));
  const testKinds = [
    { name: "Unit / integration test conventions", paths: testFiles.filter((file) => !/e2e|browser|playwright|cypress/i.test(file)) },
    { name: "Browser / E2E test conventions", paths: testFiles.filter((file) => /e2e|browser|playwright|cypress/i.test(file)) },
    { name: "Snapshot test conventions", paths: testFiles.filter((file) => /snapshot|__snapshots__/i.test(file)) },
  ].filter((kind) => kind.paths.length > 0).map((kind) => ({ name: kind.name, files: kind.paths.length, evidence: fileEvidence(kind.paths, `${kind.name} path convention detected.`) }));
  const testFrameworks = frameworkItems.filter((item) => ["Vitest", "Jest", "Playwright", "Cypress", "pytest", "JUnit", "GoogleTest"].includes(item.name)).map((item) => item.name);
  const missingTests = testFiles.length === 0 ? ["No test-like file path was found in the bounded scan."] : [];
  const testSection = section({ frameworks: testFrameworks, kinds: testKinds, testFiles: testFiles.slice(0, 100), missing: missingTests }, [...testKinds.flatMap((item) => item.evidence), ...frameworkItems.filter((item) => testFrameworks.includes(item.name)).flatMap((item) => item.evidence), ...(testFiles.length === 0 ? [scanEvidence] : [])], testFiles.length > 0 ? confidenceForScan(scan) : "high", [], ["File names and declared frameworks do not prove tests pass or cover a behavior; no tests were executed."]);

  const todos = extractTodos(scan.sourceFiles);
  const rawDebtFindings: Finding[] = todos.filter((item) => item.tag !== "NOTE").map((item) => ({ id: `debt:${item.path}:${item.line}`, title: `${item.tag} maintenance marker`, detail: item.excerpt, confidence: "high", paths: [item.path], evidence: item.evidence, reasoning: [`A ${item.tag} marker was observed in a bounded source scan.`] }));
  const rawMetrics = sourceMetrics(scan.sourceFiles);
  const rawSmells = codeSmells(rawMetrics);
  const rawDuplicates = duplicateBlocks(scan.sourceFiles);
  const rawSecurity = securitySignals(scan.sourceFiles, scan.sensitiveFiles);
  const referencedTargets = new Set(internalEdges.map((edge) => edge.to));
  const knownEntrypoints = new Set(entrypointItems.map((item) => item.path));
  const rawDeadCandidates = scan.sourceFiles.filter((file) => !referencedTargets.has(file.path) && !knownEntrypoints.has(file.path) && !/(^|\/)(test|tests|__tests__)\//i.test(file.path) && !/(^|\/)(index|main|app|server)\./i.test(file.path)).slice(0, MAX_FINDINGS).map((file) => ({ id: `unreferenced:${file.path}`, title: "Candidate unreferenced source module", detail: "No supported static relative import points to this file. This is not proof of dead code.", confidence: "low" as Confidence, paths: [file.path], evidence: [sourceEvidence(file.path, "File was scanned but no supported static relative import resolved to it.")], reasoning: ["The file has no inbound supported static relative import and is not a conventional entrypoint or test path."] }));
  const allRawFindings = [...rawDebtFindings, ...rawMetrics.longFunctions, ...rawSmells, ...rawDuplicates, ...rawSecurity, ...rawDeadCandidates];
  const debtFindings = enrichFindings(rawDebtFindings, allRawFindings);
  const smells = enrichFindings(rawSmells, allRawFindings);
  const duplicates = enrichFindings(rawDuplicates, allRawFindings);
  const security = enrichFindings(rawSecurity, allRawFindings);
  const deadCandidates = enrichFindings(rawDeadCandidates, allRawFindings);
  const metrics = { ...rawMetrics, longFunctions: enrichFindings(rawMetrics.longFunctions, allRawFindings) };
  const securitySection = section(security, [...security.flatMap((item) => item.evidence), ...scan.sourceFiles.slice(0, 6).map((file) => sourceEvidence(file.path, "Static security patterns scanned.")), scanEvidence], security.length > 0 ? "medium" : confidenceForScan(scan), ["Missing authentication, validation, authorization, and known CVEs cannot be proven absent by this bounded static scan."], ["Potential secret values are never returned. Findings are review signals, not vulnerability claims."]);
  const smellSection = section(smells, [...smells.flatMap((item) => item.evidence), scanEvidence], confidenceForScan(scan), [], ["Line counts, indentation, and branch indicators are heuristics, not semantic code-quality judgments."]);
  const debtSection = section(debtFindings, [...debtFindings.flatMap((item) => item.evidence), scanEvidence], confidenceForScan(scan), [], ["Marker text is untrusted repository content and is only surfaced as a bounded, sanitized excerpt."]);
  const complexitySection = section(metrics, metrics.largestModules.map((item) => sourceEvidence(item.path, `Static metrics: ${item.lines} lines, ${item.complexityIndicators} branch indicators, nesting ${item.maxNesting}.`)), confidenceForScan(scan), scan.sourceLimited ? ["Complexity metrics cover only bounded source files."] : [], ["Cyclomatic complexity is approximated by textual branch indicators, not a language parser."]);
  const deadSection = section(deadCandidates, [...deadCandidates.flatMap((item) => item.evidence), scanEvidence], "low", ["Dynamic imports, framework discovery, code generation, public packages, and external consumers are not resolved."], ["Every result is a candidate requiring human confirmation before deletion."]);
  const todoSection = section(todos, [...todos.flatMap((item) => item.evidence), scanEvidence], confidenceForScan(scan), [], ["Comments are untrusted content; excerpts are sanitized and do not grant instructions or authority."]);
  const duplicateSection = section(duplicates, [...duplicates.flatMap((item) => item.evidence), scanEvidence], duplicates.length > 0 ? "medium" : confidenceForScan(scan), [], ["Only exact normalized four-line blocks are detected. Semantic duplication remains unknown."]);

  const memoryPack = (() => {
    if (!commit) return { id: `PACK-REPOSITORY-${path.basename(root)}`, available: false, estimatedTokens: 0, tokenBudget: 4_000, confidence: 0, selected: [], omitted: [], staleKnowledgeExcluded: false, evidence: [evidence("git rev-parse HEAD", "No readable commit exists, so commit-aware vault selection is withheld.")], unknowns: ["Memory Pack is unavailable until the repository has a readable Git commit."], limitations: ["Repository Mode never writes or updates the vault."] };
    return { id: "", available: true, estimatedTokens: 0, tokenBudget: 4_000, confidence: 0, selected: [] as { id: string; title: string; reason: string; freshness: string; confidence: number }[], omitted: [] as { id: string; reason: string }[], staleKnowledgeExcluded: false, evidence: [evidence("vault/ + repository HEAD", "Commit-aware deterministic Memory Pack selection was compiled.")], unknowns: [] as string[], limitations: ["Only existing verified, fresh vault knowledge may be selected; no vault write is possible."] };
  })();
  if (memoryPack.available && commit) {
    const vault = await loadVault(vaultPath);
    const pack = compileMemoryPack(vault, { id: `REPOSITORY-${path.basename(root)}`, title: `Repository analysis for ${path.basename(root)}`, services: topDirectories.filter((directory) => /(api|service|web|app|server)/i.test(directory)), paths: entrypointItems.slice(0, 3).map((item) => item.path), repositoryCommit: commit, tokenBudget: 4_000 });
    memoryPack.id = pack.id; memoryPack.estimatedTokens = pack.estimatedTokens; memoryPack.tokenBudget = pack.tokenBudget; memoryPack.confidence = pack.confidenceScore;
    memoryPack.selected = pack.sources.map((source) => ({ id: source.document.id, title: source.document.title, reason: source.inclusionReason, freshness: source.document.freshness, confidence: source.document.confidenceScore }));
    memoryPack.omitted = pack.omittedSources.map((source) => ({ id: source.id, reason: source.reason }));
    memoryPack.staleKnowledgeExcluded = pack.omittedSources.some((source) => source.reason.includes("stale"));
    if (pack.sources.length === 0) memoryPack.unknowns.push("No fresh, verified vault note matched this repository commit and task context.");
  }

  const documentation = scan.files.filter((file) => /(^|\/)(README\.md|docs\/)/i.test(file));
  const suggestions = suggestedTasks({ testSystem: testSection, security, debt: debtFindings, complexity: metrics, duplicates, deadCode: deadCandidates, ciFiles, moduleGraph, dependencies: dependencySection });
  const health = healthScores({ architecture: architectureSection, entryPoints: entrypointSection, testSystem: testSection, security: securitySection, codeSmells: smellSection, debt: debtSection, duplicates: duplicateSection, deadCode: deadSection, documentation, build: buildSection, moduleGraph, dependencies: dependencySection, coverage: { scannedFiles: scan.files.length, sourceFilesRead: scan.sourceFiles.length, scanLimited: scan.scanLimited, sourceLimited: scan.sourceLimited, unreadablePaths: scan.unreadablePaths }, backlog: suggestions });
  const architectureExplorer = buildArchitectureExplorer({ sourceFiles: scan.sourceFiles, importsBySource, internalEdges, entrypointPaths: new Set(entrypointItems.map((item) => item.path)), findings: [...security, ...smells, ...debtFindings, ...duplicates, ...deadCandidates, ...metrics.longFunctions], suggestions, coverage: { scannedFiles: scan.files.length, sourceFilesRead: scan.sourceFiles.length, scanLimited: scan.scanLimited, sourceLimited: scan.sourceLimited, unreadablePaths: scan.unreadablePaths }, scanEvidence });
  const decisionSupport = buildDecisionSupport({ repositoryName: path.basename(root), repositoryCommit: commit ?? null, coverage: { scannedFiles: scan.files.length, sourceFilesRead: scan.sourceFiles.length, scanLimited: scan.scanLimited, sourceLimited: scan.sourceLimited, unreadablePaths: scan.unreadablePaths }, languages: languageSection, frameworks: frameworkSection, architecture: architectureSection, domains: domainSection, entryPoints: entrypointSection, moduleGraph, security: securitySection, testSystem: testSection, complexity: complexitySection, health, backlog: suggestions, git: gitSection });
  return {
    mode: "repository_analysis",
    repository: { path: root, name: path.basename(root), commit: commit ?? null, dirty: status === undefined ? null : status.length > 0, activeBranch, branches, tags: tags.slice(0, 20), recentCommits: gitCommits },
    coverage: { scannedFiles: scan.files.length, sourceFilesRead: scan.sourceFiles.length, scanLimited: scan.scanLimited, sourceLimited: scan.sourceLimited, unreadablePaths: scan.unreadablePaths },
    summary: { languages: languageItems.filter((item) => item.role !== "configuration" && item.role !== "generated").map((item) => item.name), frameworks: frameworkItems.map((item) => item.name), packageManagers: packageManagers.map((item) => item.name), testFrameworks, ciFiles, documentation, fileCount: scan.files.length, scannedFiles: scan.files.length, scanLimited: scan.scanLimited },
    commands,
    git: gitSection, languages: languageSection, frameworks: frameworkSection, packageManagers: managerSection, entryPoints: entrypointSection, dependencies: dependencySection, moduleGraph, architecture: architectureSection, domains: domainSection, buildSystem: buildSection, testSystem: testSection,
    security: securitySection, codeSmells: smellSection, technicalDebt: debtSection, complexity: complexitySection, deadCode: deadSection, todos: todoSection, duplicates: duplicateSection, health, architectureExplorer, decisionSupport, memoryPack, suggestions,
    trust: { execution: "not_available", verifier: "not_invoked", vault: "not_written", facts: "read_only", limitation: "This mode prepares evidence-backed context only. It may query Git metadata read-only, but does not run repository scripts, builds, tests, or package-manager commands; approve a task; create a worktree; invoke Codex; verify a patch; or write the vault." },
  };
}
