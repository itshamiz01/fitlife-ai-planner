# Fit Life Bro

A full-stack, responsive health and habits workspace built with Next.js App Router, React, PostgreSQL, and Drizzle ORM.

## Included

- Private, database-backed demo workspace seeded on first visit (28 meals, 14 activities, water history, and weight check-ins).
- Registration, password sign-in, and sign-out using scrypt password hashing, hashed random session tokens, HTTP-only cookies, and account-scoped queries.
- Profile-driven seven-day meal and activity plans, dietary preferences, estimated adult nutrition and portions, and age-aware guidance for ages 5+.
- Create, read, update, delete, and completion flows for meals and activities; full water and weight logging CRUD.
- Optimistic water logging and completion updates, rollback on errors, empty states, skeleton loading, accessible dialogs, and mobile navigation.
- Hydration estimates, configurable reminder intervals, quiet hours, in-app alarms, optional browser notifications, reminder testing, and snoozing.
- Weight charts, date filters, hydration history, and CSV progress export.

## Run locally

1. Install dependencies with `npm install`.
2. Configure `DATABASE_URL` in `.env` for PostgreSQL.
3. Apply the schema with `npx drizzle-kit push`.
4. Run `npm run dev`.

A private demo is automatically created when `/api/dashboard` is first requested. Creating an account preserves that demo's records. Changing health details regenerates meal/activity plans and resets their checkmarks; water and weight history remain intact.

## Sign-in and account recovery

- Open `/login` to sign in, `/signup` to create an account, or `/forgot-password` to reset with a saved recovery key. The dashboard also has a visible Sign in button.
- Alex Morgan is sample data, **not** a shared account with a preset password. Explore the demo without credentials, or register your own email and password. Existing demo records are preserved when registering.
- Registration displays a private recovery key once. Copy or download it before continuing. Only its SHA-256 hash is stored. A successful reset rotates the key and revokes previous sessions. No email provider is configured, and the app does not claim to send reset emails.
- Existing accounts without a recovery key can create one in Settings → Sign-in & security after confirming the current password. That section also supports password changes and signing out other devices. Without a password, saved recovery key, or an already-signed-in device, an account cannot safely be unlocked.
- Passwords are exact, including spaces, for new accounts. Earlier trimmed-password accounts remain compatible. New passwords require 8–128 characters; sign-in does not incorrectly enforce a new-password minimum against legacy accounts.
- Only unsuccessful authentication attempts count toward the database-backed limit (10 failures in 15 minutes, separately scoped per account/action). Successful sign-ins clear their failure counter and never lock out another account.
- Remember me uses a 30-day session. Unchecked, the cookie is browser-session-only and the server session expires after 24 hours.
- HTTPS uses Secure, HttpOnly, SameSite=None, partitioned session cookies for embedded previews; local HTTP uses SameSite=Lax. Public production hosts also default to Secure when a TLS-terminating proxy reports its internal HTTP hop. A versioned cookie name prevents old unpartitioned cookies from shadowing the fixed session; existing legacy sessions remain readable and are migrated on sign-in. Sessions are verified with a second request before the UI reports a successful login. Browsers blocking even partitioned cookies receive an explicit Open in a new tab action.

## Install on a phone

Open `/install`, use the sidebar’s **Install Fit Life Bro** link, or use Settings → Install on my phone. The short `/download` URL redirects to `/install`; it is an installation guide for Option A (the home-screen web app), not an APK download. The guide provides a copyable/shareable link and the right installation steps for Android and iPhone.

- **Android / Chrome:** open the public HTTPS app link, tap ⋮ → Install app or Add to Home screen, then confirm. A direct Install Fit Life Bro button appears when the browser offers an installation prompt.
- **iPhone / Safari:** open the app link, tap Share (or Page Menu → Share) → Add to Home Screen, turn on Open as Web App if shown, and tap Add.
- Open the link directly rather than inside the builder’s embedded preview. The guide includes an Open in a new tab action when embedded.
- Create an account before moving a demo to another device, then sign in with the same email and password in the installed app. Browser and installed-app sessions can be separate; registered records remain in PostgreSQL.
- Phone access requires a public HTTPS deployment, not localhost. A temporary preview URL can expire. For lasting use, deploy a stable HTTPS URL and keep the app server and database available.

The app has a manifest, standalone display mode, Android and maskable icons, Apple home-screen metadata, a service worker, and a self-contained offline connection screen. Only public icons, fonts, and build assets are cached. API responses, online HTML pages, health records, session data, and password forms are never cached by the service worker. Tracking and account access need an internet connection; there is no offline write queue.

Installation alone does not enable background water alarms. Existing in-app reminders only run while the app is open; phone browsers may pause timers when backgrounded or locked. Optional closed-app Web Push requires separate server and per-device setup; see `docs/WATER_PUSH_SETUP.md` for limitations. This is an installable web app, not an App Store or Play Store package.

## Validation

- `npx next typegen`
- `npm exec tsc -- --noEmit --pretty false`
- `npm run build`
- With the app running: `npx playwright install --with-deps chromium`, then `node scripts/verify.cjs`, `node scripts/verify-auth.cjs`, `node scripts/verify-install.cjs`, `node scripts/verify-planner.cjs` and `node scripts/verify-budget-coach.cjs`.

The browser verification covers CRUD for all four resources, persistent reloads, CSV export, registration, sign-in/out, reminder configuration and snoozing, child/senior adaptations, cross-account isolation, and mobile navigation. Set `TEST_BASE_URL` to test another running deployment. It creates its own independent demo and test account. The authentication suite additionally checks exact and legacy passwords, isolated failed-attempt limits, remember-me cookies, recovery-key rotation, password changes, CSRF rejection, expiry, inline errors, and mobile login. Set `TEST_PREVIEW_URL` to the HTTPS preview URL to also verify login/reload/logout inside a cross-site iframe with third-party-cookie restrictions. Legacy-hash fixtures use Drizzle and only update the suite’s own generated test account.

## Important wellness limitations

These plans are general wellness examples, not medical advice, allergy-verified recipes, or individual clinical prescriptions. Children and teens are not given weight-loss calorie targets and should use the app with a caregiver. Older adults receive gentle movement suggestions. Pregnancy, eating disorders, chronic illness, fluid restrictions, and other medical concerns require qualified professional guidance.

Reminders run while the app is open, between 8 AM and 9 PM local time. Browser notifications require permission and are not background push notifications. A chime depends on browser audio policies.

## Option A update: budget-first nutrition and Nivra

This update extends the existing working Next.js/PostgreSQL application. It does not replace it with the proposed Vite/Supabase/Cloudflare stack or claim a native Android/Capacitor release. Existing database table names and session-cookie names deliberately remain unchanged so accounts and records are preserved.

### Food budgets and reference calculations

The health profile now stores a per-person daily or weekly food budget in INR, dietary preference (vegetarian, vegan, eggetarian or non-vegetarian), ingredient/allergen exclusions, training focus, experience, equipment, session duration, and an adjustable water guide. Weekly budgets are divided into seven daily caps using integer paise. Plans are generated server-side, with 4 meal slots per day and explicit recipe ingredient snapshots. Catalog-based swaps are rechecked on the server and serialized with a user-row lock.

Foods use defined raw/dry/as-sold reference states and generic USDA-based food-composition values. Reference links are shown with ingredient details. Each meal adds grams / 100 × each reference nutrient; it does not assign arbitrary macro percentages. Prices are a sample Indian retail basket, not live quotes, and exclude fuel, extra seasonings, delivery and eating out. Photos are illustrative. Local brands, yields, cooked weights and prices vary. The reference snapshot is not a clinical validation or a guarantee of nutritional completeness.

Unknown allergy notes or no feasible menu at a budget produce an explicit warning and no generated meal plan. The system does not silently shrink portions to claim affordability. Ingredient exclusions do not verify package labels or cross-contact. Existing unpriced or manual meals remain marked as unpriced/manual, not free or ingredient-verified. Manual meals can exceed a budget; the UI shows the overage rather than claiming the plan is within it.

### Nivra, the grounded guide

`/?view=coach` provides persistent, account-scoped conversation history, clear-history controls, question-specific answers, source links and profile-aware facts. Replies are built from server-fetched records, deterministic calculations and a bounded reviewed guide. Nivra explains budget menus, dietary preferences, nutrition states, workout time/equipment, basic exercise cues, hydration, dated weight summaries and its limits. It does not silently edit a profile or invent actual sets, training loads, personal bests, dated meal history, medical diagnoses or live prices.

With no provider key, the app clearly labels Nivra **₹0 local guide**; it is not pretending to run a live generative model. Optionally set `GROQ_API_KEY` and `GROQ_MODEL` (default `llama-3.1-8b-instant`) on the server. Only otherwise-unrecognized question text is sent to Groq for a validated topic classification. Saved account records are not automatically attached; question text itself can contain information you choose to type. Free-form model advice/numbers are never displayed. Provider failures fall back to the local guide with a visible explanation. Free-tier availability and limits depend on the provider. No system can guarantee error-free guidance; medical, injury and serious-allergy questions require qualified help.

### What synchronization means here

Registered account data is stored on the shared PostgreSQL backend and can be retrieved on another device using the same account. The app shows saving/offline status and a last-server-read timestamp. Eligible screens refresh on focus and about every 30 seconds; active profile/settings forms are not overwritten by background refresh. Offline writes are not queued. This is not full offline synchronization, automatic conflict merging, a native Android release, or a completed set-by-set strength journal. JSON import/export and broader migration/deployment items in the supplied roadmap remain separate work.

The budget/coach regression suite checks daily/weekly limits, dietary and allergen filtering, source calculations, impossible-budget states, manual-price transparency, server-owned swaps, account isolation, grounded chat replies, stale-context prevention, saved history, network recovery and mobile layouts. The pure planner suite covers 112 diet/budget/energy combinations and targeted coach safety cases.

Existing home-screen shortcuts may retain an old label until re-added. Open the current published app URL, remove the old shortcut if needed, and add it again to refresh the Fit Life Bro home-screen name. Existing account records are unaffected.
