import { spawn } from "node:child_process";
import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ApprovedGenericPlan, GenericCommand, GenericExecutionPolicy } from "./generic-policy.js";
import { commandForId, normalizeRepositoryPath, validateGenericPolicy } from "./generic-policy.js";
import type { GenericImplementationWorktree, GenericWorktreeRunner } from "./generic-worktree-runner.js";

export interface VerifiedCommandResult {
  commandId: string;
  display: string;
  exitCode: number | null;
  timedOut: boolean;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export interface GenericVerificationReport {
  authority: "independent_verifier";
  runId: string;
  baselineCommit: string;
  changedPaths: string[];
  commands: VerifiedCommandResult[];
  passed: boolean;
  failureReason?: string;
}

export interface RegressionMutation {
  path: string;
  expected: string;
  replacement: string;
  approvedBy: string;
  approvedAt: string;
  reason: string;
}

export interface GenericRegressionReplay {
  authority: "independent_verifier";
  runId: string;
  mutation: Pick<RegressionMutation, "path" | "approvedBy" | "approvedAt" | "reason">;
  verification: GenericVerificationReport;
  status: "regression_blocked" | "regression_not_blocked";
}

interface Invocation { executable: string; args: string[]; }

function limited(value: string): string {
  return value.replace(/((?:token|secret|password|authorization)\s*[:=]\s*)[^\s,;]+/gi, "$1[REDACTED]").slice(-64_000);
}

function executionEnvironment(): NodeJS.ProcessEnv {
  const names = ["PATH", "SystemRoot", "ComSpec", "TEMP", "TMP", "APPDATA", "LOCALAPPDATA", "USERPROFILE", "ProgramFiles", "ProgramFiles(x86)"];
  const environment: NodeJS.ProcessEnv = { CI: "1", NO_COLOR: "1" };
  names.forEach((name) => { if (process.env[name]) environment[name] = process.env[name]; });
  return environment;
}

/** Resolve the npm Windows shim without invoking a shell. */
export async function resolveVerifiedInvocation(command: GenericCommand): Promise<Invocation> {
  const executable = command.executable.toLowerCase();
  if (process.platform === "win32" && (executable === "npm" || executable === "npm.cmd")) {
    const entrypoint = path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
    try { await access(entrypoint); } catch { throw new Error("The local Node installation does not expose npm-cli.js for direct, shell-free verification."); }
    return { executable: process.execPath, args: [entrypoint, ...command.args] };
  }
  if (process.platform === "win32" && executable.endsWith(".cmd")) throw new Error("Verifier refuses a Windows command shim other than npm; use a direct executable in the approved policy.");
  return { executable: command.executable, args: command.args };
}

async function execute(command: GenericCommand, cwd: string): Promise<VerifiedCommandResult> {
  const started = Date.now();
  const invocation = await resolveVerifiedInvocation(command);
  return new Promise((resolve) => {
    const child = spawn(invocation.executable, invocation.args, { cwd, env: executionEnvironment(), windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, command.timeoutMs);
    child.stdout.setEncoding("utf8"); child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => { stdout = (stdout + chunk).slice(-64_000); });
    child.stderr.on("data", (chunk: string) => { stderr = (stderr + chunk).slice(-64_000); });
    child.once("error", (error) => { stderr = String(error.message); });
    child.once("close", (code) => { clearTimeout(timer); resolve({ commandId: command.id, display: [command.executable, ...command.args].join(" "), exitCode: code, timedOut, stdout: limited(stdout), stderr: limited(stderr), durationMs: Date.now() - started }); });
  });
}

function failedReport(runId: string, baselineCommit: string, changedPaths: string[], reason: string): GenericVerificationReport {
  return { authority: "independent_verifier", runId, baselineCommit, changedPaths, commands: [], passed: false, failureReason: reason };
}

/**
 * The independent verifier never trusts the implementation report. It scopes
 * the actual Git diff, then executes only exact, human-approved command specs.
 */
export class GenericVerifier {
  constructor(private readonly policy: GenericExecutionPolicy) {}

  async verify(runId: string, plan: ApprovedGenericPlan, worktree: GenericImplementationWorktree, runner: GenericWorktreeRunner, options: { requireCandidateChange?: boolean } = {}): Promise<GenericVerificationReport> {
    const policy = validateGenericPolicy(this.policy);
    const changedPaths = runner.changedPaths(worktree);
    if ((options.requireCandidateChange ?? true) && changedPaths.length === 0) return failedReport(runId, policy.baselineCommit, changedPaths, "Candidate contains no changes to verify.");
    if (changedPaths.some((item) => !plan.affectedPaths.includes(item) || !policy.allowedPaths.includes(item))) {
      return failedReport(runId, policy.baselineCommit, changedPaths, "Candidate changed a path outside the human-approved plan and policy.");
    }
    const commands: VerifiedCommandResult[] = [];
    for (const id of plan.commandIds) {
      try { commands.push(await execute(commandForId(id, policy), worktree.path)); }
      catch (error) { return { authority: "independent_verifier", runId, baselineCommit: policy.baselineCommit, changedPaths, commands, passed: false, failureReason: error instanceof Error ? error.message : "Verifier command could not be launched." }; }
    }
    const failed = commands.find((command) => command.exitCode !== 0 || command.timedOut);
    return { authority: "independent_verifier", runId, baselineCommit: policy.baselineCommit, changedPaths, commands, passed: !failed, failureReason: failed ? "Approved verifier command '" + failed.commandId + "' did not pass." : undefined };
  }

  async replayRegression(runId: string, plan: ApprovedGenericPlan, worktree: GenericImplementationWorktree, runner: GenericWorktreeRunner, mutation: RegressionMutation): Promise<GenericRegressionReplay> {
    const policy = validateGenericPolicy(this.policy);
    const targetPath = normalizeRepositoryPath(mutation.path);
    if (!plan.affectedPaths.includes(targetPath) || !policy.allowedPaths.includes(targetPath)) throw new Error("Regression mutation path is outside the approved plan and policy.");
    if (!mutation.expected || !mutation.replacement || mutation.expected === mutation.replacement || !mutation.approvedBy.trim() || !mutation.reason.trim() || Number.isNaN(Date.parse(mutation.approvedAt))) {
      throw new Error("Regression replay requires an approved, non-empty exact replacement mutation.");
    }
    const absoluteTarget = path.resolve(worktree.path, targetPath);
    if (!absoluteTarget.startsWith(path.resolve(worktree.path) + path.sep)) throw new Error("Regression mutation path escapes the candidate worktree.");
    const original = await readFile(absoluteTarget, "utf8");
    const occurrences = original.split(mutation.expected).length - 1;
    if (occurrences !== 1) throw new Error("Regression mutation expected text must occur exactly once.");
    await writeFile(absoluteTarget, original.replace(mutation.expected, mutation.replacement), "utf8");
    const verification = await this.verify(runId, plan, worktree, runner, { requireCandidateChange: false });
    return { authority: "independent_verifier", runId, mutation: { path: targetPath, approvedBy: mutation.approvedBy.trim(), approvedAt: mutation.approvedAt, reason: mutation.reason.trim() }, verification, status: verification.passed ? "regression_not_blocked" : "regression_blocked" };
  }
}
