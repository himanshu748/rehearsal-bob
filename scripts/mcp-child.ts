import { rehearse } from "../src/core/engine";
let raw = "";
for await (const chunk of process.stdin) raw += chunk;
const { scenarioId, sql } = JSON.parse(raw);
console.log(
  JSON.stringify(await rehearse(scenarioId, sql, "Bob MCP candidate")),
);
