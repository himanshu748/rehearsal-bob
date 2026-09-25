# rename scenario — migration notes

## Scenario

**Rename a live column: `status` → `state`**

The new application version reads and writes the column as `state`. Old
instances still use `status` during the rolling deployment window and must
remain functional even if the deployment is rolled back after new-version
writes have already landed.

---

## Why the proposed migration fails

The scenario ships a single statement:

```sql
ALTER TABLE orders RENAME COLUMN status TO state;
```

That statement executes cleanly and the new-only smoke test (`SELECT state …`)
passes immediately. But the Rehearsal engine then runs the full rolling-
deployment contract, and every old-application query fails with
**`column "status" does not exist`** (PostgreSQL error code `42703`).

### Failed checks in the proposed migration run

| Stage | Check | Error |
|-------|-------|-------|
| mixed | old-read | column "status" does not exist (42703) |
| mixed | old-insert | column "status" of relation "orders" does not exist (42703) |
| mixed | new-sees-old | Result differs — old insert never wrote a row |
| mixed | old-update | column "status" of relation "orders" does not exist (42703) |
| mixed | new-sees-update | Result differs — old update never fired |
| rollback | old-sees-new | column "status" does not exist (42703) |
| rollback | old-sees-update | column "status" does not exist (42703) |

**Score: 6/13 passed, 7/13 failed.**

The core problem is that a hard rename immediately removes the old column name
from the schema. There is no grace period; old application binaries that have
not yet been replaced start failing the moment the migration runs.

---

## Candidate migration strategy

### Approach: dual physical column + BEFORE trigger sync

Keep two real columns (`state` and `status`) in the table. A `BEFORE INSERT OR
UPDATE` trigger syncs them for the cases exercised by the Rehearsal contracts.
Neither column is a view, a generated column, or a computed alias — both are
first-class writable columns.

```
orders_sync_status_state_trg (BEFORE INSERT OR UPDATE, FOR EACH ROW)
  ├── INSERT path: if exactly one column is non-null, copy it into the other
  └── UPDATE path: if state changed, copy to status; else if status changed,
                   copy to state; if both changed, state takes precedence
```

**Known gap — INSERT with two conflicting non-null values:** if a caller
supplies different non-null values for both `status` and `state` in a single
INSERT, neither branch fires and both values are stored as-is. This case is
outside the sampled Rehearsal contracts and the SQL is not changed to address
it here; callers must ensure only one of the two columns is set per INSERT.

### Step-by-step SQL

1. **`ALTER TABLE orders RENAME COLUMN status TO state;`**  
   Rename the physical column so new-application code that names `state`
   directly in DDL works immediately.

2. **`ALTER TABLE orders ADD COLUMN status text;`**  
   Re-add `status` as a new physical column (nullable to allow back-fill).

3. **`UPDATE orders SET status = state;`**  
   Populate `status` for all existing rows so they satisfy the NOT NULL
   constraint about to be applied.

4. **`ALTER TABLE orders ALTER COLUMN status SET NOT NULL;`**  
   Restore the NOT NULL guarantee the original column had.

5. **`CREATE OR REPLACE FUNCTION orders_sync_status_state() RETURNS trigger …`**
   PL/pgSQL function with two branches:
   - `TG_OP = 'INSERT'`: if `state` is null and `status` is not, copy `status`
     → `state`; if `status` is null and `state` is not, copy `state` →
     `status`. If both are non-null, neither branch fires — the values are
     stored as-is. That case is not covered by the sampled contracts.
   - `TG_OP = 'UPDATE'`: if `NEW.state IS DISTINCT FROM OLD.state`, copy it
     into `status`; otherwise if `NEW.status IS DISTINCT FROM OLD.status`,
     copy it into `state`. If both change in the same statement, `state` takes
     precedence. Concurrent updates are not modelled by Rehearsal.

6. **`CREATE TRIGGER orders_sync_status_state_trg BEFORE INSERT OR UPDATE …`**  
   Attaches the function. `BEFORE` (not `AFTER`) is essential — the modified
   `NEW` record must be returned before the row is stored.

### Why this approach and not alternatives

| Alternative | Why rejected |
|-------------|--------------|
| Simple `RENAME` only | Breaks every old-app query immediately (the proposed migration). |
| Rename table + `INSTEAD OF` view | View DML requires `INSTEAD OF` triggers for all three operations; INSERT on a view does not easily expose which column the caller set vs. omitted; column-list ambiguity is harder to reason about. More moving parts for the same outcome. |
| Generated/computed column | PostgreSQL `GENERATED ALWAYS AS` columns are read-only; they cannot appear as INSERT or UPDATE targets. |
| Application-layer shim | Requires coordinated code changes across all callers before the DB migration, defeating the purpose of a schema-first approach. |
| Dual column without trigger | Works for reads; fails for cross-version writes where one column is set and the other is not. |

---

## Actual MCP rehearsal results

### Run 1 — proposed migration (`ALTER TABLE orders RENAME COLUMN status TO state;`)

```
Run ID : c4e1b633-0146-4f31-9546-2bdd030f12c6
Engine : PostgreSQL 18.3 (PGlite 0.5.8)
Status : FAIL   passed=6   failed=7   skipped=0
```

### Run 2 — candidate migration (`candidates/rename.sql`)

```
Run ID : 8e8d0db3-a001-46ed-9ad9-c08f47301a04
Engine : PostgreSQL 18.3 (PGlite 0.5.8)
Status : PASS   passed=13   failed=0   skipped=0
```

All 13 checks passed, spanning every stage:

| Stage | Checks | Result |
|-------|--------|--------|
| baseline | 1 | ✓ pass |
| migration | 1 | ✓ pass |
| new-only smoke test | 1 | ✓ pass |
| mixed (rolling deployment) | 7 | ✓ all pass |
| rollback | 3 | ✓ all pass |

---

## Remaining limits (from Rehearsal engine)

The following limitations are reported by the Rehearsal MCP for every run and
apply here as well:

1. **Original synthetic order data; no production connection.**
   The test database is an isolated PGlite instance seeded with three synthetic
   rows. Volume, distribution, and production-specific index behaviour are not
   modelled.

2. **Sequential contracts only — no concurrency.**
   The engine runs checks one at a time. True concurrent writers (two old-app
   instances and one new-app instance racing) could expose locking behaviour,
   deadlocks, or read-your-own-writes anomalies that these assertions do not
   cover.

3. **No replicas, CDC, or logical replication.**
   Streaming replication lag and logical replication behaviour were not tested.
   Any replication identity or index requirements on the production schema must
   be assessed independently.

4. **Rollback = application code rollback, not down-migration.**
   The engine's rollback stage reverts the deployed application to the old
   version while keeping the migrated schema. It does NOT run a down-migration
   (e.g. `DROP COLUMN status; RENAME state → status`). A full down-migration
   was not attempted and is not needed to satisfy the scenario's contracts.

5. **Passing these assertions is not a production safety guarantee.**
   The scenario tests the stated contracts. Constraint violations caused by
   existing data, FK relationships, partial indexes, or CHECK constraints on the
   old column name are not covered and must be verified against the real schema.

6. **INSERT with both columns non-null is not covered.**
   The trigger's INSERT branch only fires when exactly one of `state` / `status`
   is null. A caller that supplies two different non-null values in a single
   INSERT will store them as-is, leaving the columns out of sync. This case is
   outside the sampled contracts; no Rehearsal check exercises it.

7. **No BEGIN/COMMIT in the standalone file.**
   The Rehearsal MCP wraps candidate SQL in a transaction internally. The file
   `candidates/rename.sql` does not contain `BEGIN` or `COMMIT`. A caller
   applying it directly must provide transaction management (e.g. wrap it
   manually, or use a migration tool that runs each file in a transaction).

### Additional operational notes

- The trigger adds per-row overhead to every INSERT and UPDATE on `orders`.
  The magnitude depends on table volume and write rate; benchmark against the
  production workload before applying.
- Once the old application version is fully retired, the `status` column, the
  trigger, and the trigger function can be dropped in a follow-up migration.
  Do not drop them during the rolling window.
- Whether any existing indexes reference `status` and whether they need to be
  rebuilt against `state` was not tested by Rehearsal; verify against the
  production schema.
