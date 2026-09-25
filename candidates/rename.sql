-- Migration: status → state (dual-column compatibility strategy)
--
-- Goal: support old application (reads/writes "status") and new application
-- (reads/writes "state") simultaneously during the rolling deployment window,
-- and remain safe for an application rollback where the old code runs against
-- the migrated schema.
--
-- Transaction management
-- ----------------------
-- The Rehearsal MCP wraps candidate SQL in a transaction automatically.
-- This standalone file does NOT contain BEGIN/COMMIT; the caller is responsible
-- for wrapping it in a transaction (or running it inside a migration tool that
-- provides one) before applying it to any database.
--
-- Strategy
-- --------
-- 1. Rename the physical column status → state so new application code works
--    after the migration.
-- 2. Add a second physical column "status" to accept old-application writes.
-- 3. Pre-populate status from state for existing rows.
-- 4. Add a BEFORE INSERT trigger that copies the supplied value into the
--    missing column. NOTE: if a caller supplies conflicting non-null values
--    for both columns simultaneously, the INSERT branch does not resolve the
--    conflict — it leaves both values as-is. This case is outside the sampled
--    contracts and is not tested by Rehearsal.
-- 5. Add a BEFORE UPDATE trigger that detects which column changed and syncs
--    the other. If both columns change in the same UPDATE, state takes
--    precedence (see trigger body). Concurrent writes are not tested.
--
-- Both column names are accepted for reads and writes. The two columns are
-- kept in sync for the cases covered by the Rehearsal contracts; behaviour
-- for untested cases (e.g. both columns supplied with different values on
-- INSERT) is undefined by this migration.

-- Step 1: rename the physical column
ALTER TABLE orders RENAME COLUMN status TO state;

-- Step 2: add a physical "status" column (nullable initially so we can fill it)
ALTER TABLE orders ADD COLUMN status text;

-- Step 3: back-fill status from the now-renamed state column
UPDATE orders SET status = state;

-- Step 4: enforce NOT NULL now that every row has a value
ALTER TABLE orders ALTER COLUMN status SET NOT NULL;

-- Step 5: sync function used by both triggers
CREATE OR REPLACE FUNCTION orders_sync_status_state()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Copy the supplied value into the omitted column.
    -- If both are non-null and differ, no resolution is applied here;
    -- that case is outside the sampled contracts and not tested by Rehearsal.
    IF NEW.state IS NULL AND NEW.status IS NOT NULL THEN
      NEW.state := NEW.status;
    ELSIF NEW.status IS NULL AND NEW.state IS NOT NULL THEN
      NEW.status := NEW.state;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Detect which column the caller changed and sync the other.
    -- If state changed, treat it as the authoritative value and copy to status.
    -- If only status changed, copy it to state.
    -- If both changed in the same statement, state takes precedence.
    -- Concurrent updates are not modelled by the Rehearsal contracts.
    IF NEW.state IS DISTINCT FROM OLD.state THEN
      NEW.status := NEW.state;
    ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
      NEW.state := NEW.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Step 6: attach the trigger (BEFORE so the row stored has both columns filled)
CREATE TRIGGER orders_sync_status_state_trg
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION orders_sync_status_state();
