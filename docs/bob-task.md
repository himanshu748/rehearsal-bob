# Bob IDE repair task

Use the Rehearsal MCP tools to inspect scenario `rename`, execute its proposed migration, and diagnose all failed application contracts. Do not consult the included reference SQL. Produce an independent compatible migration in `candidates/rename.sql`, then rerun the unchanged Rehearsal MCP checks. Preserve both old and new readers and writers through application rollback. Do not edit the engine, fixtures, expectations, UI, or existing reference repair. Write `candidates/rename-notes.md` explaining the SQL choices, actual MCP results, and remaining limits.

Only read project source relevant to this task. Do not read work/, outputs/, .env files, credentials, or unrelated directories. Do not publish, deploy, message, or install dependencies; dependencies are already installed. If MCP is unavailable, diagnose configuration and report the error before using the CLI as fallback.

This is original synthetic order data. No production database is connected. A passing sampled contract report is not a production safety guarantee.
