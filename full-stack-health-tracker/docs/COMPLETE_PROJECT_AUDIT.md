# Complete project audit — checkout 7a2f04d

Date: 2026-11-01. Scope: source review and the tests in TEST_REPORT.md; not a penetration test, clinical review, production assessment or proof of feature parity. Existing historical audit files in `docs/audit/` are preserved; their 2026-10-30 test results describe a different environment and must not be treated as current runs. The repository-root handoff `docs/ARENA_NEW_CHAT_HANDOFF.md` was read; it describes the earlier root application and cautions that Floot parity is not established.

## Repository and architecture

`main` and this session branch were at `7a2f04d9870f2eea291b0ee06c60971b6fe78515` when inspected. GitHub API confirmed the repository/default branch. The checkout contains two independent applications:

* Root: React/Vite/Tailwind 3 and Lucide, mostly `src/App.jsx`; localStorage profile, in-memory tracking, PWA, and Cloudflare Pages `functions/api/coach.js` using OpenRouter. Root workflows build/deploy this app, not the Next app. Root README warns the Floot transfer is not verified.
* `full-stack-health-tracker/`: Next 16 App Router/React 19/TypeScript/Tailwind 4/Lucide, PostgreSQL via `pg`/Drizzle, and PWA. `src/app` contains pages, styling, and API handlers; `src/components` contains app shell, forms, dialogs and views; `src/lib` contains auth, planner, catalog, coach and shared types; `src/db` defines connection and tables; `scripts` contains planner and browser tests; `docs/audit` contains prior findings. npm is documented; no tracked lockfile in either app. Uploaded Next public directory has only `offline.html` and `sw.js`: previously documented icons, photos and font are missing from this checkout.

## Data flow and security

`wellnest-app.tsx` loads `/api/dashboard`, verifies `/api/auth`, renders tab views and sends same-origin JSON mutations. A first unauthenticated dashboard request creates a seeded demo and cookie. Auth signs up by converting that demo, signs in against scrypt hashes, issues hashed opaque session tokens in HttpOnly cookies and supports recovery key rotation. `requireUser` scopes most private operations; record mutations filter on both user ID and row ID, and mutations check Origin. Sessions expire; failed login/recovery attempts are limited by account/action. This is source evidence, not a completed independent security test. The dashboard is deliberately accessible as a demo without login, not strictly login-protected. Origin checking trusts host/forwarded-host headers and permits missing Origin unless fetch metadata says cross-site; deployment proxy trust and CSRF defenses need review. Per-account failure limits do not provide comprehensive IP/global throttling; demo creation and signup need abuse controls. RLS, encryption at rest, production configuration and backups have not been independently verified here.

Tables in `src/db/schema.ts`: users, sessions, meals, workouts, water logs, weight logs, auth failures, coach messages. Foreign keys cascade; application queries provide ownership checks. No migration directory is tracked. `src/db/index.ts` requires `DATABASE_URL`; `drizzle.config.json` instead contains a fixed local development URL. Do not run `drizzle-kit push` against any non-isolated database. Existing data cannot be reliably classified as seeded versus user-entered after signup without provenance.

## API inventory

| Route | Methods | Behavior / caveat |
|---|---|---|
| `/api/auth` | GET, POST | Current identity; sign-in/up/out/recovery. Signup preserves demo data, including synthetic history. |
| `/api/account` | PATCH | Password, recovery key, sign-out other sessions; requires user/password. |
| `/api/dashboard` | GET | Loads account-scoped data or creates demo on unauthenticated request. |
| `/api/profile` | PATCH | Validates profile/preferences; full profile save deletes and recreates current plan rows. |
| `/api/plan` | POST | Deletes and regenerates all meal/workout plan rows, including custom rows. |
| `/api/records` | POST, PATCH, DELETE | Owner-scoped CRUD; manual nutrition can be entered, meal swaps recomputed server-side. |
| `/api/meals/options` | GET | Owner-scoped catalog alternatives and partial budget availability. |
| `/api/foods` | GET | Public reference food catalog, estimated sample prices. |
| `/api/coach` | GET, POST, DELETE | Owner-scoped saved conversations, rate-limited question processing; local rules with optional Groq topic routing. |
| `/api/health` | GET | Executes DB `select 1`; public readiness endpoint, not a full diagnostic. |

## Planning, nutrition, AI and UI

`food-catalog.ts` defines 17 foods and 18 recipes, raw/dry state, nutrient estimates, allergen tags and sample prices. The planner computes recipe quantities and cost in paise, filters listed ingredients by diet/allergies, rejects unknown restrictions, offers swaps, and builds a four-slot seven-day plan. Nutrition source links are generic/secondary in several cases; individual values and clinical adequacy have not been validated. No fiber, user-adjustable price book, dated consumption journal, ingredient substitution, monthly budget, nutrient-target optimization or history-based rotation. Equal input regenerates the same plan. User-entered unpriced meals make a daily cap uncertain; UI warns. Free-text allergy parsing and cross-contact are not a safety guarantee.

`planner.ts` estimates adult calories from a Mifflin-like equation, activity multiplier and goal adjustment; minors get no adult calorie target; no adult BMI or macro target view is provided by this Next app. The `other` gender option uses an unvalidated midpoint, and gender identity is not a validated substitute for equation input. Plans should not be presented as medical prescriptions. Workout templates use age, activity, equipment, experience, duration and focus, but no injuries or real sets/history/PRs. Current checkbox minutes are prescribed, not measured. Profile/weight updates can leave targets stale until recalculation.

Next coach: `coach-engine.ts` generates local, sourced rule-based answers from authenticated saved records and one previous question; `coach-provider.ts` optionally sends unrecognized question text to Groq for topic classification only. Free-form generated advice is not shown. It does not implement OpenRouter and does not have access to missing activity/sleep history. Provider keys are server environment variables; no configured provider or live requests verified in this environment. Root Cloudflare function uses server-side `OPENROUTER_API_KEY` with a potentially billable default model; its public unauthenticated endpoint lacks application-level rate limiting. Root frontend has stale Gemini text despite actual OpenRouter backend; no Gemini integration should be added. GitHub Pages static hosting cannot serve that Cloudflare function. No live OpenRouter request was made.

The Next UI implements responsive shell, account forms, profile, weekly plan, swaps, grocery export, water, weight, reminders, coach and installation guide. Code includes loading/error states and dialog focus handling, but actual current-checkout browser/accessibility/device tests are blocked. `public/sw.js` avoids API/private HTML caching, but `cache.addAll` of absent icon files will reject service-worker installation; manifest icons, food photos and font also reference missing assets. It offers an offline connection page, not offline private data or write queue. Reminders are foreground only. No automatic steps, Health Connect, Android app, sleep, body measurements, structured exercise sessions, JSON backup/import, account deletion, or complete analytics exist in this checkout. See FEATURE_STATUS.md.

## Key risks and next work

See BUGS_AND_ISSUES.md and DEVELOPMENT_ROADMAP.md for ranked findings, exact files, test and rollback gates. First recover properly licensed original assets or deliberately provide suitable replacements and verify PWA; establish an isolated database for tests; fix data-loss/provenance safely with additive, reviewed designs; resolve vulnerabilities and lint. No production migration, paid service, root app modification, deployment or push is authorized by this audit. Latest Floot source/data was not supplied, so full recovery and parity cannot be established.

## Follow-up after initial audit

The missing icon assets have since been replaced with newly authored placeholder icons; simulated public-shell checks now pass. This document's findings describe the initial checkout, and the test report records subsequent results. Meal imagery, font and real browser/device verification remain open.

A subsequent partial mitigation avoids regenerating plans for non-plan profile edits. Plan-changing edits and explicit refresh still replace records. See the latest test report and issues follow-up; the original findings above are the audit snapshot.

A subsequent implementation stage adds JSON export of current account data (not credentials), with mock route checks only. Import, real database/browser verification, and consistent snapshots remain open; see TEST_REPORT.md.
