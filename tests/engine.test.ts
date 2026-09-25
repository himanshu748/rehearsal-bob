import { test } from "node:test";
import assert from "node:assert/strict";
import { rehearse } from "../src/core/engine";
import { scenarios } from "../src/core/scenarios";
for (const s of scenarios) {
  test(`${s.id}: proposed migration is blocked and reference repair preserves contracts`, async () => {
    const bad = await rehearse(s.id, s.proposed);
    assert.equal(bad.status, "fail");
    const good = await rehearse(s.id, s.reference);
    assert.equal(
      good.status,
      "pass",
      JSON.stringify(good.stages.filter((x) => x.status === "fail")),
    );
    assert.equal(good.skipped, 0);
    if (s.id !== "required")
      assert.equal(bad.stages.find((x) => x.id === "new-only")?.status, "pass");
  });
}
test("a no-op cannot satisfy the new application contract", async () => {
  const r = await rehearse("rename", "SELECT 1;");
  assert.equal(r.status, "fail");
  assert.equal(r.stages.find((x) => x.id === "new-only")?.status, "fail");
});
test("a plausible backfill-only repair fails when either version writes", async () => {
  const r = await rehearse(
    "rename",
    `ALTER TABLE orders ADD COLUMN state text; UPDATE orders SET state=status;`,
  );
  assert.equal(r.stages.find((x) => x.id === "new-only")?.status, "pass");
  assert.equal(r.stages.find((x) => x.id === "mixed")?.status, "fail");
  assert.equal(r.stages.find((x) => x.id === "rollback")?.status, "fail");
});
test("invalid SQL causes unexecuted phases to be skipped, not passed", async () => {
  const r = await rehearse("rename", "THIS IS INVALID;");
  assert.equal(r.status, "fail");
  assert.equal(r.stages.find((x) => x.id === "rollback")?.status, "skipped");
  assert.ok(r.skipped > 0);
});
test("independent runs never share rows or schema", async () => {
  await rehearse("rename", scenarios[0].reference);
  const r = await rehearse("rename", scenarios[0].proposed);
  assert.equal(r.status, "fail");
  assert.equal(r.stages[0].status, "pass");
});
