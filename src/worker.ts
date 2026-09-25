import { rehearse } from "./core/engine";
self.onmessage = async (
  event: MessageEvent<{ scenarioId: string; sql: string; label: string }>,
) => {
  try {
    const { scenarioId, sql, label } = event.data;
    const report = await rehearse(scenarioId, sql, label, (stage) =>
      self.postMessage({ type: "stage", stage }),
    );
    self.postMessage({ type: "done", report });
  } catch (e) {
    self.postMessage({
      type: "error",
      error: e instanceof Error ? e.message : String(e),
    });
  }
};
