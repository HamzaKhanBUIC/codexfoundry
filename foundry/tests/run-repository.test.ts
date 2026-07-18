import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openFoundryDatabase } from "../src/database.js";
import { RunRepository } from "../src/run-repository.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

async function repository() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "codex-foundry-run-"));
  temporaryDirectories.push(directory);
  const database = openFoundryDatabase(path.join(directory, "foundry.sqlite"));
  return { database, repository: new RunRepository(database), databasePath: path.join(directory, "foundry.sqlite") };
}

const runInput = {
  id: "RUN-PAY-17-001",
  issue: {
    title: "Duplicate charge after checkout retry",
    labels: ["payments", "idempotency"],
  },
  repositoryCommit: "1169daf",
};

describe("RunRepository", () => {
  it("persists a run and append-only transition history across database reload", async () => {
    const first = await repository();
    first.repository.create(runInput);
    first.repository.transition(runInput.id, "memory_compiled", "system");
    first.database.close();

    const reloadedDatabase = openFoundryDatabase(first.databasePath);
    const run = new RunRepository(reloadedDatabase).get(runInput.id);

    expect(run).toMatchObject({
      id: runInput.id,
      repositoryCommit: "1169daf",
      status: "memory_compiled",
      correctionAttempts: 0,
    });
    expect(run.events.map((event) => [event.fromStatus, event.toStatus])).toEqual([
      [null, "intake"],
      ["intake", "memory_compiled"],
    ]);
    reloadedDatabase.close();
  });

  it("rejects invalid and terminal transitions", async () => {
    const { database, repository: runs } = await repository();
    runs.create(runInput);

    expect(() => runs.transition(runInput.id, "implementing", "implementer")).toThrow("Invalid run transition");
    runs.transition(runInput.id, "memory_compiled", "system");
    runs.transition(runInput.id, "plan_pending_approval", "planner");
    runs.transition(runInput.id, "stopped", "human", "Acceptance criteria need clarification");
    expect(() => runs.transition(runInput.id, "memory_compiled", "system")).toThrow("Invalid run transition");
    database.close();
  });

  it("allows exactly one verifier-directed correction loop", async () => {
    const { database, repository: runs } = await repository();
    runs.create(runInput);
    runs.transition(runInput.id, "memory_compiled", "system");
    runs.transition(runInput.id, "plan_pending_approval", "planner");
    runs.transition(runInput.id, "implementing", "human");
    runs.transition(runInput.id, "verifying", "implementer");
    const corrected = runs.transition(runInput.id, "implementing", "verifier", "Retry key still changes");

    expect(corrected.correctionAttempts).toBe(1);
    runs.transition(runInput.id, "verifying", "implementer");
    expect(() => runs.transition(runInput.id, "implementing", "verifier")).toThrow("exhausted");
    database.close();
  });
});
