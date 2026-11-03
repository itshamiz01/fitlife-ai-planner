# Feature status — Next.js checkout

Statuses refer to current checkout; historical results in `audit/` are not current test runs.

| Feature | Status | Evidence / limitation |
|---|---|---|
| Production build | Working and verified | Builds with placeholder DATABASE_URL; not evidence of DB connectivity. |
| Planner unit checks and local coach examples | Working and verified | `node scripts/verify-planner.cjs`; synthetic cases only. |
| Authentication, sessions, recovery | Implemented but unverified | Server code exists; current isolated DB/browser suite not run. Demo signup carries seed history. |
| Account isolation | Implemented but unverified | Ownership predicates exist; current adversarial DB tests not run. |
| Demo/onboarding | Partially working | Seeded demo; signup inherits fabricated history and defaults; actual onboarding not enforced. |
| Profile and recommendations | Partially working | Basic inputs and calorie estimate exist; full profile, formula transparency and approval of changes absent. |
| Diet categories, budget plans, substitutions | Partially working | Unit tests pass for catalog fixtures; four slots, fixed prices, unverified sources, limited variety and no protein optimization. |
| Meal/workout tracking | Partially working | Plan CRUD/checkmarks exist, but not dated consumption or actual exercise journals; regeneration deletes custom rows. |
| Hydration and weight | Implemented but unverified | Dated CRUD source exists; current DB/browser execution blocked. UTC/local mismatch. |
| Workout personalization | Partially working | Template-based and limited; no injury handling, sets performed, load, PR or progression. |
| Grocery export | Implemented but unverified | Aggregates catalog ingredient snapshots, not manual meals; no purchase tracking. |
| Local coach | Partially working | Synthetic unit examples passed; not general conversational AI; real DB integration not run. |
| OpenRouter coach in Next | Missing | Root app has a separate Cloudflare OpenRouter function; live provider untested. |
| PWA and offline | Broken | Tracked Next icons are absent; worker install pre-cache references them. Actual device test not run. |
| Background reminders | Missing | Foreground timers only. |
| Steps, Health Connect, native Android | Missing | No implementation or physical-device evidence. |
| Sleep, body measurements/photos, advanced reports | Missing | No corresponding persisted modules found. |
| JSON backup/import, account deletion, conflict-safe offline sync | Missing | Weight CSV and grocery text export are narrower features. |
| Production DB, live AI, deployment and original Floot parity | Blocked by external dependency | No isolated DB/provider key, approved deployment, original Floot source, or actual Android device supplied. |

## Follow-up after initial audit

Replacement icons have been added and a simulated public-shell install test passes. This resolves the missing icon files identified in the checkout, but real service-worker installation and PWA installability remain unverified; missing meal images and font remain open. The table above records the initial audit state.

Non-plan profile saves now preserve existing plan rows in route-level tests using a database stub. Plan-affecting profile saves and manual refresh still replace the current plan; database integration remains unverified.

A JSON download for the signed-in account's profile, current plans, water/weight records and all coach messages has been added in Settings. Mock route tests passed; real database isolation and download behavior are not yet verified. It is not an automatic backup, does not include credentials, and cannot be imported/restored by the app. Demo exports include sample data. Concurrent changes may appear across different points in time.

The initial lint failure has since been resolved. See PRODUCT_FEATURE_INVENTORY.md for a clearly scoped count of user-facing feature groups and prioritized opportunities; the initial table remains a historical snapshot.

See FEATURE_VERIFICATION_MATRIX.md for the current item-by-item verification status. The 20 groups are not fully verified, and some remain partial. Weight progress math and chart bounds received unit-tested improvements; browser/DB checks remain open.

Plan archive follow-up: a reviewed additive migration is needed for existing deployments. With it, plan replacements save old plans/checkmarks in archives available through JSON export. No in-app restore is implemented. Embedded PostgreSQL tests passed, but full DB/browser verification remains open.

Manual activity journal follow-up: users can create, list and delete manually entered walking/running/cycling/other entries with optional steps, kilometres and duration, and export all entries. It does not calculate calorie burn, aggregate overlapping data, edit entries, sync devices or track steps automatically. Most recent 200 are displayed. Tests used embedded PostgreSQL and mocked authentication; browser and real DB sessions remain unverified. The additive `0002_manual_activity.sql` migration is required before use and has not been applied to production.

Manual sleep journal follow-up: users can add/list/delete self-reported bed and rising times, an optional 1–5 rested rating and note; exports include entries. Time in bed is not presented as measured sleep. Input is local device time, storage is UTC and display uses the viewing device's time zone; repeated daylight-saving times can be ambiguous. Most recent 200 entries are displayed, all are exported. Editing, overlap detection, analytics, device integrations, live DB/browser tests and true recovery metrics remain open. `migrations/0003_sleep_journal.sql` must be reviewed/applied to an authorized database; production remains untouched.

Plan archive restore follow-up: Settings now lists the latest 100 archives and allows restoring an archive only when its recorded planning inputs match the current profile. Restore archives the current plan first and creates fresh row IDs while preserving plan contents and checkmarks. Archives beyond 100 remain in JSON export; in-app browsing of older entries is not available. Profile differences block restore, so the user must review settings or use their export. Embedded database tests passed; live sessions/browser testing and authorized migration are outstanding.

Personal journals follow-up: manually entered dated food, exercise and centimetre measurements now support create/list/edit/delete, owner-scoped export, and separate navigation. Nutrition fields are optional estimates and blanks mean unknown; exercise entries are actual reported sessions, not plan checkmarks. The newest 200 entries per category are displayed and all are exported. No nutrient aggregation, exercise progression/PR analysis, photo upload, or charts were added. These features require the additive `0004_personal_journals.sql` migration, which has not been applied to production. Embedded SQL tests passed with mock sessions; browser/live session checks remain outstanding.
