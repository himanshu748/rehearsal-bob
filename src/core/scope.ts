export const limitations = [
  "Original synthetic order data; no production connection.",
  "Sequential SQL contracts model application versions. No concurrent clients, locks, load, replicas, or real application binaries are tested.",
  "Rollback means reverting application code while retaining the migrated schema and data; destructive down-migrations are not executed.",
  "Passing these assertions covers these scenarios only. It is not a production safety guarantee.",
];
