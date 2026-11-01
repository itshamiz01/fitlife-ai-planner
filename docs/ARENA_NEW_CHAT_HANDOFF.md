# FitLife AI Planner — Arena New-Chat Handoff & Project Status

**Prepared:** 1 November 2026  
**Repository:** https://github.com/itshamiz01/fitlife-ai-planner  
**Repository owner:** itshamiz01  
**Default branch inspected:** `main`  
**Purpose:** Give a fresh Arena AI chat enough context to continue the existing FitLife project without rebuilding it or losing work.

> **Critical instruction:** This is an existing project. Clone and inspect this exact repository first. Preserve its current code and history. Do not start a replacement project, do not overwrite the repository with a new scaffold, and do not claim that a feature works until it has been verified in the code and in a running build.

---

## 1. Product vision

FitLife AI Planner is intended to become a practical, affordable, AI-assisted personal health and fitness companion for web and Android users.

It should help a person manage:
- Weight gain, weight loss, muscle gain, maintenance and general fitness goals.
- Personalized nutrition and meal plans.
- Affordable food choices based on a real daily/monthly budget.
- Vegetarian, eggetarian, non-vegetarian and vegan diets.
- Calories, protein, carbohydrates, fats and other useful nutrition data.
- Workouts, exercise history and progressive training.
- Hydration.
- Walking, steps, distance and activity.
- Sleep and recovery.
- Weight and body measurements.
- Progress charts, reports and health habits.
- A context-aware AI Coach that uses the user's actual saved profile and app records.

The product must be useful to ordinary people, including users with limited food budgets. For the initial market, prioritize Indian users, Indian food options, INR, metric units and practical regional meals.

This is a wellness and fitness product, not a medical diagnosis or emergency-care application.

## 2. User's non-negotiable development preferences

1. Continue from the existing GitHub codebase.
2. Do not rebuild from scratch.
3. Preserve all working components, existing code, user data and project history.
4. Inspect before editing.
5. Do not delete or replace a working feature without proving why the change is needed.
6. Do not reset or wipe any database or user storage.
7. Do not migrate away from the existing project/backend until the migration is verified and approved.
8. Avoid paid services and keep the operating cost at ₹0 wherever practical.
9. Do not use Gemini API. The intended AI provider is OpenRouter.
10. Never put API keys in frontend code or commit secrets.
11. Do not add fake health readings, fabricated steps, made-up calorie burn, sample user progress or fake connected-device statuses to real user accounts.
12. Clearly distinguish actual readings, estimates, manually entered data and unavailable data.
13. Keep the application responsive on mobile and desktop.
14. Test before reporting completion.
15. Do not deploy or make destructive production changes without authorization.

## 3. Repository facts verified on 1 November 2026

The GitHub connector was able to access the repository and confirmed:

- Repository: `itshamiz01/fitlife-ai-planner`
- Visibility: Public
- Default branch: `main`
- Repository is not archived.
- The authenticated GitHub connection has push/admin permissions.
- The README explicitly states that the repository contains an original uploaded React source wrapped in a Vite scaffold, and is **not a verified complete transfer of the latest Floot changes or database/authentication state**.
- The README explicitly warns to keep the Floot project intact until feature parity and data migration are checked.
- The package uses React, Vite, Tailwind CSS 3.4.17 and lucide-react.
- The latest commit visible during this inspection was dated 15 October 2026.

Recent repository commits include:
- Switch secure AI Coach backend from Gemini to OpenRouter.
- Add manual Cloudflare Pages deployment support for the secure AI backend.
- Correct GitHub Pages Vite base path.
- Improve PWA icon metadata for Android installation.
- Invalidate stale PWA cache after updates.
- Support both GitHub Pages and Cloudflare Pages base paths.
- Filter obvious allergy conflicts and clarify meal-plan estimates.
- Add secure Cloudflare Pages AI Coach endpoint.
- Route AI Coach through a secure backend and remove misleading fallback replies.
- Reset demo profile and add first-user onboarding.

The above are repository commit messages, not proof that every feature has passed production testing.

## 4. Current technology and code structure verified

### Frontend
- React.
- Vite.
- JavaScript/JSX (the inspected main application is `src/App.jsx`).
- Tailwind CSS.
- lucide-react icons.
- React hooks for component and application state.
- A single large `src/App.jsx` currently contains most of the main application UI, data and calculation logic.

### Entry and styling
- `src/main.jsx` mounts the React application and imports `src/App.jsx` and `src/index.css`.
- `src/index.css` currently contains Tailwind directives and minimal global CSS.
- `index.html` contains the FitLife AI Planner title, theme metadata, mobile/PWA metadata, icon and manifest references.
- `vite.config.js` supports a GitHub Pages repository base path when `GITHUB_PAGES=true`, and root path for Cloudflare Pages.

### PWA
- `public/sw.js` implements a service worker.
- It caches the app shell and same-origin GET requests, attempts network-first navigation, and falls back to cached pages when offline.
- `src/main.jsx` registers the service worker in production.
- The repository has PWA icon/manifest support.
- PWA installation is not the same as native Android background sensor access. Do not claim that a PWA automatically provides reliable background step counting.

### AI backend
- Cloudflare Pages Functions endpoint exists at `functions/api/coach.js`.
- The frontend calls `/api/coach`.
- The endpoint requires the Cloudflare Pages environment secret `OPENROUTER_API_KEY`.
- Optional model environment variable: `OPENROUTER_MODEL`.
- Default model configured in the endpoint: `openai/gpt-4o-mini`.
- The endpoint calls the OpenRouter Chat Completions API.
- The API key is read server-side from the environment, not embedded in the frontend.
- The endpoint validates that a message is present and no longer than 4,000 characters.
- It passes user profile and calculated target context into the AI system instruction.
- It includes basic upstream error handling and returns an error if the provider is unavailable or returns an empty answer.
- The endpoint includes a POST handler and rejects unsupported methods.

**Configuration still to verify in the actual Cloudflare account:** whether `OPENROUTER_API_KEY` and any intended `OPENROUTER_MODEL` value are configured for the correct environment (production/preview), whether the Pages project is connected to the correct GitHub repository/branch, and whether the live endpoint responds successfully.

Never ask the user to paste a secret into source code or commit it to GitHub. Configure it as a Cloudflare Pages secret/environment variable.

## 5. Existing features found in src/App.jsx

The current main application file is approximately 2,252 lines and contains these major areas.

### 5.1 User profile and onboarding
A profile model exists with fields including:
- Name.
- Age.
- Sex.
- Height in cm.
- Current weight.
- Target weight.
- Activity level.
- Primary goal.
- Country (default India).
- Metric unit system.
- Dietary preference.
- Allergies.
- Religious/other food restrictions.
- Preferred cuisines.
- Food budget category.
- Workout preference (home/gym).
- Fitness experience.
- Equipment.
- Workout days per week.
- Sleep hours.
- Disclosed health conditions.
- Onboarding completion state.

A first-user onboarding/profile modal exists. The profile is saved in browser localStorage using the key `fitlife-profile-v2`.

**Important limitation:** localStorage profile storage is browser/device-local. This is not the same as secure cloud account storage or multi-device synchronization.

### 5.2 Health and calorie calculations
Calculation helpers exist for:
- BMR using the Mifflin-St Jeor formula.
- TDEE using activity multipliers.
- BMI.
- A BMI-based healthy-weight range.
- Goal calorie targets for weight loss, gain and maintenance.
- Macronutrient targets.
- Hydration estimates.
- An estimated weight-goal timeline.

The code includes safety boundaries and comments around calorie targets. These formulas and boundaries still need a specialist review and automated tests. Display calculations as estimates, not medical measurements.

### 5.3 Nutrition and meal plans
A regional meal data structure exists in `REGIONAL_MEALS`.

The inspected code contains meal-plan data for:
- Vegetarian.
- Non-vegetarian.

Meal entries include fields such as:
- Meal name.
- Calories.
- Protein.
- Carbohydrates.
- Fat.
- Fiber.
- Preparation time.
- Ingredient list.
- Preparation instructions.

The Diet Plan screen supports seven day labels, meal-slot rendering, meal detail viewing, an AI substitution request and grocery-list functionality.

**Confirmed code issue requiring attention:** the current selection logic is:
`REGIONAL_MEALS[profile.dietaryPreference] || REGIONAL_MEALS.vegetarian`

The profile UI offers four values: Vegetarian, Vegan, Eggetarian and Non-Vegetarian. However, the inspected meal data structure has only vegetarian and non-vegetarian datasets. Therefore Vegan and Eggetarian currently fall back to the vegetarian dataset instead of receiving properly validated dedicated meal plans. This is a priority bug. Vegan meals must exclude all animal-derived ingredients, and eggetarian plans must explicitly allow eggs while retaining the user's other restrictions.

The current meal data is largely predefined/static rather than a complete verified food/ingredient database with live local prices. Do not describe it as a fully adaptive AI nutrition engine yet.

### 5.4 Allergy screening
The Diet Plan code contains conservative text-based allergy screening:
- It examines meal names and ingredient text.
- It uses an alias map for some common allergen terms.
- It excludes obvious text matches from daily calorie/protein totals.

The source comments explicitly acknowledge that this cannot detect hidden ingredients or cross-contamination. Keep this limitation visible. A robust implementation needs structured ingredient/allergen metadata, not only string matching.

### 5.5 Workout planner
A `WORKOUT_PROGRAMS` data structure exists.
The UI supports:
- Home workout mode.
- Gym workout mode.
- Workout day/routine display.
- Marking a routine/day complete.
- Workout plan viewing.

The current state tracks completed workout items in React state. Verify whether workout completion persists after refresh; do not assume it does.

Further work is needed for a comprehensive exercise library, individual exercise logging, sets/reps/load history, progressive overload, rest timers, personalized alternatives and recovery-aware scheduling.

### 5.6 Hydration tracker
A Hydration view exists.
- The app calculates an estimated daily hydration target from profile information.
- Users can add water using quick-add amounts.
- The UI displays progress and a hydration schedule.
- The main application has a daily water state variable.

Verify whether hydration records persist and whether the daily total resets correctly at local midnight. Do not assume cloud synchronization exists.

### 5.7 Weight logging and progress
The app includes:
- A weight log modal.
- Current and target weight.
- Weight history state.
- A weight journey visualization.
- Dynamic calculations after weight changes.
- Goal timeline calculations.

The code includes a comment that the timeline should start with the user's actual starting weight rather than demo history. Verify progress direction for weight gain, weight loss and maintenance. The dashboard must never show “kg down” for a user whose goal is weight gain.

Verify whether weight history is persisted. The profile itself is stored in localStorage, but the presence of a React state variable does not prove that all logs persist.

### 5.8 Dashboard
The Dashboard view includes:
- Welcome/profile context.
- Goal-related summary.
- Calorie and macro information.
- Weight journey trend.
- Hydration summary and quick-add controls.
- Links to diet, workout and AI Coach views.
- Grocery/meal-related entry points.

The visual style in the latest user-provided screenshots is:
- Forest-green and ivory/light background.
- Leaf logo and minimal wellness branding.
- Rounded cards.
- Clean typography.
- Food imagery.
- Compact mobile navigation/header.
- Floating AI Coach action.

The user wants to preserve this visual identity and improve its information hierarchy, not replace it with an unrelated design.

### 5.9 AI Health Coach
The app has an AI Coach view with:
- Chat messages.
- Chat input.
- Loading state.
- Suggested quick prompts.
- Message display.
- Backend call to `/api/coach`.

The frontend sends user message, profile information and app-calculated targets to the backend. The backend constructs a system instruction using the supplied profile and targets.

This is better than a canned local fallback, but it does not yet prove the AI has access to the user's complete historical health records. At present, the verified context is primarily the profile and calculated targets sent with the chat request.

Future work: pass relevant structured logs (with privacy minimization) so the AI can answer history-aware questions about meals, workouts, steps, sleep and progress. Validate AI output and require user confirmation before important data-changing actions.

### 5.10 Grocery list and meal detail
Components exist for:
- Meal details modal.
- Grocery modal.
- Profile modal.
- Weight log modal.

Verify all buttons and modal flows, clipboard export, quantity/cost calculations and accessibility.

## 6. Features not verified / not yet implemented in the inspected repository

Do not tell the next agent these features are already complete. They are product goals or gaps until code and tests prove otherwise.

### Nutrition gaps
- Dedicated validated vegan meal dataset.
- Dedicated validated eggetarian meal dataset.
- Strict numeric daily/monthly budget optimizer.
- Ingredient price database with regional INR pricing and last-updated dates.
- Cost per actual portion calculation.
- Reliable nutrition database with source attribution.
- Complete recipe variety/rotation engine.
- Exact ingredient quantities and serving scaling across all meals.
- Full nutrition recalculation after ingredient/portion changes.
- Barcode scanner.
- Food photo recognition with user correction.
- Robust grocery aggregation and actual budget totals.

### Workout gaps
- Comprehensive structured exercise library.
- Detailed individual exercise logging.
- Sets, reps, weight/load, duration and rest history.
- Personal records.
- Progressive overload logic.
- Exercise alternatives by equipment/muscle group.
- Recovery-aware schedule adjustments.
- Safe handling of pain, injury and restrictions.

### Activity gaps
- Automatic step counter.
- Android Health Connect integration.
- Native Android sensor/background activity implementation.
- Walking distance from a real device record or calibrated estimate.
- Active calorie estimation with transparent methodology.
- Duplicate-source prevention.
- Hourly/daily/weekly activity charts.

A browser/PWA-only page must not be presented as a reliable always-on pedometer. Investigate Health Connect and, if required, a native Android wrapper such as Capacitor with a supported native plugin. Test on a real phone.

### Sleep and recovery gaps
- Sleep logging and history.
- Health Connect sleep synchronization.
- Sleep consistency analytics.
- Recovery recommendations based on actual records and user feedback.

### Body and analytics gaps
- Waist/chest/hip/arm/thigh measurements.
- Secure private progress-photo storage.
- Weekly/monthly health reports.
- Personal health timeline.
- Exportable PDF/CSV/JSON health records.
- Transparent daily wellness score, if implemented.

### Accounts, storage and sync gaps
- Secure multi-user registration/login.
- Backend-enforced user data isolation.
- Cloud database for profiles and health logs.
- Multi-device synchronization.
- Offline write queue and conflict resolution.
- Secure account deletion and data export.

The current verified profile persistence is localStorage. Do not claim that a complete account/authentication/cloud database system exists in this GitHub snapshot.

### AI gaps
- Full historical health-record context.
- Structured tool/action execution.
- Confirmation before changing important user data.
- Strict validation of generated meal plans against dietary restrictions, allergies, budget and nutrition targets.
- AI provider fallback/availability behavior tested end-to-end.
- Automated prompt and response safety tests.

### Platform/deployment gaps
- Verified Cloudflare Pages production deployment.
- Verified production environment secrets.
- Verified Android native build.
- Verified real-device background sensor behavior.
- Verified production database migration.
- Verified end-to-end and security tests.

## 7. GitHub and deployment status

The repository README currently describes:
- Local development using `npm install` and `npm run dev`.
- Build command `npm run build`.
- Build output `dist`.
- Production branch `main`.

The repository contains a GitHub Actions workflow at:
`.github/workflows/deploy.yml`

That workflow:
- Runs on pushes to `main` and manual dispatch.
- Uses Node.js 20.
- Runs `npm install`.
- Builds with `GITHUB_PAGES=true`.
- Uploads the `dist` artifact.
- Deploys to GitHub Pages.

The code also contains a Cloudflare Pages Function at `functions/api/coach.js` for the OpenRouter endpoint.

**Important:** A GitHub Pages deployment workflow does not deploy Cloudflare Pages Functions. The repository has a Cloudflare-compatible function source, but the exact live Cloudflare Pages project configuration and deployment status were not verified in this inspection. Confirm the chosen production host and deployment pipeline before changing anything. Do not confuse GitHub Pages hosting with Cloudflare Pages hosting.

No local build, browser test, Android test or production smoke test was executed as part of this repository inspection. The new agent must run the appropriate checks in the actual workspace before declaring success.

## 8. Known important bugs / risks to address first

1. Vegan and eggetarian profile options currently resolve to the vegetarian meal dataset due to the fallback logic.
2. Dashboard progress wording/calculation must correctly distinguish weight gain from weight loss. The user has specifically noticed a weight-gain goal being described as “kg down”, which is incorrect.
3. Profile data is localStorage-based in the inspected code. Multi-device cloud sync and secure user accounts are not established by this snapshot.
4. Water, workout completion, weight history and chat history are React state variables; verify persistence individually rather than assuming they survive refresh.
5. Meal plans and their nutrient values are predefined estimates. They need data-source validation and clear estimate labels.
6. Allergy screening is text-based and cannot guarantee detection of hidden ingredients or cross-contamination.
7. The AI Coach sends profile/target context, but complete historical health data access is not verified.
8. Step tracking, sleep tracking and Health Connect/native sensor support are not verified as implemented.
9. The PWA service worker caches app-shell and same-origin GET responses; test cache invalidation and avoid stale API/data behavior.
10. The production deployment path is ambiguous between GitHub Pages and Cloudflare Pages. Confirm intended hosting before modifying deployment configuration.

## 9. Product roadmap agreed with the user

Implement in controlled phases, not as one giant rewrite.

### Phase 0 — Fresh audit and baseline
- Clone this repository.
- Inspect every file and commit history.
- Inspect the original Floot project/export if the user can provide it.
- Identify which changes exist only in Floot and which are in GitHub.
- Inspect database/auth/backend and all deployment configuration.
- Run build and existing tests.
- Produce a feature-by-feature status matrix: Working / Partial / Broken / Missing / Not verified.
- Do not edit code until the audit is complete and findings are reported.

### Phase 1 — Stabilize the existing application
- Fix broken UI and calculations.
- Fix goal-direction logic.
- Verify persistence.
- Verify meal/workout/hydration/weight flows.
- Fix AI Coach integration errors.
- Ensure no false fallback replies or fake metrics.
- Preserve the existing design.

### Phase 2 — Nutrition intelligence
- Correct four dietary categories.
- Create dedicated vegan and eggetarian data/validation.
- Ingredient-level dietary and allergen checks.
- Indian food database with source and estimate metadata.
- Real numeric budget calculation.
- Meal variety/rotation.
- Recipe instructions and serving scaling.
- Meal replacement and grocery list.
- Test ₹80, ₹100, ₹120, ₹150 and custom daily budgets without silently exceeding them.

### Phase 3 — Workout intelligence
- Exercise database.
- Personalized home/gym routines.
- Exercise logging.
- Sets/reps/load/rest.
- Progressive overload.
- Alternatives and safety constraints.
- Recovery scheduling.

### Phase 4 — Activity tracking
- Real step data source.
- Health Connect permissions and integration.
- Native Android tracking only if required.
- Distance and activity duration.
- Calorie-burn estimates with clear source/method.
- Background and screen-lock tests on real Android devices.
- Duplicate and time-zone handling.

### Phase 5 — Sleep, recovery and body tracking
- Sleep log/sync.
- Body measurements.
- Progress history.
- Recovery insights.

### Phase 6 — Analytics and reports
- Daily/weekly/monthly reports.
- Real-data charts.
- Health timeline.
- Export to CSV/PDF/JSON.

### Phase 7 — AI Coach intelligence
- Profile-aware and history-aware answers.
- Retrieve only relevant user records.
- Strict structured outputs for plans.
- Validate diet, budget, allergens and training restrictions.
- Confirm before important write actions.
- Continue functioning gracefully if OpenRouter is unavailable.

### Phase 8 — Secure accounts and synchronization
- Decide on backend/database after auditing existing infrastructure.
- Migrate only after backup and parity checks.
- Enforce user isolation on the backend.
- Sync web and Android.
- Offline support and conflict resolution.
- Data export/deletion and integration revocation.

### Phase 9 — Android, deployment and QA
- Confirm Cloudflare Pages/GitHub Pages architecture.
- Verify production secrets.
- Build/test PWA and Android app as separate targets.
- Test real devices.
- Security, privacy, accessibility and performance testing.
- Deploy only after passing tests.

## 10. Dashboard design reference from the user

The user provided two FitLife screenshots:
1. A minimal ivory splash screen with a forest-green rounded-square icon and white leaf mark.
2. A mobile dashboard with:
   - Forest-green status/header styling.
   - Ivory/light background.
   - “A little better, every day.” welcome headline.
   - Greeting and date.
   - A light-green nutrition/weekly-plan hero banner with Indian thali imagery.
   - A dark forest-green weight goal card.
   - White/ivory metric cards for calories and hydration.
   - Rounded corners and restrained green accents.
   - Floating AI Coach action button.

Preserve this visual language. Improve functionality, data hierarchy and navigation without turning the app into a crowded grid of cards.

Dashboard improvement requirements:
- Correct gain/loss/maintenance wording and progress.
- Daily summary for calories, protein, steps, water, sleep and workouts.
- Quick actions: log meal, add water, steps/activity, log workout, log weight, log sleep.
- Today's meal/workout/walking plan.
- Useful AI insight.
- Weekly progress summary.
- Mobile bottom navigation.
- Floating AI control must not cover important controls.
- All displayed values must come from real records or be explicitly marked as estimates.
- Empty states must guide the user to enter data.

## 11. Additional world-class product requirements

Long-term target features:
- Daily health overview/transparent wellness score.
- Live Activity Center.
- AI food scanner with portion correction.
- Sleep and recovery intelligence.
- Body transformation measurements and private photos.
- Weekly and monthly reports.
- Smart food budget manager.
- “What can I cook with ingredients I have?” feature.
- Personal health timeline.
- Habit insights and optional challenges.
- Optional notifications with user-controlled categories/frequency.
- Health Connect and future wearable integrations where supported.

These are roadmap items, not proof of current implementation.

## 12. Exact instructions for the new Arena chat

You are taking over an existing FitLife AI Planner project. This handoff describes the project history, verified repository facts, current code features, known gaps and roadmap.

**Start with the GitHub repository:**
https://github.com/itshamiz01/fitlife-ai-planner

Follow these steps:

1. Clone/open the repository and inspect the complete tree, not only README.
2. Read this handoff file and the repository README.
3. Inspect all commits, current branch and working tree.
4. Inspect `src/App.jsx`, `src/main.jsx`, `src/index.css`, `functions/api/coach.js`, `public/sw.js`, `vite.config.js`, package files and GitHub Actions workflows.
5. Inspect any original Floot project/source the user provides. The GitHub README warns that this repo is not a verified complete migration of the latest Floot project.
6. Do not overwrite the GitHub project with a newly generated app.
7. Do not assume that the previous chat's feature roadmap has been implemented.
8. Run `npm install` only after checking the lockfile and project instructions; run `npm run build` and report the actual result.
9. Make a detailed audit matrix showing each feature as Working, Partial, Broken, Missing or Not Verified, with file paths and evidence.
10. Identify what is saved in GitHub versus what may still exist only in Floot/local development.
11. Do not expose or request API keys in source code. Use environment secrets.
12. Do not perform destructive migrations, delete files, reset storage, change hosting or deploy without the user's approval.
13. After the audit, propose the smallest safe next implementation phase and wait for approval.

### First response expected from the new agent

Do not immediately start coding. First report:
- Which branch and commit are being used.
- What the repository actually contains.
- What features are present in code.
- What is only partially implemented.
- What is missing.
- What is broken or risky.
- Whether the app builds successfully.
- Whether AI Coach is configured and reachable.
- Whether any backend/database/auth system is actually present.
- Whether the latest Floot changes appear to be missing.
- What exact files should be changed in the first implementation phase.

**Do not claim full project recovery from GitHub until the GitHub source has been compared with the latest Floot project.**

---

## 13. Current status in one sentence

The GitHub repository contains a real React/Vite FitLife application with onboarding/profile calculations, dashboard, predefined diet plans, home/gym workout views, hydration, weight tracking, a PWA shell and a secure OpenRouter Cloudflare Pages AI Coach endpoint; however, the repository README itself warns that it is not a verified complete migration of the latest Floot project, and account/cloud synchronization, native activity tracking, sleep, full nutrition/budget intelligence and several advanced roadmap features remain unverified or not implemented.

**Preserve the codebase. Audit first. Continue from evidence.**
