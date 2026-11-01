# FitLife AI Planner 2.0 — Phase 2 architecture and implementation plan

**Status: proposed implementation; not feature code already delivered.** Read `PHASE_1_AUDIT.md` first. Preserve the existing React/Tailwind/Lucide design, working routes, account IDs, recovery keys and records. No paid provider or Gemini dependency is authorized by this plan.

## 1. Source and deployment reconciliation gate

The supplied GitHub repository is a Vite/Cloudflare/GitHub Pages client; this workspace is a separate working Next.js/PostgreSQL application. They are not interchangeable build artifacts.

1. Export immutable snapshots of both sources and record their hashes. Back up PostgreSQL using the hosting provider's secure backup mechanism and test a restore in a separate database. Preserve browser exports from actual devices where available; do not scrape or expose health data.
2. Create an integration branch from GitHub's inspected main, not a forced overwrite. Add recovered workspace material in an isolated directory/branch so the Vite root and its workflows remain operable during comparison.
3. Map features/data formats and choose a documented source-of-truth boundary. Recommended default: keep the currently working server/account/database implementation intact while reconciling the Vite frontend and deployment separately. Extract reusable pure React/planning modules rather than rewriting the interface.
4. Do not point the Vite `dist` workflow at `.next` or assume GitHub Pages can execute APIs. If full-stack Next.js is selected for a new deployment, verify a compatible server/adapter and PostgreSQL access first; preserve the old deployment until cutover and rollback tests pass.
5. Do not use Capacitor `server.url` as an unexamined production shortcut. Its documentation describes it as a live-reload option. A native client needs bundled static assets and a reviewed authenticated backend boundary; the existing Vite client may be useful after parity/security reconciliation.
6. Fix stale GitHub Gemini labels/error hints without introducing Gemini. Do not enable the existing potentially billable OpenRouter default without explicit cost authorization. Reuse an approved integration only after configuration and failure/limit tests.

**Exit gate:** source snapshots, clean integration branch, verified restore, feature/data mapping and an intentional deployment target. No data/framework switch before this gate.

## 2. Release safety and non-destructive data foundation

### First changes after audit approval in the implementation sequence

- Patch audited dependencies using package-manager operations; keep compatible Next/ESLint/React versions and a reproducible lock file. Recheck the registry advisory state at implementation time; the audit suggested Next 16.4.3, but that version has not been compatibility-tested here.
- Resolve the 12 lint errors intentionally. Preserve deliberate full-page authentication transitions; do not replace anchors or effect behavior blindly just to silence a rule. Add lint/type/build/test gates to the relevant integration workflow.
- Add explicit schema migrations. Do not use an unreviewed destructive `drizzle-kit push` against production. Remove the production CLI's dependence on a fixed development database address.
- Add provenance and version fields without dropping existing columns/tables. New real entries: `source=user`. New demo fixtures: `source=demo`. Old entries: `source=legacy_unknown` until reviewed; never classify/delete old data using a fragile date/name heuristic.
- Add onboarding state/version and require user confirmation of real measurements/preferences before a personal plan. Keep the demo clearly separate. On signup, offer an explicit import/review of user-created guest changes rather than automatically turning synthetic history into real facts.
- Separate editable current-plan templates from immutable consumption/performed-activity histories. Profile name edits must not regenerate or delete a plan. Relevant planning-input changes should offer a preview/explicit regeneration, not erase records.

### Proposed additive storage

| Add/extend | Purpose and safeguards |
|---|---|
| Existing profile | Completion/version, calculation-sex input when needed, timezone, primary/recomposition goal, routine/occupation/hours, injuries/limitations, workout location/time, food permission switches, intolerances/dislikes/voluntary restrictions, cuisine, kitchen/prep constraints, budget period/month |
| Food reference records | Versioned source food ID/state, category, serving units, kcal/protein/carbs/fat/fibre, allergen/animal-derived tags, density/edible/cooked yields and evidence/licence information |
| User price book | User-owned regional prices, purchase units, edible-yield assumptions, valid-from timestamp; integer paise |
| Plan generations | User, date range, generation seed/version, profile/reference/price snapshots, prior-plan link and change summary |
| Planned meals | Concrete local date/slot, recipe and ingredient snapshots, reference nutrients/cost, archival state |
| Meal-consumption logs | Consumed-at timestamp/local-day/timezone, actual portion and optional plan link; source and confidence |
| Workout prescriptions | Structured ordered exercises, sets/reps/time/rest/load guidance, difficulty/muscles/technique/alternatives and illustration references |
| Workout sessions/sets | Dated actual duration, performed reps/loads/rest, exercise IDs, notes; PRs derived from verified actual sets |
| Activity sessions | Actual time interval, source, type, steps/distance/duration/intensity, body-weight snapshot, MET/version and confidence |
| Import observations/cursors | User/device/provider/external ID, interval, last-modified token, boot/counter epoch and sync status; unique idempotency constraints |
| Consent/device connection | Minimum granted permissions, device/source identity, last checked/revoked state; no provider API secrets in browser storage |
| Optional outbox/conflicts | Versioned bounded local operations with owner binding, server acknowledgements, explicit conflict UI and logout policy |

Existing `wellnest_*` and `fitlife_coach_messages` data stays intact during migration. Archive old plan rows before moving the current-plan pointer. Do not cascade away consumed/performed records when changing a template.

## 3. Phase 3 — nutrition/price/diversity engine

### Constraint model

Hard constraints: effective diet/animal permissions, known allergies/intolerances/restrictions, ingredient validity, kitchen/cooking feasibility, per-day cash cap, supported age/medical policy and validated unit conversions. Soft/target constraints: calorie tolerance, profile-appropriate protein target, macro balance, preparation preference, cuisine and diversity. Do not claim all targets are met if the constraint system is infeasible.

- Keep the existing deterministic arithmetic as the source of nutrient facts. Extend the catalog with validated Indian staples/dishes; do not copy the GitHub's per-meal macro literals into a supposedly verified food database.
- Every recipe consists of known ingredient IDs, exact quantities, preparation state and ordered instructions. Resolve alternatives to a concrete ingredient variant before calculating, rather than leaving `milk/almond milk` or `quinoa/rice` ambiguous.
- Convert grams/ml/pieces using documented unit weights/densities and edible yields. Match raw/dry versus cooked records. Include oil and other meaningful ingredients. State exclusions such as fuel/delivery.
- Add structured preparation time, kitchen/equipment, cuisine, season/availability and allergy/animal-derived tags. Vegan validation must reject all animal-derived ingredients, including hidden recipe components.
- Support numeric daily/weekly/**calendar-month** budgets. Store the intended month/timezone and use actual day counts; do not silently assume a monthly amount is a daily amount or always a 30-day month. Allocate an explicit cap to each planned local date.
- Add per-user editable ingredient prices. Show price source/date and differences from the sample basket. Keep unknown prices unknown, not zero.
- Generate the requested early-morning, breakfast, mid-morning, lunch, evening and dinner slots plus optional bedtime, with nonclinical/age-appropriate policy. Do not force extra meals if a qualified plan policy calls for a different structure; explain that decision.
- Optimize calorie/protein fit within the cash cap. When impossible, return structured `unmetTargets`, costs and closest practical alternatives, not a fake full-target success or silently reduced portions.
- Introduce a persisted generation seed and recent-meal history. Score distinct breakfast recipes, adjacent-day lunch differences, protein-source rotation and regional variety. If diversity is impossible within restrictions/budget, disclose that explicitly.
- Generate only on request or a confirmed relevant profile change. Store a diff of changed meal IDs/nutrients/costs. Identical valid output should be reported as unchanged, not advertised as a fresh AI generation.
- Single-meal replacements must match the correct slot/date, diet, allergies, remaining known cash and calorie/protein tolerances. Preview totals and changed nutrients before confirming. Serialize/validate the current plan version to avoid concurrent swaps overspending.
- Actual meal logs must remain loggable even if the user ate over budget. Mark overspending/uncertainty honestly instead of blocking a truthful historical record.

### Suggested modules and touched files

- Extend `src/lib/food-catalog.ts`, `src/lib/types.ts`, `src/db/schema.ts` additively.
- Extract `src/lib/nutrition/calculations.ts`, `constraints.ts`, `prices.ts`, `units.ts`, `solver.ts`, `diversity.ts` and `validation.ts`.
- Update `src/lib/planner.ts` to orchestrate these modules rather than embed all rules in one function.
- Update `src/app/api/profile/route.ts`, `src/app/api/plan/route.ts`, `src/app/api/meals/options/route.ts`, `src/app/api/records/route.ts`; add owned price-book, plan-history and actual-meal-log endpoints.
- Preserve and extend `health-profile-form.tsx`, `budget-meals-view.tsx`, `meal-dialogs.tsx`, `budget-meal-card.tsx`; add a generation-diff and price-editor view without a visual rewrite.
- Remote parity mapping: `src/App.jsx` calculation/template/profile sections become adapters to reviewed shared logic; unsupported-diet fallback is removed, not copied into the server.

### Acceptance gate

Run all six requested diet/goal/budget scenarios with saved profile fixtures. Check every ingredient classification/allergen, raw/cooked conversion, nutrient sum, price cap, monthly boundaries, protein/calorie gaps, seven-day variety, history avoidance, preparation instructions, replacement, concurrency and explicit infeasibility. Clinical adequacy requires qualified review beyond self-consistency tests.

## 4. Phase 4 — structured training and actual history

- Use goal, age/policy, confirmed body measurements, experience, activity, location/equipment, time and limitations. Diet must not change the exercise prescription itself; recovery advice respects diet.
- Introduce reviewed exercise IDs with muscles, technique, common mistakes, regression/alternative and an illustration/demo reference. Prescribed and actual sets are different data.
- Build appropriate weekly splits with recovery and variable intensity, not one hard-day description repeated. Fit realistic work/rest time into the available session time.
- Do not automatically prescribe through reported pain/injury or increase a load from a checkbox. Provide safety deferrals and professional guidance.
- Record actual sessions, sets, reps, load, elapsed duration/rest and dated completion. Compute PRs from these records. Progressive-overload suggestions use history, readiness and user confirmation; never blindly add weight.
- Preserve `WorkoutsView` and current completion behavior as a compatibility layer while introducing actual records and labelling legacy plan-only checkmarks honestly.

Touched/proposed: `src/lib/training/*`, new session/exercise routes, additive schema, workout dialogs and `src/components/views.tsx`. Test experience/equipment/time, limitations, recovery, actual logging, PR correctness and preservation across regeneration.

## 5. Phase 5 — actual activity ledger, pedometer and MET estimates

### Implement reliable manual/ledger foundation first

- Add a dedicated `Daily Activity Tracker` view and dashboard card with real data only. Before measurements: `No authorized activity yet`/unavailable, not invented demo counts or misleading zero-filled history.
- Store configurable step goals separately from measurements. Display source, coverage, last sync and permission state.
- Support manual walking/activity entries with date, actual duration, distance or pace/intensity and optional explicitly manual steps. Validate units and impossible intervals. Manual values are not sensor readings.
- Derive daily/weekly/monthly totals using the user's timezone. Missing data is different from a confirmed zero.
- Use idempotent batch ingestion and interval/source provenance. Do not add sensor, manual workout and Health Connect calories/steps for the same activity window.

### Browser foreground sensing

- Capability-detect secure context, DeviceMotion support and actual usable samples. Presence of an API is not proof of a step sensor.
- Request motion permission only from an explicit user action where the API requires it. Handle denial, missing/null samples, iframe permissions policy and unsupported devices.
- If a cadence/peak-based foreground detector is implemented, include calibration, cadence limits, noise rejection, debouncing, pause/resume, visibility handling and reset tests. Label it **experimental foreground estimate** until physically validated.
- No continuous closed/locked-screen tracking claim. Stop/pause appropriately and keep the manual fallback.
- Process samples locally and batch confirmed observations; do not write every accelerometer event to PostgreSQL.

### Android/Health Connect

- First choose a production-safe bundled native client/bridge compatible with the reconciled frontend and authenticated API. Do not assume `.next` is a static Capacitor `webDir`.
- Prefer Health Connect `StepsRecord.COUNT_TOTAL` aggregation for authorized cumulative step totals; raw-record sums can double count providers. Preserve Android's activity-app priorities.
- Capability-check Health Connect/provider features and every permission. On supported recent Android versions, on-device step collection depends on module/extension features—not Android version alone.
- Use a native `TYPE_STEP_COUNTER` adapter where appropriate and hardware exists. It is cumulative since boot while active: persist baselines/boot epochs, handle resets and avoid treating a new baseline as new steps.
- Request only required read permissions; background/history permissions are separate optional grants and must be feature-gated. Do not request heart rate, location, weight or write-health permissions unless the feature actually needs them.
- Build a canonical activity/source precedence and correction policy before combining providers. Do not re-import or re-export aggregates in a loop.
- Follow the physical test matrix in `ANDROID_DEVICE_TEST_PLAN.md`. No background acceptance until an actual signed build passes the documented phone cases.

### Calorie estimation policy

Add `src/lib/activity/met-catalog.ts`, `energy.ts`, `distance.ts`, `deduplication.ts`, `aggregation.ts`, `capabilities.ts`, `foreground-detector.ts` and platform adapters, plus typed owned activity endpoints and UI components.

- Use a cited, versioned activity/intensity/speed MET catalog (for example, reviewed 2024 Adult Compendium categories, subject to its use terms).
- Gross estimate: `MET × 3.5 × verified body weight (kg) ÷ 200 × actual minutes`.
- Active-above-rest estimate: `max(MET − 1, 0) × 3.5 × kg ÷ 200 × actual minutes`.
- Label the chosen convention. Do not confuse gross activity energy, active energy, BMR/TDEE and food intake.
- No weight/duration/intensity or no valid activity record: show unavailable/needs input, not a fabricated burn.
- Distance from steps/stride is an estimate; disclose calibration assumptions. Do not infer exact speed or duration from a fixed steps multiplier.
- Separate walking, workouts and other activities after overlap/source reconciliation. Do not add Health Connect active energy to a MET estimate for the same episode.
- Do not automatically subtract activity calories from food targets or encourage automatic eat-back.

## 6. Phase 6 — dashboard and grounded coach

- Unify calculation policy in a tested module with recorded formula/version and uncertainty. Add appropriate BMI/BMR/TDEE/protein views only with confirmed inputs and clear age/medical limitations; do not infer biological calculation inputs from gender identity.
- Build dashboard nutrition from dated actual portion logs; training from actual sessions; steps/energy from reconciled activity records. Remove hardcoded maintenance percentages and label planned versus performed minutes separately.
- Charts show real dates/coverage; no seeded histories in a real account and no zeros invented for missing days.
- Keep Nivra's trusted fact lookup and references. Extend question understanding and evidence-backed answer coverage without pretending a local rule engine is a verified live model.
- A live model, if an existing approved provider is available, may propose structured actions/known recipe or exercise IDs. Nutrition, prices, analytics and authorization remain deterministic/server-validated. Do not let a model write health records or invent food facts.
- Chat requests to change tomorrow's meal or make a plan cheaper must show a concrete diff, budget/target effects and confirmation before updating only the intended records. Reads come from the authenticated server profile, not arbitrary client JSON.
- Test the master's example questions with sparse/contradictory histories, allergies, low budgets, unsafe requests, prompt injection, provider timeouts/quota failures and unknown facts. Medical causes and body-composition diagnoses are not inferred.

## 7. Phase 7 — verification, migration and deployment gates

1. Run baseline regression before/after each module; add 2.0 tests that do not encode the old four-slot/demo-promotion behavior as success.
2. Require lint, type generation/typecheck, production build, unit/integration and browser tests. Audit dependencies; assess/resolve relevant critical/high findings before release.
3. Test real device/browser matrices, India/local midnight, calendar-month rollover, DST/timezone changes, offline/network loss, retries and concurrent devices.
4. Verify backup export/import in a separate account/database. Import preview must show counts, source account and duplicate/conflict decisions. Never silently merge two users or overwrite records from an untrusted JSON file.
5. Rehearse additive migration and rollback; compare counts/provenance without dumping personal data. Keep originals until parity and user-reviewed migration are verified.
6. Preserve existing Vite deployment workflows during integration. Update only after target architecture/API hosting is proven. A successful static frontend deployment is not proof of working backend, database, AI or Android tracking.
7. For native release, keep signing secrets outside source, document necessary permissions/data sharing and follow health-data/store policies. Free tools do not imply no operating quotas or Play registration fees.
8. Provide a final implementation report separating implemented/tested, implemented/unverified and not implemented, with actual device evidence. Never mark a browser sensor simulation as background tracking proof.

## 8. Definition of release-ready

All master acceptance items need individual evidence, including budget/diet/variety and actual record preservation, structured workout history, authorized real steps on supported devices, honest unsupported fallback, deduplicated distance/energy, truthful analytics, grounded coach and proven deployment. A homepage, PWA install or the current 37 passing baseline groups is insufficient.

**No Phase 3–7 feature implementation or migration has been performed by creating this plan.**
