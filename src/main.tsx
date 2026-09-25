import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Code2,
  Copy,
  Database,
  Download,
  FileCode2,
  FlaskConical,
  Loader2,
  Play,
  RotateCcw,
  Square,
  Terminal,
  X,
} from "lucide-react";
import { scenarios, type Scenario } from "./core/scenarios";
import type { Report, Stage, Check as CheckResult } from "./core/engine";
import { limitations } from "./core/scope";
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "./style.css";
function StatusIcon({ status }: { status: string }) {
  return status === "pass" ? (
    <Check size={17} />
  ) : status === "fail" ? (
    <X size={17} />
  ) : status === "running" ? (
    <Loader2 className="spin" size={17} />
  ) : (
    <Circle size={14} />
  );
}
function App() {
  const [scenario, setScenario] = useState<Scenario>(scenarios[0]);
  const [sql, setSql] = useState(scenarios[0].proposed);
  const [source, setSource] = useState("Original proposal");
  const [report, setReport] = useState<Report | null>(null);
  const [previous, setPrevious] = useState<Report | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState("");
  const [copied, setCopied] = useState(false);
  const [bobOpen, setBobOpen] = useState(false);
  const [details, setDetails] = useState<CheckResult | null>(null);
  const worker = useRef<Worker | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      worker.current?.terminate();
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function clearWorker() {
    worker.current?.terminate();
    worker.current = null;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }
  function choose(s: Scenario) {
    clearWorker();
    setScenario(s);
    setSql(s.proposed);
    setSource("Original proposal");
    setReport(null);
    setPrevious(null);
    setStages([]);
    setSelected("");
    setDetails(null);
    setError("");
    setRunning(false);
  }
  function loadSql(kind: "original" | "reference") {
    setSql(kind === "original" ? scenario.proposed : scenario.reference);
    setSource(kind === "original" ? "Original proposal" : "Reference repair");
    setError("");
  }
  function run() {
    if (!sql.trim()) return;
    clearWorker();
    if (report) setPrevious(report);
    setReport(null);
    setStages([]);
    setDetails(null);
    setSelected("");
    setError("");
    setRunning(true);
    const w = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });
    worker.current = w;
    const fail = (msg: string) => {
      clearWorker();
      setRunning(false);
      setError(msg);
    };
    timer.current = setTimeout(
      () =>
        fail(
          "Run stopped after 60 seconds. Shorten the SQL or retry. No passing report was produced.",
        ),
      60000,
    );
    w.onerror = () =>
      fail(
        "The database worker stopped unexpectedly. Reload the page and try again.",
      );
    w.onmessage = ({ data }) => {
      if (data.type === "stage") {
        setStages((x) => [...x, data.stage]);
        setSelected(data.stage.id);
      } else if (data.type === "error") fail(data.error);
      else if (data.type === "done") {
        setReport(data.report);
        setSelected(
          data.report.stages.find((s: Stage) => s.status === "fail")?.id ||
            "rollback",
        );
        setRunning(false);
        clearWorker();
      }
    };
    w.postMessage({ scenarioId: scenario.id, sql, label: source });
  }
  const stageDefs = [
    scenario.stages[0],
    {
      id: "migration",
      title: "Apply migration",
      description: "Execute candidate SQL in an isolated database.",
    },
    {
      id: "new-only",
      title: "New-version smoke test",
      description: "Read from the new application contract.",
    },
    ...scenario.stages.slice(1),
  ];
  const active = stages.find((s) => s.id === selected);
  const stale = !!report && report.candidateSql !== sql;
  const smoke = report?.stages.find((s) => s.id === "new-only");
  function exportReport() {
    if (!report) return;
    const u = URL.createObjectURL(
      new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = u;
    a.download = `rehearsal-${scenario.id}-${report.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(u);
  }
  async function copyPrompt() {
    const prompt = `Use the Rehearsal MCP tools to repair the ${scenario.id} scenario. Inspect the scenario, rehearse this candidate, diagnose every failed contract, and write a compatible migration to candidates/${scenario.id}.sql. Rerun the exact same checks. Do not change fixtures, expected results, engine, or assertions. Preserve both old and new writers and the application rollback path. Explain remaining limitations.\n\nCandidate SQL:\n${sql}\n\n${report ? "Observed report:\n" + JSON.stringify(report) : "No rehearsal has been run yet."}`;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError(
        "Clipboard access failed. Download the report and share it in Bob IDE instead.",
      );
    }
  }
  return (
    <div className="app">
      <header className="topbar">
        <a href="#main" className="brand">
          <span className="brandmark">
            <RotateCcw size={21} />
          </span>
          rehearsal<span className="brand-dot">.</span>
        </a>
        <div className="top-note">
          <span className="status-dot" />
          Local PostgreSQL sandbox
        </div>
        <button className="text-button" onClick={() => setBobOpen(!bobOpen)}>
          <Code2 size={16} />
          Use with IBM Bob
          <ArrowUpRight size={15} />
        </button>
      </header>
      <div className="workspace">
        <aside className="sidebar">
          <div className="project">
            <Database size={19} />
            <div>
              <strong>Orders service</strong>
              <span>Synthetic sample project</span>
            </div>
          </div>
          <div className="sidebar-label">Migration scenarios</div>
          <nav aria-label="Migration scenarios">
            {scenarios.map((s, i) => (
              <button
                key={s.id}
                className={`case ${s.id === scenario.id ? "active" : ""}`}
                aria-current={s.id === scenario.id ? "true" : undefined}
                onClick={() => choose(s)}
                disabled={running}
              >
                <span className="case-index">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <strong>{s.name}</strong>
                  <small>{s.short}</small>
                </span>
                {s.id === scenario.id && <ChevronRight size={15} />}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <FlaskConical size={22} />
            <h3>Break it here first.</h3>
            <p>
              Every run starts with fresh sample data. Your production database
              is never connected.
            </p>
            <a href="#scope">
              What this tests
              <ArrowRight size={14} />
            </a>
          </div>
        </aside>
        <main id="main">
          <div className="page-heading">
            <div>
              <h1>Test the whole rollout.</h1>
              <p>
                A migration can pass while older application instances fail.
              </p>
            </div>
            <span className="engine-label">PostgreSQL · PGlite</span>
          </div>
          {bobOpen && (
            <section className="bob-panel" aria-label="IBM Bob workflow">
              <div>
                <h2>Give Bob the failure. Keep the tests.</h2>
                <p>
                  Connect this project’s MCP server in Bob IDE. Bob can inspect
                  the contracts, rehearse a migration, and write a repair. Paste
                  the repaired SQL below and run it again.
                </p>
                <code>npm run mcp</code>
                <p className="small">
                  Bob runs in your IDE. This browser demo does not call an AI
                  service. Reference repairs are included examples, not live Bob
                  output.
                </p>
              </div>
              <button className="secondary" onClick={copyPrompt}>
                <Copy size={15} />
                {copied ? "Copied" : "Copy Bob task"}
              </button>
              <button
                className="icon-button"
                aria-label="Close Bob workflow"
                onClick={() => setBobOpen(false)}
              >
                <X size={18} />
              </button>
            </section>
          )}
          <section className="experiment">
            <div className="experiment-head">
              <div className="case-title">
                <FileCode2 size={20} />
                <h2>{scenario.name}</h2>
              </div>
              <span className="sample-label">Synthetic sample</span>
            </div>
            <p className="scenario-description">{scenario.description}</p>
            {report && (
              <div
                className={`run-summary ${stale ? "stale" : report.status}`}
                role="status"
              >
                <StatusIcon status={stale ? "pending" : report.status} />
                <div>
                  <strong>
                    {stale
                      ? "SQL edited · results are from the previous candidate"
                      : report.status === "pass"
                        ? "All sampled contracts passed"
                        : `${report.failed} checks failed · migration blocked`}
                  </strong>
                  <span>
                    {stale
                      ? "Run again to test this SQL."
                      : `${report.passed} passed · ${report.failed} failed · ${report.skipped} skipped${smoke?.status === "pass" && report.status === "fail" ? " · New-version smoke test passed" : ""}`}
                  </span>
                </div>
                <button
                  onClick={() =>
                    document
                      .getElementById("evidence")
                      ?.scrollIntoView({
                        behavior: window.matchMedia(
                          "(prefers-reduced-motion: reduce)",
                        ).matches
                          ? "auto"
                          : "smooth",
                        block: "start",
                      })
                  }
                >
                  View evidence <ArrowRight size={14} />
                </button>
              </div>
            )}
            <div className="workbench">
              <div className="editor-column">
                <div className="editor-toolbar">
                  <label htmlFor="migration">Migration SQL</label>
                  <span className="source-label">{source}</span>
                </div>
                <div className="editor-wrap">
                  <div aria-hidden="true" className="line-numbers">
                    {sql.split("\n").map((_, i) => (
                      <span key={i}>{i + 1}</span>
                    ))}
                  </div>
                  <textarea
                    id="migration"
                    spellCheck={false}
                    onScroll={(e) => {
                      const gutter = e.currentTarget.previousElementSibling;
                      if (gutter) gutter.scrollTop = e.currentTarget.scrollTop;
                    }}
                    maxLength={20000}
                    value={sql}
                    disabled={running}
                    onChange={(e) => {
                      setSql(e.target.value);
                      setSource("Custom candidate");
                    }}
                    aria-describedby="sql-note"
                  />
                </div>
                <div className="editor-bottom">
                  <span id="sql-note">Editable · isolated in memory</span>
                  <span>{sql.split("\n").length} lines</span>
                </div>
                <div className="editor-actions">
                  <button
                    className="primary"
                    onClick={run}
                    disabled={running || !sql.trim()}
                  >
                    {running ? (
                      <Loader2 className="spin" size={17} />
                    ) : (
                      <Play size={16} />
                    )}{" "}
                    {running ? "Running rehearsal" : "Run rehearsal"}
                  </button>
                  {running ? (
                    <button
                      className="text-button"
                      onClick={() => {
                        clearWorker();
                        setRunning(false);
                        setError(
                          "Run cancelled. No passing report was produced.",
                        );
                      }}
                    >
                      <Square size={14} />
                      Cancel
                    </button>
                  ) : (
                    <button
                      className="text-button"
                      onClick={() => loadSql("original")}
                    >
                      <RotateCcw size={14} />
                      Reset SQL
                    </button>
                  )}
                </div>
                <div className="reference">
                  <button
                    onClick={() => loadSql("reference")}
                    disabled={running}
                  >
                    Load reference repair <ArrowRight size={15} />
                  </button>
                  <p>
                    Explore a compatible migration, or paste your own repair.
                  </p>
                </div>
              </div>
              <div className="timeline-column">
                <div className="timeline-heading">
                  <h3>Deployment sequence</h3>
                  <span>5 stages</span>
                </div>
                <ol className="timeline">
                  {stageDefs.map((def, i) => {
                    const stage = stages.find((s) => s.id === def.id);
                    const state =
                      stage?.status ||
                      (running && i === stages.length ? "running" : "pending");
                    return (
                      <li key={def.id}>
                        <button
                          disabled={!stage}
                          className={`phase ${state} ${selected === def.id ? "selected" : ""}`}
                          onClick={() => {
                            setSelected(def.id);
                            setDetails(null);
                            document
                              .getElementById("evidence")
                              ?.scrollIntoView({
                                behavior: window.matchMedia(
                                  "(prefers-reduced-motion: reduce)",
                                ).matches
                                  ? "auto"
                                  : "smooth",
                                block: "start",
                              });
                          }}
                        >
                          <span className="phase-symbol">
                            <StatusIcon status={state} />
                          </span>
                          <span className="phase-copy">
                            <strong>{def.title}</strong>
                            <small>
                              {stage
                                ? `${stage.checks.filter((c) => c.status === "pass").length}/${stage.checks.length} checks passed`
                                : state === "running"
                                  ? "Executing SQL…"
                                  : def.description}
                            </small>
                          </span>
                          <span className={`phase-state ${state}`}>
                            {state === "pending"
                              ? "Waiting"
                              : state === "running"
                                ? "Running"
                                : state === "pass"
                                  ? "Passed"
                                  : state === "fail"
                                    ? "Failed"
                                    : "Skipped"}
                            {stage && (
                              <small className="view-checks">
                                View checks <ArrowRight size={11} />
                              </small>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
                <div className="sequence-note">
                  <RotateCcw size={15} />
                  <span>
                    Application rollback keeps the migrated schema and checks
                    the old reader against new writes.
                  </span>
                </div>
              </div>
            </div>
          </section>
          <div aria-live="polite" className="live-status">
            {running
              ? "Rehearsal in progress."
              : report
                ? `Rehearsal complete. ${report.failed} failed checks, ${report.passed} passed checks.`
                : ""}
          </div>
          {error && (
            <div className="error" role="alert">
              <X size={18} />
              <span>{error}</span>
            </div>
          )}
          {report && (
            <section className={`verdict ${report.status}`}>
              <div className="verdict-icon">
                <StatusIcon status={report.status} />
              </div>
              <div>
                <h2>
                  {report.status === "pass"
                    ? "All sampled contracts passed"
                    : "This migration is blocked"}
                </h2>
                <p>
                  {smoke?.status === "pass" && report.status === "fail"
                    ? "The new-version smoke test passed. The deployment rehearsal found failures."
                    : report.status === "pass"
                      ? "Old and new application contracts passed the sampled rollout and rollback sequence."
                      : "The migration cannot complete the sampled deployment sequence."}
                </p>
                <div className="report-meta">
                  {report.passed} passed · {report.failed} failed ·{" "}
                  {report.skipped} skipped{" "}
                  <span>
                    {" "}
                    {(report.durationMs / 1000).toFixed(2)}s ·{" "}
                    {report.candidateLabel}
                  </span>
                </div>
                {stale && (
                  <p className="stale">
                    SQL has changed. These results belong to the previous
                    candidate. Run again to test your edits.
                  </p>
                )}
                {previous && previous.scenarioId === scenario.id && (
                  <p className="comparison">
                    Previous run: {previous.failed} failures. This run:{" "}
                    {report.failed}. Same scenario and assertions.
                  </p>
                )}
              </div>
              <button className="secondary" onClick={exportReport}>
                <Download size={16} />
                Export evidence
              </button>
            </section>
          )}
          {active && (
            <section className="evidence" id="evidence">
              <div className="evidence-heading">
                <h2>{active.title}</h2>
                <span>Executed query evidence</span>
              </div>
              <div className="checks">
                {active.checks.map((c, i) => (
                  <div className="check-container" key={`${active.id}-${i}`}>
                    <button
                      className={`check-row ${c.status}`}
                      onClick={() => setDetails(details === c ? null : c)}
                      aria-expanded={details === c}
                    >
                      <StatusIcon status={c.status} />
                      <span>{c.label}</span>
                      <span className="query-time">{c.durationMs} ms</span>
                      <ChevronDown size={15} />
                    </button>
                    {details === c && (
                      <div className="query-details">
                        <label>SQL</label>
                        <pre>{c.sql}</pre>
                        {c.error && (
                          <p className="query-error">
                            {c.code && `SQLSTATE ${c.code}: `}
                            {c.error}
                          </p>
                        )}
                        <div className="result-columns">
                          <div>
                            <label>Expected</label>
                            <pre>{JSON.stringify(c.expected, null, 2)}</pre>
                          </div>
                          <div>
                            <label>Actual</label>
                            <pre>
                              {c.actual
                                ? JSON.stringify(c.actual, null, 2)
                                : c.status === "pass"
                                  ? "Statement completed."
                                  : "No result returned."}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
          {!report && !running && !stages.length && (
            <div className="empty-evidence">
              <Terminal size={20} />
              <div>
                <strong>Your first run starts with the risky proposal.</strong>
                <p>
                  Run it, inspect a failed check, then try a repair against the
                  same assertions.
                </p>
              </div>
            </div>
          )}
          <section id="scope" className="scope">
            <details>
              <summary>
                What this rehearsal proves <ChevronDown size={15} />
              </summary>
              <ul>
                {limitations.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
              {report && <code>{report.engine}</code>}
            </details>
            <span>
              Original synthetic fixtures · No data leaves this browser
            </span>
          </section>
          <footer>
            <span>Built for the IBM Bob 2.0 Hackathon</span>
            <button
              className="text-button"
              onClick={() => {
                setBobOpen(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Connect your Bob workflow <ArrowUpRight size={14} />
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
