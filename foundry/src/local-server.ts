import path from "node:path";
import { fileURLToPath } from "node:url";
import { createFoundryReadApi } from "./read-api.js";

const sourceDirectory = path.dirname(fileURLToPath(import.meta.url));
const evidenceDirectory = path.resolve(sourceDirectory, "../evidence");
const port = Number(process.env.FOUNDRY_PORT ?? 4174);

createFoundryReadApi(evidenceDirectory).listen(port, "127.0.0.1", () => {
  console.log(`Codex Foundry read API listening at http://127.0.0.1:${port}`);
});
