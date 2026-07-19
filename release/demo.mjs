import { accessSync, constants, existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const foundry = resolve(root, "foundry");
const dashboard = resolve(foundry, "dashboard");
const fixture = process.env.FOUNDRY_DEMO_STORE ?? resolve(root, "demo-store");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const requiredEvidence = [
  "RUN-PAY-17-001-verifier.json",
  "RUN-PAY-17-001-implementation.json",
  "RUN-PAY-17-001-human-approval.json",
  "RUN-PAY-17-001-vault-write.json",
  "RUN-PAY-17-001-regression-replay.json",
].map((name) => resolve(foundry, "evidence", name));

function fail(message) { console.error(`\n[Foundry demo] ${message}`); process.exit(1); }
function runnable(path) { try { accessSync(path, constants.R_OK); return true; } catch { return false; } }
function ensureDependencies(directory) {
  if (existsSync(resolve(directory, "node_modules"))) return;
  console.log(`[Foundry demo] Installing dependencies in ${directory}`);
  const result = spawnSync(npm, ["ci", "--no-audit", "--no-fund"], { cwd: directory, stdio: "inherit" });
  if (result.status !== 0) fail(`Dependency installation failed in ${directory}.`);
}
function waitForHealth(url, attempts = 30) {
  return new Promise((resolveHealth, reject) => {
    let remaining = attempts;
    const probe = async () => {
      try { if ((await fetch(url)).ok) return resolveHealth(); } catch { /* service not ready */ }
      remaining -= 1;
      if (!remaining) return reject(new Error(`Timed out waiting for ${url}`));
      setTimeout(probe, 500);
    };
    void probe();
  });
}

if (!runnable(foundry) || !runnable(dashboard)) fail("Expected foundry/ and foundry/dashboard/ in the release root.");
for (const file of requiredEvidence) if (!runnable(file)) fail(`Required evidence artifact is missing: ${file}`);
if (!runnable(fixture)) console.warn(`[Foundry demo] Frozen demo-store is not present at ${fixture}. The evidence dashboard will run, but live fixture replay is unavailable. Set FOUNDRY_DEMO_STORE or integrate the frozen fixture before submission.`);

ensureDependencies(resolve(root, "memory"));
ensureDependencies(foundry);
ensureDependencies(dashboard);
const spawnOptions = { stdio: "inherit", shell: process.platform === "win32" };
const api = spawn(npm, ["run", "serve"], { cwd: foundry, ...spawnOptions });
const web = spawn(npm, ["run", "dev", "--", "--host", "127.0.0.1", "--port", "4173"], { cwd: dashboard, ...spawnOptions });
const stop = () => { api.kill(); web.kill(); process.exit(); };
process.on("SIGINT", stop); process.on("SIGTERM", stop);
try {
  await waitForHealth("http://127.0.0.1:4174/api/health");
  console.log("\nCodex Foundry is ready.");
  console.log("Dashboard: http://127.0.0.1:4173");
  console.log("API health: http://127.0.0.1:4174/api/health");
  console.log("Press Ctrl+C to stop both local services.");
} catch (error) { stop(); fail(error instanceof Error ? error.message : "API startup failed."); }
