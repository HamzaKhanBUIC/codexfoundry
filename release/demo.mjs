import { accessSync, constants, existsSync, readFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const foundry = resolve(root, "foundry");
const dashboard = resolve(foundry, "dashboard");
const runtimeRoot = resolve(root, ".foundry-runtime");
const manifestPath = resolve(root, "release", "demo-store-manifest.json");
const releaseFixture = resolve(runtimeRoot, "demo-store");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const requiredEvidence = [
  "RUN-PAY-17-001-intake.json",
  "RUN-PAY-17-001-plan.json",
  "RUN-PAY-17-001-verifier.json",
  "RUN-PAY-17-001-implementation.json",
  "RUN-PAY-17-001-human-approval.json",
  "RUN-PAY-17-001-vault-write.json",
  "RUN-PAY-17-001-regression-replay.json",
].map((name) => resolve(foundry, "evidence", name));

function fail(message) { console.error(`\n[Foundry demo] ${message}`); process.exit(1); }
function runnable(path) { try { accessSync(path, constants.R_OK); return true; } catch { return false; } }
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  if (result.error || result.status !== 0) {
    const detail = [result.stdout, result.stderr, result.error?.message].filter(Boolean).join("\n").trim();
    fail(`${command} ${args.join(" ")} failed.${detail ? `\n${detail}` : ""}`);
  }
  return result.stdout.trim();
}
function loadManifest() {
  if (!runnable(manifestPath)) fail(`Fixture manifest is missing: ${manifestPath}`);
  try { return JSON.parse(readFileSync(manifestPath, "utf8")); }
  catch { fail(`Fixture manifest is not valid JSON: ${manifestPath}`); }
}
function materializeFixture(manifest) {
  const configured = process.env.FOUNDRY_DEMO_STORE;
  if (configured) return resolve(configured);
  const bundle = resolve(root, "release", manifest.bundle);
  if (!runnable(bundle)) fail(`Frozen fixture bundle is missing: ${bundle}`);
  if (!existsSync(releaseFixture)) {
    console.log("[Foundry demo] Materializing the immutable PAY-17 fixture from the release bundle.");
    run("git", ["clone", "--quiet", bundle, releaseFixture]);
  }
  return releaseFixture;
}
function validateFixture(fixture, manifest) {
  if (!runnable(resolve(fixture, ".git"))) fail(`Fixture is not a Git checkout: ${fixture}`);
  const head = run("git", ["-C", fixture, "rev-parse", "HEAD"]);
  if (head !== manifest.baselineCommit) fail(`Fixture commit mismatch. Expected ${manifest.baselineCommit}; received ${head}.`);
  const packagePath = resolve(fixture, "package.json");
  if (!runnable(packagePath)) fail(`Fixture package manifest is missing: ${packagePath}`);
  let scripts;
  try { scripts = JSON.parse(readFileSync(packagePath, "utf8")).scripts ?? {}; }
  catch { fail(`Fixture package manifest is not valid JSON: ${packagePath}`); }
  for (const script of manifest.requiredScripts) if (typeof scripts[script] !== "string") fail(`Fixture is missing required npm script: ${script}`);
}
function ensureDependencies(directory) {
  if (existsSync(resolve(directory, "node_modules"))) return;
  console.log(`[Foundry demo] Installing dependencies in ${directory}`);
  const result = spawnSync(npm, ["ci", "--no-audit", "--no-fund"], {
    cwd: directory,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) fail(`Dependency installation failed in ${directory}.`);
}
async function validateBrowser(fixture, manifest) {
  let chromium;
  try {
    ({ chromium } = createRequire(resolve(fixture, "package.json"))("playwright"));
  } catch {
    fail("Playwright is unavailable after fixture dependency installation.");
  }
  try {
    const browser = await chromium.launch({ headless: true });
    await browser.close();
    console.log("[Foundry demo] Browser preflight: bundled Playwright Chromium is available.");
  } catch {
    try {
      const browser = await chromium.launch({ channel: "chrome", headless: true });
      await browser.close();
      console.log("[Foundry demo] Browser preflight: using installed Chrome fallback. For portable judging: " + manifest.browserPolicy.setup);
    } catch {
      fail(`No supported browser is available. Install bundled Chromium with: ${manifest.browserPolicy.setup}; or install Chrome for the documented fallback.`);
    }
  }
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
const manifest = loadManifest();
const fixture = materializeFixture(manifest);
validateFixture(fixture, manifest);

ensureDependencies(resolve(root, "memory"));
ensureDependencies(foundry);
ensureDependencies(dashboard);
ensureDependencies(fixture);
await validateBrowser(fixture, manifest);
const spawnOptions = { stdio: "inherit", shell: process.platform === "win32" };
const api = spawn(npm, ["run", "serve"], { cwd: foundry, ...spawnOptions });
const web = spawn(npm, ["run", "dev", "--", "--host", "127.0.0.1", "--port", "4173"], { cwd: dashboard, ...spawnOptions });
function stopChild(child) {
  if (!child.pid) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore", shell: true });
    return;
  }
  child.kill("SIGTERM");
}
const stop = () => { stopChild(api); stopChild(web); process.exit(); };
process.on("SIGINT", stop); process.on("SIGTERM", stop);
try {
  await waitForHealth("http://127.0.0.1:4174/api/health");
  console.log("\nCodex Foundry is ready.");
  console.log("Dashboard: http://127.0.0.1:4173");
  console.log("API health: http://127.0.0.1:4174/api/health");
  console.log("Press Ctrl+C to stop both local services.");
} catch (error) { stop(); fail(error instanceof Error ? error.message : "API startup failed."); }
