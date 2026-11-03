# Bugs and issues — current checkout

Severity indicates release risk, not proof of exploitation. Status: open unless stated otherwise. Reproducible source evidence is not a substitute for testing against an isolated database.

| Severity | Finding and root cause / affected files | Safe direction and risk |
|---|---|---|
| Critical | Demo seed data is promoted to registered users: `src/lib/server.ts` creates default person, weights and water; `src/app/api/auth/route.ts` changes same user to non-demo. | Design provenance and explicit onboarding/review; do not guess which existing rows are synthetic or delete them. |
| Critical | Full profile save and regeneration remove all current plan rows, including user-created data: `src/app/api/profile/route.ts`, `api/plan/route.ts`. | Add versioned/archive model and confirmation; preserve existing data and semantics. Requires migration design and isolated rollback/recovery tests. |
| High | Missing PWA icons make service worker's `cache.addAll` fail on a missing asset; also missing image/font URLs. `public/sw.js`, `src/app/manifest.ts`, `src/app/layout.tsx`, CSS, `src/lib/food-catalog.ts`. | Recover licensed source assets or add clearly documented originals; test real fetches, worker activation and offline privacy. |
| High | Install reports 22 advisories (1 critical, 2 high, 19 moderate), no tracked lockfile; actual reachability unassessed. `package.json`. | Review individual advisories and version availability; upgrade with lockfile and regression suite, do not run blind force fix. |
| High | No isolated DB current-run auth/isolation tests; existing route ownership checks need independent verification. `src/lib/server.ts`, `src/app/api/*`. | Provision disposable DB; test multi-account CRUD, CSRF, sessions, concurrency and security boundaries. |
| High | Data accuracy: UTC `todayKey` vs local `todayIndex`; future-date validation uses server UTC; weekly checkmarks treated as current activity/intake. `src/lib/types.ts`, `server.ts`, `components/views.tsx`, `tracking-views.tsx`, `coach-engine.ts`. | Specify user timezone and dated journals before analytics; test midnight/DST and missing days. |
| High | Next coach has no OpenRouter integration and its optional Groq component only classifies questions; not conversational AI. `src/lib/coach-provider.ts`, `coach-engine.ts`, `api/coach/route.ts`. | Preserve current provider pending authorization to replace it; separately design explicit OpenRouter opt-in, consent, data minimization, validation and visible fallback. Do not incur charges. |
| High | No rate/retention limits for anonymous demo creation; account-targeted throttling can be used for denial of service and doesn't prevent distributed signup abuse. `api/dashboard/route.ts`, `auth-core.ts`, `server.ts`. | Design resource budgets and layered abuse controls; do not purge existing data. |
| Medium | Regeneration is deterministic; protein adequacy and full range of requested meal slots not enforced. `src/lib/planner.ts`, `food-catalog.ts`. | Add validated targets and diversity/history; report infeasible plans without false guarantees. |
| Medium | `gender: other` is used as midpoint in BMR; estimates lack disclosed evidence and medical suitability safeguards. `planner.ts`, `health-profile-form.tsx`. | Separate formula inputs from gender identity; require appropriate inputs or mark unavailable, review clinically. |
| Medium | Maintenance progress is arbitrarily 50% on dashboard and 100% on progress; chart max excludes target weight, so gain goal line can render outside plot. `views.tsx`, `tracking-views.tsx`, `ui.tsx`. | Use defined metrics/unavailable state; test gain/loss/maintenance and chart bounds. |
| Medium | Lint failed: 17 errors and 5 warnings under newly resolved packages. See TEST_REPORT.md. | Fix targeted violations without disabling checks globally. |
| Medium | Fixed Drizzle development URL may target wrong database, no tracked migrations. `drizzle.config.json`. | Add explicit environment-based tooling and reviewed additive migrations; never push to production blindly. |
| Medium | Account deletion, JSON backup/import, dated meals/workouts, sleep, activity and native integration are absent. | Treat as roadmap, not as existing functionality. |
| Medium | Root Vite diet falls back to vegetarian for vegan/eggetarian; root OpenRouter endpoint is public and unthrottled; stale Gemini UI labels and broad cache. repository-root `src/App.jsx`, `functions/api/coach.js`, `public/sw.js`. | Root is preserved; separate approval needed for modifications. |

Rollback for code changes: revert only reviewed changes on this session branch. Database rollback requires verified backups and tested additive migration plans; reverting code alone does not restore deleted records. No fixes applied during this audit.

## Follow-up after initial audit

The missing-icon portion of the PWA issue has been addressed with newly created placeholder icons and a simulated regression check. Browser/device verification remains open, as do missing meal imagery and font. Other issues above remain open.

## Follow-up: profile save mitigation

Name-only and water-guide-only full profile saves now preserve plans and stored targets, including for the legacy `balanced` diet value shown as non-vegetarian. A row lock is used when deciding whether to regenerate. This is a partial mitigation: plan-affecting profile edits and explicit regeneration still replace all current plan rows, including custom items/checkmarks, and have no archive. The full profile form warns about this. A disposable PostgreSQL integration test is still required; full record-preservation design remains open.

A JSON download has been added as a first portability step, but it is not an automatic or consistent point-in-time backup, and no import/restore is implemented. Cross-account and actual download behavior still require isolated database and browser tests.

Lint cleanup follow-up: the previously reported 17 lint errors and 5 warnings are resolved. Browser/device and database regression tests remain open; lint passing does not validate functionality or security.

Follow-up: maintenance goals no longer show an arbitrary percentage, invalid directional goals suppress the percentage, and weight chart bounds include gain targets. These are unit-tested calculations; visual and real-data checks remain outstanding. Checked workout durations are now labeled as planned, not measured. Undo by reverting `src/lib/weight-progress.ts`, `src/components/views.tsx`, `src/components/tracking-views.tsx`, `src/components/ui.tsx` and the new weight test; no schema or stored data was changed.

Plan archive follow-up: replacement now snapshots existing plans and checkmarks inside its transaction before deletion; archives are included in JSON export. The additive migration `migrations/0001_plan_archives.sql` must be reviewed and applied to an authorized database before replacing existing plans; if unavailable, replacement fails rather than deleting data. Embedded PostgreSQL tests passed, but concurrent/live PostgreSQL and browser tests are open. An in-app restore is not yet provided; downloaded archives are not an automatic backup and a reviewed restore process is still needed. Existing historical data previously deleted is not recovered.

Manual activity follow-up: the journal does not infer calories or deduplicate overlapping records; it lists only the newest 200 and exports all. Device sync, editing, timezone-specific future-date validation and browser/live-DB tests are open. Missing migration leaves the journal unavailable but does not block the dashboard; export reports data availability.

Manual sleep journal follow-up: timestamps are stored in UTC and displayed in the current device time zone; the original time zone is not preserved, repeated DST local times can be ambiguous, and overlapping entries are not detected. No edit UI or sleep-sensor measurement. Showing newest 200 is explicitly labeled; JSON export contains all entries. Live database/browser tests and an authorized migration remain open.

Plan restore follow-up: in-app restore is now implemented for matching planning profiles, with the current plan archived before replacement. Only the latest 100 snapshots are accessible in the UI; older archives remain in the JSON export. Live session, browser, concurrency and restore drill validation remain open; archived checkmarks are not dated journals. The earlier statements about no in-app restore are historical.

Personal journal follow-up: entries are user-reported, not automatically verified; no automatic nutrient totals, exercise progression/PR, measurement chart, or photo handling is provided. Client limits dates locally while server permits up to tomorrow UTC for timezone tolerance. Most recent 200 per category are displayed, all are exported. Migration and real PostgreSQL/session/browser tests remain open.
