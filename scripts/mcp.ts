import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { scenarios, getScenario } from "../src/core/scenarios";
const server = new McpServer({ name: "rehearsal", version: "0.1.0" });
const result = (x: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(x, null, 2) }],
});
server.registerTool(
  "list_scenarios",
  {
    description:
      "List original synthetic PostgreSQL migration rehearsal scenarios. No production connection is used.",
  },
  async () =>
    result(
      scenarios.map(({ id, name, description }) => ({ id, name, description })),
    ),
);
server.registerTool(
  "inspect_scenario",
  {
    description:
      "Get immutable setup, proposed SQL, and application query assertions. Repair SQL without changing expectations. The reference solution is intentionally not exposed.",
    inputSchema: { scenarioId: z.enum(["rename", "required", "precision"]) },
  },
  async ({ scenarioId }) => {
    const { reference, ...s } = getScenario(scenarioId);
    return result(s);
  },
);
server.registerTool(
  "rehearse_migration",
  {
    description:
      "Execute a candidate SQL migration against a fresh in-memory PostgreSQL/PGlite instance. Tests old/new reads and writes and application rollback. Returns actual SQL errors, expected and actual rows. Sequential contracts only: no concurrent clients or load. A failing migration is an informative result, not a tool failure. Max runtime 60 seconds.",
    inputSchema: {
      scenarioId: z.enum(["rename", "required", "precision"]),
      sql: z.string().min(1).max(20000),
    },
  },
  async (args) => {
    try {
      const report = await new Promise<unknown>((resolve, reject) => {
        const child = execFile(
          process.execPath,
          [
            "--import",
            "tsx",
            fileURLToPath(new URL("./mcp-child.ts", import.meta.url)),
          ],
          {
            timeout: 60000,
            maxBuffer: 2 * 1024 * 1024,
            cwd: fileURLToPath(new URL("..", import.meta.url)),
          },
          (err, stdout) => {
            if (err)
              return reject(
                new Error(
                  "Rehearsal process failed or exceeded its 60 second limit. No passing report produced.",
                ),
              );
            try {
              resolve(JSON.parse(stdout));
            } catch {
              reject(new Error("Invalid rehearsal output"));
            }
          },
        );
        child.stdin?.end(JSON.stringify(args));
      });
      return result(report);
    } catch (e) {
      return {
        ...result({ error: e instanceof Error ? e.message : String(e) }),
        isError: true,
      };
    }
  },
);
await server.connect(new StdioServerTransport());
