import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPay17RunProjection } from "../src/run-evidence-projection.ts";

const dashboardDirectory = path.dirname(fileURLToPath(import.meta.url));
const evidenceDirectory = path.resolve(dashboardDirectory, "../evidence");
const virtualRunModule = "virtual:foundry-run";
const resolvedVirtualRunModule = `\0${virtualRunModule}`;

function projectRun(): string {
  return JSON.stringify(loadPay17RunProjection(evidenceDirectory));
}

export default defineConfig({
  server: { host: "127.0.0.1", port: 4173 },
  plugins: [
    react(),
    {
      name: "foundry-run-artifact-projection",
      resolveId(id) {
        return id === virtualRunModule ? resolvedVirtualRunModule : undefined;
      },
      load(id) {
        return id === resolvedVirtualRunModule ? `export default ${projectRun()};` : undefined;
      },
    },
  ],
});
