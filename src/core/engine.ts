import { PGlite } from "@electric-sql/pglite";
import { getScenario, type CheckSpec } from "./scenarios";
export type Check = CheckSpec & {
  status: "pass" | "fail" | "skipped";
  actual?: unknown[];
  error?: string;
  code?: string;
  durationMs: number;
};
export type Stage = {
  id: string;
  title: string;
  description: string;
  status: "pass" | "fail" | "skipped";
  checks: Check[];
};
export type Report = {
  schemaVersion: 1;
  id: string;
  scenarioId: string;
  startedAt: string;
  durationMs: number;
  engine: string;
  candidateSql: string;
  candidateLabel: string;
  status: "pass" | "fail";
  stages: Stage[];
  passed: number;
  failed: number;
  skipped: number;
  limitations: string[];
};
import { limitations } from "./scope";
export { limitations } from "./scope";
function stable(v: unknown): string {
  if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
  if (v !== null && typeof v === "object")
    return (
      "{" +
      Object.entries(v)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, x]) => JSON.stringify(k) + ":" + stable(x))
        .join(",") +
      "}"
    );
  return JSON.stringify(v);
}
export async function rehearse(
  scenarioId: string,
  sql: string,
  label = "Custom candidate",
  onStage?: (s: Stage) => void,
): Promise<Report> {
  if (!sql.trim() || sql.length > 20000)
    throw new Error("Enter a migration between 1 and 20,000 characters.");
  const s = getScenario(scenarioId),
    start = performance.now(),
    startedAt = new Date().toISOString();
  const db = await PGlite.create();
  const stages: Stage[] = [];
  const append = (stage: Stage) => {
    stages.push(stage);
    onStage?.(stage);
  };
  try {
    await db.exec(s.setup);
    const engine = String(
      (await db.query<{ version: string }>("SELECT version()")).rows[0].version,
    );
    const runCheck = async (c: CheckSpec): Promise<Check> => {
      const t = performance.now();
      let actual: unknown[] | undefined;
      try {
        await db.transaction(async (tx) => {
          const result = await tx.query(c.sql);
          actual = result.rows;
          if (stable(actual) !== stable(c.expected))
            throw new Error(
              "Result differs from the unchanged application contract.",
            );
        });
        return {
          ...c,
          status: "pass",
          actual,
          durationMs: Math.round(performance.now() - t),
        };
      } catch (e) {
        return {
          ...c,
          status: "fail",
          actual,
          error: e instanceof Error ? e.message : String(e),
          code: (e as { code?: string }).code,
          durationMs: Math.round(performance.now() - t),
        };
      }
    };
    const runStage = async (spec: (typeof s.stages)[number], skip = false) => {
      const checks: Check[] = [];
      for (const c of spec.checks)
        checks.push(
          skip
            ? {
                ...c,
                status: "skipped",
                durationMs: 0,
                error: "Migration failed; this stage was not executed.",
              }
            : await runCheck(c),
        );
      append({
        ...spec,
        checks,
        status: skip
          ? "skipped"
          : checks.some((c) => c.status === "fail")
            ? "fail"
            : "pass",
      });
    };
    await runStage(s.stages[0]);
    const t = performance.now();
    let migrationOK = true;
    try {
      await db.transaction(async (tx) => {
        await tx.exec(sql);
      });
      append({
        id: "migration",
        title: "Apply migration",
        description: "Execute the candidate SQL in a fresh, isolated database.",
        status: "pass",
        checks: [
          {
            id: "apply",
            label: "Candidate SQL executes",
            sql,
            expected: [],
            status: "pass",
            durationMs: Math.round(performance.now() - t),
          },
        ],
      });
    } catch (e) {
      migrationOK = false;
      append({
        id: "migration",
        title: "Apply migration",
        description:
          "The migration failed and its transaction was rolled back.",
        status: "fail",
        checks: [
          {
            id: "apply",
            label: "Candidate SQL executes",
            sql,
            expected: [],
            status: "fail",
            durationMs: Math.round(performance.now() - t),
            error: e instanceof Error ? e.message : String(e),
            code: (e as { code?: string }).code,
          },
        ],
      });
    }
    await runStage(
      {
        id: "new-only",
        title: "New-version smoke test",
        description: "The limited check a conventional deployment might run.",
        checks: [s.newOnly],
      },
      !migrationOK,
    );
    for (const spec of s.stages.slice(1)) await runStage(spec, !migrationOK);
    const checks = stages.flatMap((s) => s.checks),
      failed = checks.filter((c) => c.status === "fail").length;
    return {
      schemaVersion: 1,
      id: crypto.randomUUID(),
      scenarioId,
      startedAt,
      durationMs: Math.round(performance.now() - start),
      engine,
      candidateSql: sql,
      candidateLabel: label,
      status: failed ? "fail" : "pass",
      stages,
      passed: checks.filter((c) => c.status === "pass").length,
      failed,
      skipped: checks.filter((c) => c.status === "skipped").length,
      limitations,
    };
  } finally {
    await db.close();
  }
}
