# Rehearsal

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Delegated through the user's instruction to keep doing everything. Proposed implementation: TypeScript/Node, React/Vite, native PostgreSQL 16, MCP stdio integration with IBM Bob IDE. Choices are implementation assumptions, not user-specified technologies.

## Users
Proposed target: developers reviewing a database migration before a rolling release. Hackathon judges must be able to reproduce a failure and understand the repair.

## Product Purpose
Run old and new application queries across migration stages, writes, and application rollback to catch failures hidden by tests against only the final schema.

## Positioning
A bounded deployment rehearsal, including persisted data and mixed application versions. General-purpose code review, arbitrary production databases, and comprehensive migration safety guarantees are excluded.

## Operating Context
IBM Bob 2.0 Hackathon September 25–27, 2026. Bob IDE must play a core role, with real task-summary screenshots in bob_sessions. Node and PostgreSQL 16 are locally available. Only original synthetic records used as sample data.

## Capabilities and Constraints
Planned: three sample migration cases, real isolated PostgreSQL execution, phase/query evidence, MCP tools Bob can call, editable candidate SQL, rerun comparisons, export report. No successful Bob integration or benchmarks exist yet. UI must show actual run results and distinguish reference repair from a Bob-authored candidate.

## Evidence on Hand
Official IBM guide in work/ibm-guide.txt. Approval and account invite verified via personal Gmail. Private email contents must not enter the public repository. No customers, adoption, or human-time baseline measurements exist.

## Product Principles
- Tests execute against a real database; the timeline reflects actual output.
- Preserve the same assertions when comparing repairs.
- Each rehearsal is isolated from existing user databases.
- Failure and incomplete verification are visible.
- Show Bob's actual contribution and consumption, never invented runs.
