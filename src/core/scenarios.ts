export type CheckSpec = {
  id: string;
  label: string;
  sql: string;
  expected: Record<string, unknown>[];
};
export type StageSpec = {
  id: string;
  title: string;
  description: string;
  checks: CheckSpec[];
};
export type Scenario = {
  id: string;
  name: string;
  short: string;
  description: string;
  risk: string;
  setup: string;
  proposed: string;
  reference: string;
  stages: StageSpec[];
  newOnly: CheckSpec;
};
const setup = `CREATE TABLE orders (id integer PRIMARY KEY, status text NOT NULL, total numeric(12,2) NOT NULL);
INSERT INTO orders VALUES (1, 'pending', 10.49), (2, 'paid', 125.75), (3, 'shipped', 0.01);`;
const base: StageSpec = {
  id: "baseline",
  title: "Before migration",
  description:
    "Confirm the old application contract against the original schema.",
  checks: [
    {
      id: "baseline-read",
      label: "Old application reads an order",
      sql: "SELECT status, total::text AS total FROM orders WHERE id=1",
      expected: [{ status: "pending", total: "10.49" }],
    },
  ],
};
const readAll = {
  id: "preserve-data",
  label: "Original order values are preserved",
  sql: "SELECT id, total::text AS total FROM orders WHERE id<=3 ORDER BY id",
  expected: [
    { id: 1, total: "10.49" },
    { id: 2, total: "125.75" },
    { id: 3, total: "0.01" },
  ],
};
export const scenarios: Scenario[] = [
  {
    id: "rename",
    name: "Rename a live column",
    short: "status → state",
    description:
      "The new application calls it state. Old instances still write status during the rollout.",
    risk: "A successful schema change can strand old application instances.",
    setup,
    proposed: "ALTER TABLE orders RENAME COLUMN status TO state;",
    reference: `-- Expand first. Keep both contracts through the rollback window.
ALTER TABLE orders ADD COLUMN state text;
UPDATE orders SET state = status;
CREATE FUNCTION sync_order_state() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IS NOT NULL AND NEW.state IS NOT NULL AND NEW.status IS DISTINCT FROM NEW.state THEN
      RAISE EXCEPTION 'Conflicting status and state';
    END IF;
    NEW.state := COALESCE(NEW.state, NEW.status);
    NEW.status := COALESCE(NEW.status, NEW.state);
  ELSE
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.state IS DISTINCT FROM OLD.state AND NEW.status IS DISTINCT FROM NEW.state THEN
      RAISE EXCEPTION 'Conflicting status and state';
    ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
      NEW.state := NEW.status;
    ELSIF NEW.state IS DISTINCT FROM OLD.state THEN
      NEW.status := NEW.state;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER orders_sync BEFORE INSERT OR UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION sync_order_state();
ALTER TABLE orders ALTER COLUMN state SET NOT NULL;
-- Drop status only in a later release after the rollback window closes.`,
    newOnly: {
      id: "new-only",
      label: "New application reads the renamed field",
      sql: "SELECT state FROM orders WHERE id=1",
      expected: [{ state: "pending" }],
    },
    stages: [
      base,
      {
        id: "mixed",
        title: "During rolling deployment",
        description:
          "Interleave old and new application writes on the migrated schema.",
        checks: [
          {
            id: "old-read",
            label: "Old instances still read status",
            sql: "SELECT status FROM orders WHERE id=1",
            expected: [{ status: "pending" }],
          },
          {
            id: "old-insert",
            label: "Old instance creates an order",
            sql: "INSERT INTO orders(id,status,total) VALUES(4,'pending',42.10) RETURNING id",
            expected: [{ id: 4 }],
          },
          {
            id: "new-sees-old",
            label: "New instance sees the old instance’s write",
            sql: "SELECT state FROM orders WHERE id=4",
            expected: [{ state: "pending" }],
          },
          {
            id: "new-insert",
            label: "New instance creates an order",
            sql: "INSERT INTO orders(id,state,total) VALUES(5,'paid',18.95) RETURNING id",
            expected: [{ id: 5 }],
          },
          {
            id: "old-update",
            label: "Old instance updates an order",
            sql: "UPDATE orders SET status='shipped' WHERE id=1 RETURNING id",
            expected: [{ id: 1 }],
          },
          {
            id: "new-sees-update",
            label: "New instance sees the old update",
            sql: "SELECT state FROM orders WHERE id=1",
            expected: [{ state: "shipped" }],
          },
          {
            id: "new-update",
            label: "New instance updates the same order",
            sql: "UPDATE orders SET state='refunded' WHERE id=1 RETURNING id",
            expected: [{ id: 1 }],
          },
        ],
      },
      {
        id: "rollback",
        title: "After application rollback",
        description:
          "Run the old application contract against data written by both versions. Keep the migrated schema.",
        checks: [
          {
            id: "old-sees-new",
            label: "Old version reads orders created by the new version",
            sql: "SELECT status FROM orders WHERE id=5",
            expected: [{ status: "paid" }],
          },
          {
            id: "old-sees-update",
            label: "Old version sees the latest new-version update",
            sql: "SELECT status FROM orders WHERE id=1",
            expected: [{ status: "refunded" }],
          },
          readAll,
        ],
      },
    ],
  },
  {
    id: "required",
    name: "Add a required field",
    short: "fulfillment_channel NOT NULL",
    description:
      "New orders need a fulfillment channel. Existing rows and old application writes have no value.",
    risk: "Existing rows or older writes can violate the new constraint.",
    setup,
    proposed:
      "ALTER TABLE orders ADD COLUMN fulfillment_channel text NOT NULL;",
    reference: `-- A compatible default supplies existing rows and old writers.
ALTER TABLE orders ADD COLUMN fulfillment_channel text NOT NULL DEFAULT 'standard';
-- Keep the default while old application instances can still run.`,
    newOnly: {
      id: "new-only",
      label: "New application reads the required field",
      sql: "SELECT fulfillment_channel FROM orders WHERE id=1",
      expected: [{ fulfillment_channel: "standard" }],
    },
    stages: [
      base,
      {
        id: "mixed",
        title: "During rolling deployment",
        description:
          "Both application versions must still be able to create orders.",
        checks: [
          {
            id: "old-insert",
            label: "Old instance inserts without the new field",
            sql: "INSERT INTO orders VALUES(4,'pending',42.10) RETURNING id",
            expected: [{ id: 4 }],
          },
          {
            id: "default",
            label: "New instance receives a compatible default",
            sql: "SELECT fulfillment_channel FROM orders WHERE id=4",
            expected: [{ fulfillment_channel: "standard" }],
          },
          {
            id: "new-insert",
            label: "New instance chooses express fulfillment",
            sql: "INSERT INTO orders(id,status,total,fulfillment_channel) VALUES(5,'paid',18.95,'express') RETURNING id",
            expected: [{ id: 5 }],
          },
        ],
      },
      {
        id: "rollback",
        title: "After application rollback",
        description: "An old reader must retain access to all orders.",
        checks: [
          {
            id: "read-new",
            label: "Old version reads a new-version order",
            sql: "SELECT status FROM orders WHERE id=5",
            expected: [{ status: "paid" }],
          },
          readAll,
        ],
      },
    ],
  },
  {
    id: "precision",
    name: "Change a money column",
    short: "numeric → integer",
    description:
      "An apparently harmless type change rounds persisted order totals. A simple read still succeeds.",
    risk: "A green smoke test can hide a permanent change to business data.",
    setup,
    proposed:
      "ALTER TABLE orders ALTER COLUMN total TYPE integer USING total::integer;",
    reference: `-- Preserve fractional currency values while widening capacity.
ALTER TABLE orders ALTER COLUMN total TYPE numeric(14,2) USING total::numeric(14,2);`,
    newOnly: {
      id: "new-only",
      label: "New application smoke test returns an order",
      sql: "SELECT id FROM orders WHERE id=1",
      expected: [{ id: 1 }],
    },
    stages: [
      base,
      {
        id: "mixed",
        title: "During rolling deployment",
        description: "Test amounts, not just successful responses.",
        checks: [
          readAll,
          {
            id: "old-insert",
            label: "Old instance creates a fractional-value order",
            sql: "INSERT INTO orders VALUES(4,'pending',42.10) RETURNING id",
            expected: [{ id: 4 }],
          },
          {
            id: "old-amount",
            label: "Old instance’s amount survives storage",
            sql: "SELECT total::text AS total FROM orders WHERE id=4",
            expected: [{ total: "42.10" }],
          },
          {
            id: "new-insert",
            label: "New instance writes the smallest currency amount",
            sql: "INSERT INTO orders VALUES(5,'paid',0.01) RETURNING id",
            expected: [{ id: 5 }],
          },
        ],
      },
      {
        id: "rollback",
        title: "After application rollback",
        description:
          "The old version must read the exact amounts stored by the new version.",
        checks: [
          {
            id: "new-amount",
            label: "One cent is still one cent after rollback",
            sql: "SELECT total::text AS total FROM orders WHERE id=5",
            expected: [{ total: "0.01" }],
          },
          readAll,
        ],
      },
    ],
  },
];
export function getScenario(id: string) {
  const s = scenarios.find((s) => s.id === id);
  if (!s) throw new Error(`Unknown scenario: ${id}`);
  return s;
}
