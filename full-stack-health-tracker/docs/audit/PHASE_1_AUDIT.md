# FitLife AI Planner 2.0 — Phase 1 complete project audit

**Audit date:** 30 October 2026 (UTC)  
**Status:** Phase 1 completed. The 2.0 upgrade is **not implemented or release-ready**.  
**Change policy:** documentation/evidence only; no application, dependency, database-schema, native-project or deployment changes were made in this phase.

## 1. Executive conclusion

There are **two materially different codebases**. Treating them as one synchronized application would risk losing working functionality and user data.

1. **This working workspace:** Next.js 16.2.6 App Router, React 19.2.6, TypeScript, Tailwind 4.1.17, Lucide, PostgreSQL and Drizzle. The visible brand is Fit Life Bro. It has a server-backed PWA, private accounts, recovery keys, budget-aware reference recipes, tracking CRUD and Nivra, a bounded source-grounded guide.
2. **The supplied GitHub repository:** React/Vite JavaScript, Tailwind 3.4.17 and Lucide, with a large `src/App.jsx`, local browser profile storage, static meal/workout libraries, two deployment workflows and a Cloudflare Pages coach function using OpenRouter.

The public GitHub README explicitly says it is not a verified complete transfer of the working application's authentication/database state. The local workspace has no visible Git checkout/remotes. No push, pull, merge or workflow edit was performed.

**Immediate blockers:** source/deployment reconciliation; synthetic demo data promoted into real accounts; deletion of current plan/custom rows on profile changes; a GitHub vegan-template fallback that can include dairy; dependency advisories; and missing immutable histories. These should be resolved before adding step-derived health analytics.

## 2. Scope, method and evidence boundaries

- Inspected the local source/configuration, schema, API handlers, planner, food catalog, coach, UI state, service worker, PWA metadata and existing tests.
- Inventoried 58 text/source/test/public files and fingerprinted 83 application/configuration/test/asset files. `.env` values and generated build output were excluded from the fingerprint report.
- Retrieved all 15 GitHub source/configuration files into a **read-only audit snapshot outside the project**. Their Git blob hashes matched the remote tree: 15 checked, zero mismatches.
- Observed GitHub `main` reference: `de6bb028c0a05a2dc13726d25c9729ade3131ef4`. This is the reference reported by the public API during the audit, not a claim that this workspace is checked out at that commit.
- Inspected actual PostgreSQL **schema metadata only** inside a read-only transaction: eight tables, 81 columns. No real profile, password, token or health-record values were read for schema inspection.
- Reproduced behavioral issues using newly created, isolated audit accounts. Existing regression tests also use their own generated accounts and fixture IDs.
- Reran existing functional suites, planner tests, lint and a production dependency scan. Tested public HTTP GET routes, not paid remote AI completions.
- No access to the owner's Cloudflare dashboard/secrets, original users' browser storage, actual Android hardware or a released Android package was available.
- This is not a penetration-test certification, clinical nutrition validation, physical pedometer validation or proof of complete migration.

See `EVIDENCE.json` for machine-readable measurements and `PHASE_2_IMPLEMENTATION_PLAN.md` for proposed changes.

## 3. Architecture comparison

| Area | Working workspace | Linked GitHub repository |
|---|---|---|
| Frontend | Modular React/TypeScript in Next.js App Router | React/Vite, predominantly `src/App.jsx` (117,856 bytes) |
| Styling | Tailwind 4 plus existing global/module feature CSS; Lucide | Tailwind 3.4.17; Lucide |
| Backend | Next.js `/api/*` route handlers | `functions/api/coach.js` Cloudflare Pages function only |
| Identity | Database-backed signup/sign-in, hashed sessions and recovery keys | No comparable server account/database implementation found in the snapshot |
| Persistence | PostgreSQL via `src/db/index.ts` and `src/db/schema.ts` | `localStorage['fitlife-profile-v2']` for profile; several logs are React state only |
| Coach | Nivra local guide; optional Groq **topic classification**, not displayed model-generated advice | OpenRouter chat completion using client-provided profile/targets |
| Secrets configured here | `DATABASE_URL` only | Remote secret values cannot be verified from public source |
| Deployment | Managed Next.js preview; `next.config.ts`; no local GitHub workflow files | GitHub Pages workflow and manually triggered Cloudflare Pages workflow |
| Phone support | Installable PWA, not a native APK | PWA source present; no native Android project found |

Do not copy the Vite `dist` deployment settings onto the Next.js application. Conversely, do not replace the Vite repository root or its workflows with this workspace without an integration branch, backups and feature/data parity tests.

## 4. Existing feature inventory

| Feature | Workspace audit result | GitHub snapshot audit result | 2.0 requirement gap |
|---|---|---|---|
| Accounts and recovery | Working baseline tests; scrypt, hashed opaque tokens, HTTP-only cookies; saved recovery-key flow | No equivalent private server account implementation found | Onboarding completion/provenance and source consolidation |
| Profile | Weight goal, age, gender, height, weights, activity, diet/allergies, daily/weekly INR budget, experience/equipment/time/training focus | Onboarding flag; sex, calculations, cuisine/health/religious fields exist in the client | Mandatory validated completion, routine/occupation/hours, injuries, kitchen/prep inputs, granular food permissions, recomposition |
| Diet classes | Four classes plus legacy `balanced` alias; catalog filter | Only `vegetarian` and `non_vegetarian` libraries | Remote vegan fallback is unsafe; eggetarian library absent |
| Food budget | Integer paise, daily/weekly caps on generated plans | Categorical `foodBudget: 'budget'`, not a numeric ingredient-cost engine | Monthly budget and user-editable regional prices |
| Nutrition | Ingredient-weight arithmetic and raw/dry states; estimates labelled | Pre-entered per-meal numbers and free-form ingredient strings | Primary-source/versioned food validation, fibre, edible yields and serving-unit conversions |
| Weekly diet | 28 rows, four slots/day; some variety | Seven vegetarian day templates and one non-vegetarian day template; six slots | Requested six regular slots plus optional bedtime, stronger variety/protein constraints |
| Regeneration | Recreates deterministic menus and removes old rows | Cycles static template libraries | Fresh generation seed, recent-meal avoidance, history and change summary |
| Single meal replacement | Working user-scoped, budget-checked replacement | AI substitution request does not provide a durable account-scoped replacement model | Nutrition-equivalent alternatives, history/version conflicts |
| Grocery list | Ingredient-weight/cost aggregation and text export | Ingredient-list UI | Editable price-book integration and dated plan version |
| Workouts | Age/activity/equipment/experience/time influence limited templates | Fixed home/gym programs and completion arrays | Structured exercises, injury constraints, goal variety, actual sets/loads and progression |
| Weight history | Dated PostgreSQL rows and chart; CSV export | React state; first entry from onboarded profile | Demo provenance and consistency/timezone handling |
| Hydration | Dated rows, adjustable guide, foreground reminders | In-memory water state | Unified local-day boundaries and broader persistence reconciliation |
| Coach | Saved private conversations, citations, deterministic facts/refusals; optional routing unconfigured | OpenRouter function source; stale Gemini UI/setup text | Reliable live integration, structured action previews, actual dated histories/activity context |
| Pedometer / Activity Tracker | **Absent** | **Absent** | All sensor, permission, activity-ledger and manual-fallback work |
| Distance / activity calories | **Absent** | **Absent** | Documented MET engine and deduplicated actual activity |
| Native Android / Health Connect | **Absent** | **Absent** | Native client/bridge, permissions and physical-device tests |
| Offline | Public-asset cache and generic connection page; API/private HTML not cached; no write queue | Profile local storage; broad same-origin GET cache in service worker | Secure versioned outbox/conflict policy only if intentionally added |
| Cross-device data | Registered records retrievable from shared server; focus/30-second refresh | No equivalent authenticated cloud state found | Explicit versions, acknowledgements and migration reconciliation |
| Data portability | Weight CSV, grocery text, recovery-key download | No complete versioned account backup found | Account JSON export/import and explicit conflict handling |

## 5. Actual storage audit

Existing table names are legacy compatibility identifiers and should not be renamed during this upgrade:

| Table | Purpose | Important limitation |
|---|---|---|
| `wellnest_users` | Identity hashes, profile, preferences, targets | Many non-null demographic defaults; no completion flag, timezone or data-origin marker |
| `wellnest_sessions` | Hashed token and expiry | Native-client authentication not yet designed |
| `wellnest_meals` | Current weekday meal rows, ingredient/cost snapshots, completion boolean | No plan generation/date, consumed-at timestamp, archive or immutable meal log |
| `wellnest_workouts` | Current weekday routine and completion boolean | No actual session date, exercise/set records, loads or PRs |
| `wellnest_water_logs` | Date/time/amount | String day plus created timestamp; mixed local/UTC boundaries |
| `wellnest_weight_logs` | Dated weight and note | Demo and real-origin entries not distinguished |
| `wellnest_auth_failures` | Authentication/chat request buckets | Expiry reuse exists; broader anonymous resource/retention policy needs review |
| `fitlife_coach_messages` | User-owned chat and sources | Depends on correctness/provenance of underlying records |

PostgreSQL RLS is not enabled on these tables. That is not by itself proof of a leak: this application uses server-only database access and route-level user filters, which passed the existing isolation tests. Continue enforcing ownership at every new API boundary and use a least-privilege application role. No public database credentials should be introduced.

Observed indexes were primary keys plus unique user email only. User/date/day query indexes, activity idempotency indexes and session-expiry cleanup should be designed before scale. `drizzle.config.json` contains a fixed local development connection rather than reading the runtime environment; production migration tooling must not accidentally target the wrong database. No schema migration or database update was applied by this audit.

## 6. Prioritized findings

Severity here describes upgrade/release priority, not a claim of an exploited vulnerability.

### P0 — establish integrity before feature work

**A-01 — Source/deployment divergence.** Local `package.json`, `src/app`, `src/db` and tests are absent from the linked Vite repository. The remote README acknowledges incomplete migration. No Git metadata exists in this workspace. Preserve both snapshots and reconcile on an integration branch before changing deployment.

**A-02 — Demo history is promoted into a real account.** `src/lib/server.ts:136–154` seeds eight weights and 52 water entries; `src/app/api/auth/route.ts:59–67` converts that same user to `isDemo=false`. A fresh audit signup retained all those rows and default age/weight without entering real measurements. This can present synthetic history as personal facts. Add record provenance, explicit onboarding and an import/review choice. **Do not heuristically delete existing records**: older real versus seed data cannot reliably be distinguished today.

**A-03 — Profile edits and regeneration destroy current custom plan records.** `src/app/api/profile/route.ts:40–48` and `src/app/api/plan/route.ts:11–17` delete all current meal/workout rows and insert replacements. A name-only edit removed a custom sentinel meal and workout in an isolated account. Weight/water remained. The current UI warns about replacement, but there is no archive or actual-log layer. Separate templates, plan versions and immutable performed/consumed records before upgrading this behavior.

**A-04 — GitHub vegan selection can fall back to dairy-containing vegetarian meals.** `src/App.jsx:56` defines seven vegetarian and one non-vegetarian day; there is no vegan or eggetarian library. `src/App.jsx:1161` falls back to vegetarian. Vegetarian recipes contain paneer, milk, curd and ghee. Allergen substring checks are not a vegan validator. Fail closed for unsupported diets and reconcile the stronger workspace ingredient classification rather than copying the fallback.

**A-05 — Dependency release blocker.** The workspace production dependency scan reported six vulnerable packages: one critical, four high, one moderate. Pinned Next.js is 16.2.6; the scan recommends Next.js 16.4.3 as a fix path. Reported advisory reachability depends on features/OS/input paths; this audit did not exploit them or prove every advisory is reachable. Patch and retest in a dedicated change before a new public release. No dependency upgrade was applied during Phase 1.

### P1 — accuracy, persistence and requested capabilities

**A-06 — “Generate again” is not fresh generation.** `src/lib/planner.ts:46–66` has no persisted seed/history input. All six scenario probes produced semantically identical menus on a second call. Egg and non-vegetarian probes each had three adjacent lunch repeats. Add generation IDs/seeds, recent-meal penalties and a persisted diff, while preserving prior plans.

**A-07 — Protein adequacy is not an optimization constraint.** The planner scales recipes to slot calorie shares. There is no stored/enforced protein target or protein-gap result. In the synthetic 70 kg fixture, several daily menus were below 98 g, the lower edge of the coach's general exercising-adult reference, even when prices were comfortably below budget. This is not a clinical deficiency diagnosis; it demonstrates that budget/calorie success is not proof of a protein requirement being met.

**A-08 — Incomplete budget/food controls.** Only daily and weekly periods are supported (`src/lib/types.ts:41`, profile API); Nivra correctly declines monthly conversions rather than guessing. Unit prices are fixed source constants. Cuisine, cooking facilities, prep-time limits, local availability, disliked foods, intolerances and optional religious restrictions are not all modeled in the workspace. Dairy/egg/chicken/fish permission switches do not exist. Add these as explicit validated constraints, not prompt-only promises.

**A-09 — No durable dated meal/workout journal.** Current rows use weekday 0–6 and a boolean. They cannot support historical calorie/protein/strength charts, identify the last eaten meal or safely survive week rollover. Completion state may be mistaken for a dated event. New plans must not remove real logs.

**A-10 — UTC/local day mismatch.** `todayKey()` uses UTC while `todayIndex()` and displayed dates use local time (`src/lib/types.ts:34–36`). Server and phone timezone may differ. The same example instant, 30 October 2026 21:00 UTC, is 31 October in Asia/Kolkata. Hydration, meal day, coach “today”, steps, month budgets and charts need one explicit user timezone/local-day policy.

**A-11 — Some progress/activity labels are not measurements.** `src/components/views.tsx:28` sums prescribed durations from completed checkboxes. That is not measured walking time or a performed-set journal. Maintenance progress is forced to 50% in the overview (`views.tsx:30`) and 100% in progress (`tracking-views.tsx:39`). Replace invented percentages with a defined metric or unavailable/maintenance status. Never use prescribed minutes as measured energy-burn input.

**A-12 — GitHub hydration/weight/workout/chat persistence is incomplete.** In remote `src/App.jsx:404–420`, trackers and histories are initialized in React state; only profile is persisted at `:463–471`. Refresh therefore loses those state histories. No server account model, Supabase integration or complete cloud migration was found in the 15-file snapshot. Browser profile persistence alone is not multi-user synchronization.

**A-13 — GitHub coach routing/provider configuration is inconsistent.** The frontend calls same-origin `/api/coach` (`App.jsx:492`). The observed GitHub Pages homepage returned HTTP 200 but `https://itshamiz01.github.io/api/coach` returned HTTP 404. GitHub Pages cannot run the Cloudflare function. Cloudflare's workflow is manual; zero runs were visible through its workflow API, so its actual deployment/secrets remain unverified. The code uses `OPENROUTER_API_KEY` and defaults to `openai/gpt-4o-mini`, while the UI says `gemini-3-flash` (`:1823`) and a 404 hint asks for `GEMINI_API_KEY` (`:529`). These are stale/mismatched labels, not proof of a live Gemini implementation. Do not add Gemini or enable a potentially billable model without authorization.

**A-14 — Remote AI endpoint needs account/cost/accuracy controls before exposure.** `functions/api/coach.js` accepts client-provided profile/targets without an authenticated data lookup, has no application-level rate limiter in the source, and returns the model's free-form text. The upstream secret stays server-side, which is good, but prompt instructions alone do not verify nutritional numbers or authorize spending. Do not test it with paid requests during this audit.

**A-15 — Pedometer/activity/calorie-burn modules do not exist.** No DeviceMotion/Accelerometer/step-counter/Health Connect/Capacitor references or Android project were found locally; none were found in the remote tree. No step/activity ledger, manual activity fallback, distance engine or MET module exists. There is consequently **no implemented or physically tested background tracking**.

**A-16 — Workout personalization/history is insufficient for 2.0.** Local parameters influence sets, equipment, duration and strength reps, but hard-day prescriptions repeat. The probe found one unique strength description per tested profile. Injuries/limitations are not collected; structured exercise IDs, muscles, demonstrations, alternatives, actual sets/rest/load and progressive history are absent. Remote programs are fixed home/gym templates with a difficulty label. Preserve current working completion UI while introducing actual sessions separately.

**A-17 — Lint is failing.** `npm run lint` reports 12 errors and five warnings, although Next.js build/typechecking pass. Findings include link navigation rules, effect state updates, a test-loader module-variable rule, image warnings and a hook dependency warning. Fix intentionally and add lint to release CI; do not blindly replace intentional authentication navigation or suppress rules globally.

### P2 — robustness, cost and migration readiness

**A-18 — Concurrent edits/portability are not complete synchronization.** User-row locks protect catalog swaps and plan regeneration, but general edits have no expected-version conflict check. `syncedAt` is a server-read time, not a complete synchronization acknowledgement. There is no account JSON restore/import or offline write queue. Preserve truthful offline messaging until these are implemented.

**A-19 — Anonymous demo creation and retention can exhaust a free-tier database.** A new unauthenticated dashboard session seeds many rows. Signup/demo creation lacks a visible bounded resource/retention policy. Design rate limits and explicit demo lifetimes without deleting registered or legacy data.

**A-20 — Nutrition traceability and preparation metadata need expansion.** The catalog has 17 foods and 18 recipes. Some source links are generic USDA pages or secondary transcriptions, not a complete versioned primary-source import. Fibre, preparation time, cooking equipment and edible/cooked yields are not structured. Do not import the remote meal macro literals as verified ingredient nutrition.

**A-21 — Remote service-worker scope is too broad for future private APIs.** The remote worker caches same-origin GETs without excluding `/api/` and deletes every cache except its own during activation. On a shared origin this can remove other applications' caches. The workspace worker's public-only cache/API bypass is the behavior to preserve.

## 7. Requested six-scenario probe

Synthetic fixture only: age 29, male calculation setting, 175 cm, 70 kg, moderate activity; target 75 kg for gain or 65 kg for loss. These are **not actual user readings or clinical prescriptions**. Calorie targets come from the existing formula, not an independently validated nutrition requirement.

| Preference / weight direction / budget | Target kcal | Generated kcal/day range | Protein g/day range | Cost ₹/day range | Distinct breakfasts | Adjacent lunch repeats | Same menu after regeneration |
|---|---:|---:|---:|---:|---:|---:|---|
| Vegetarian / gain / ₹120 | 2650 | 2641–2653 | 92–119 | 77.54–117.51 | 5 | 0 | Yes |
| Vegetarian / loss / ₹150 | 2050 | 2048–2053 | 73–93 | 59.94–90.91 | 5 | 0 | Yes |
| Eggetarian / muscle-gain direction / ₹150 | 2650 | 2702–2727 | 124–134 | 124.98–133.10 | 2 | 3 | Yes |
| Non-vegetarian / fat-loss direction / ₹150 | 2050 | 2033–2050 | 95–107 | 103.16–123.00 | 6 | 3 | Yes |
| Vegan / gain / ₹120 | 2650 | 2639–2655 | 93–121 | 75.47–86.03 | 4 | 0 | Yes |
| Vegan / loss / ₹150 | 2050 | 2049–2054 | 74–91 | 58.64–66.62 | 4 | 0 | Yes |

All six produced 28 meals and zero estimated over-budget days using the **sample** prices. This verifies arithmetic/caps for these fixtures, not current market affordability, protein adequacy, seven unique breakfasts, a new generation, or the requested six-plus-one daily structure. The existing general exercising-adult protein reference for 70 kg is 98–140 g/day; the planner does not enforce it as a personal target.

## 8. Test/build/security baseline

### Passed during this audit

- Existing planner suite: 112 diet/budget/energy combinations, 52 feasible reference plans and explicit infeasibility checks; targeted nutrition/allergy/coach safety cases.
- `scripts/verify.cjs`: 11 existing CRUD/tracking groups.
- `scripts/verify-auth.cjs`: 12 authentication/recovery/isolation groups, including HTTPS cross-site iframe behavior.
- `scripts/verify-install.cjs`: eight PWA/metadata/mobile-layout/offline-privacy groups.
- `scripts/verify-budget-coach.cjs`: six existing budget/swap/chat/privacy groups.
- **37 existing browser verification groups**, no reported browser errors in those runs.
- Route type generation, TypeScript `--noEmit`, production build and initial managed health-check bootstrap.

### Failed or incomplete

- Lint: **12 errors, five warnings**.
- Production dependency scan: **six vulnerable packages** — `next` critical; `nanoid`, `postcss`, `sharp`, `source-map-js` high; `baseline-browser-mapping` moderate. This is a package/advisory report, not an exploit demonstration.
- The new master acceptance criteria for fresh generation, immutable histories, monthly budgets, protein optimization, seven-slot structure, actual activity and native/background tracking are not satisfied by the current implementation.
- Actual Android/Safari hardware, sensor permission, screen-lock, restart, false-positive motion, Health Connect and calorie-burn accuracy tests: **not executed; no implementation/device release to test**.
- Live Groq/OpenRouter quality, budget/quotas and remote Cloudflare secrets/deployment: unverified. This workspace has no configured provider key.
- Complete source/database/browser-data migration and backup restore: not verified.

**Important:** Some existing tests intentionally assert the legacy four-slot/demo-preservation behavior. Passing those tests does not mean the stricter 2.0 requirements pass.

## 9. Deployment result

- The unchanged Next.js application builds and passes the managed preview health check. A preview is temporary and is not proof of a permanent production deployment.
- GitHub Pages' latest visible successful run was `38684687006` at the inspected main reference. Public frontend GET: 200. Its requested same-origin coach route: 404.
- Cloudflare workflow source exists and uses repository secrets; no workflow runs were visible. This does not prove that no deployment was ever created another way, nor that secrets exist. Cloudflare production status remains **unverified**.
- GitHub Pages is static hosting, not a Next.js/PostgreSQL/API runtime. Existing Vite `dist` and base-path settings must be preserved until a documented deployment integration is tested.
- No native APK/AAB or Health Connect release exists in either inspected tree.

## 10. APIs, permissions and operating cost

Current workspace: PostgreSQL server connection; same-origin private HTTP APIs; optional Groq topic routing; browser notification permission only when the user enables it. No motion/Health Connect permission is requested because there is no such module. No new provider, paid API, Gemini dependency or subscription was introduced.

Future minimum Android/sensor permissions and physical tests are detailed in `ANDROID_DEVICE_TEST_PLAN.md`. Health Connect aggregate reads should be preferred over summing raw duplicate step sources. Browser foreground motion must be labelled experimental if added; it cannot establish continuous tracking with a locked screen.

## 11. Files changed and data handling in this phase

New documentation/evidence only:

- `docs/audit/PHASE_1_AUDIT.md`
- `docs/audit/PHASE_2_IMPLEMENTATION_PLAN.md`
- `docs/audit/ANDROID_DEVICE_TEST_PLAN.md`
- `docs/audit/EVIDENCE.json`

Application/configuration/test/asset source: **no intended changes**; integrity is checked against the 83-file baseline. Existing test screenshots and generated build artifacts may be refreshed by validation. No schema migration, remote push, dependency upgrade, deployment workflow edit or existing-user data cleanup was performed. Test/probe writes were limited to newly generated audit/test accounts.

## 12. Recommended next order and verdict

1. Preserve/export both sources and existing storage; establish the authoritative integration branch and deployment boundary.
2. Address dependency/lint release blockers in isolated, tested changes.
3. Add provenance, real onboarding and non-destructive plan/history versioning before new analytics.
4. Implement the diet/price/target/diversity engine and structured training records with acceptance tests.
5. Add the activity ledger, manual fallback and documented MET estimates.
6. Add experimental foreground browser sensing only with honest limitations; integrate Android Health Connect/native counters and physically test before claiming background support.
7. Ground dashboard/coach tools in those actual records, then verify the release and migration.

**Phase 1 is complete. The application has not been declared FitLife AI Planner 2.0 complete.** No identified blocker is represented as fixed by this audit.

## 13. Reference material

- Repository: https://github.com/itshamiz01/fitlife-ai-planner
- Observed GitHub Pages run: https://github.com/itshamiz01/fitlife-ai-planner/actions/runs/38684687006
- Android motion/step sensors: https://developer.android.com/develop/sensors-and-location/sensors/sensors_motion
- Health Connect setup: https://developer.android.com/health-and-fitness/health-connect/get-started
- Health Connect read restrictions/background reads: https://developer.android.com/health-and-fitness/health-connect/read-data
- Health Connect aggregation/deduplication: https://developer.android.com/health-and-fitness/health-connect/aggregate-data
- Browser motion permission: https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent/requestPermission_static
- Capacitor configuration (`webDir`, `server.url` limitations): https://capacitorjs.com/docs/config
- 2024 Adult Compendium walking categories: https://pacompendium.com/walking/
- Dependency advisory details/conditions: URLs recorded in `EVIDENCE.json`.
