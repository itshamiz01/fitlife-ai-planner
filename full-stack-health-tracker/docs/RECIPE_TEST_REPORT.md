# Recipe upgrade test report

Executed locally with synthetic data, 2026-11-01:

- `node scripts/verify-recipe-upgrade.cjs`: passed catalog uniqueness and original IDs, ingredient references, diet/allergen filtering, 1–4 serving arithmetic, budget, planner diversity and grocery aggregation checks, including grouping, unknown IDs and distinct saved preparation states.
- `node scripts/verify-saved-servings.cjs`: passed isolated PostgreSQL reversible serving scaling, substitutions, stale edits, ownership, mocked auth/origin, allergy and budget checks; no browser, real sessions or concurrency test.
- `node scripts/verify-grocery-purchases.cjs`: passed embedded PostgreSQL additive migration, upsert, bounds, mocked authorization/origin, account isolation and account-delete cascade. Real sessions and browser not tested.
- `node scripts/verify-planner.cjs`: passed 56 feasible plans across 112 diet/budget/energy combinations, seven-day arithmetic, weekly caps, restriction filtering and grounded coach/workout checks. Feasibility is not guaranteed for every profile.
- `node scripts/verify-plan-archive.cjs`, `verify-plan-restore.cjs`, `verify-activity.cjs`, `verify-sleep.cjs`, and `verify-journals.cjs`: passed synthetic embedded PostgreSQL checks, within each script's printed limitations.
- `node scripts/verify-data-export.cjs`, `verify-profile-preservation.cjs`, `verify-weight-progress.cjs`, and `verify-public-shell.cjs`: passed mock or synthetic checks, within each script's printed limitations.
- `npm run lint`, `npx next typegen`, `npm run typecheck`: passed.
- `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db npm run build`: passed using a dummy URL; this does not establish database connectivity.

Not tested: interactive browser rendering, accessibility and mobile layouts; real authentication/session flows; live PostgreSQL, concurrency and production migrations; actual market prices and all ingredient nutrition values; real-world food safety, allergy cross-contact, or nutritional adequacy. Tests do not establish medical safety or guarantee grocery totals at a retailer. Migration 0005 has not been applied to production. No production deployment or push was performed.
