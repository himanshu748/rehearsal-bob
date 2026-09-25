# Rehearsal

A PostgreSQL migration can pass a new-version smoke test and still break older application instances during rollout. Rehearsal executes the old and new query contracts through migration, mixed-version writes, and application rollback. Its MCP server gives IBM Bob the failed SQL and unchanged expectations so a repair can be tested against the same checks.

**Hackathon build in progress.** Bob IDE task evidence and final submission media are still pending. Included reference repairs are authored examples, not claimed live Bob output.

## Run

Requires Node.js 22 or later.

```sh
npm ci
npm run dev
```

Open the local Vite URL. No credentials or database setup are needed. PostgreSQL runs in a dedicated browser worker through PGlite. The first run downloads the bundled engine assets; each run uses a fresh in-memory database.

1. Run the original column-rename proposal.
2. Observe the passing new-version smoke test and failing old-version contracts.
3. Open a failed assertion to inspect the SQL and error.
4. Load the reference repair or paste your own SQL. Run the same checks again.
5. Export the actual report, including candidate SQL, expected/actual rows, engine version, timing and scope limits.

The other scenarios cover introducing a required field and losing fractional monetary values during a type conversion. The sample orders are original synthetic records.

## IBM Bob workflow

Open this repository in **IBM Bob IDE**. Configure the Rehearsal stdio MCP server to run `npm run --silent mcp` from the repository directory; `.bob/mcp.json` is provided. Installation/path configuration may depend on your Bob version. No tools are auto-approved.

The server exposes `list_scenarios`, `inspect_scenario`, and `rehearse_migration`. The inspection tool exposes the fixture and assertions, but not the included reference repair. Each rehearsal is a separate process with a 60-second timeout.

Use the browser's **Use with IBM Bob → Copy Bob task** action, or this task:

> Inspect the rename scenario through Rehearsal MCP. Run the proposed migration, diagnose the failed contracts, and write a compatible repair to candidates/rename.sql. Keep the fixtures, engine, and expectations unchanged. Rerun the same checks. Preserve old and new writers and application rollback. Explain the remaining limitations.

Store authentic consumption-summary PNG screenshots for every relevant Bob IDE task in `bob_sessions/`. A placeholder folder does not satisfy the event's evidence requirement.

## CLI and checks

```sh
npm test
npm run build
npm run rehearse -- rename proposed
npm run rehearse -- rename reference
npm run rehearse -- rename candidates/rename.sql report.json
```

A failed report exits with status 1. CLI reports are JSON. Timing measures one local rehearsal; it is not an estimate of developer time saved.

## What this proves

- These are sequential SQL contracts, not running application binaries or concurrent database clients.
- It does not test locks, load, replicas, production datasets, cloud database permissions, or network failures.
- Application rollback retains the migrated schema and new data. It does not run a destructive down-migration.
- A passing report means the sampled assertions passed. It is not production certification.
- All queries are executed in a disposable PGlite database. The browser demo makes no AI calls and connects to no production database.
- The MCP server is local stdio only. It accepts SQL for synthetic fixtures, not a database URL. Run locally as a development tool; do not expose it as an unauthenticated public service.

## Architecture

`src/core/scenarios.ts` holds the fixtures and query contracts. `src/core/engine.ts` executes those contracts in PostgreSQL. `src/worker.ts` isolates browser execution. `scripts/mcp.ts` provides the same engine to Bob through a time-bounded child process. The React interface renders the reports without inventing successful stages.

## License

MIT. Third-party libraries retain their own licenses. IBM Bob is separate proprietary software and is not redistributed in this repository.
