# Backup fixtures

One JSON export per Dexie schema version (`backup-v1.json`, `backup-v2.json`, …), produced by the app's _Export backup_ button on that version. Migration tests import every fixture into the newest schema and check that no progress is lost. **Keep old fixtures forever** (CLAUDE.md §9).
