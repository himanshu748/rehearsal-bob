import { readFile, writeFile } from "node:fs/promises";
import { rehearse } from "../src/core/engine";
import { getScenario } from "../src/core/scenarios";
const [id = "rename", source = "proposed", output] = process.argv.slice(2);
const scenario = getScenario(id);
const sql =
  source === "proposed"
    ? scenario.proposed
    : source === "reference"
      ? scenario.reference
      : await readFile(source, "utf8");
const report = await rehearse(
  id,
  sql,
  source === "reference"
    ? "Reference repair"
    : source === "proposed"
      ? "Original proposal"
      : "Candidate file",
);
const json = JSON.stringify(report, null, 2);
if (output) await writeFile(output, json + "\n");
console.log(json);
process.exitCode = report.status === "pass" ? 0 : 1;
