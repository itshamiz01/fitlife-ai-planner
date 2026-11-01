# Existing feature verification matrix

Current source / local test review; the 20 groups refer to PRODUCT_FEATURE_INVENTORY.md. A pass on a unit or mock check is not end-to-end verification. No isolated PostgreSQL server or Playwright Chromium was available; no real user data, live provider, production or physical device was tested. See TEST_REPORT.md for exact commands. All 20 groups should be considered incomplete or not fully verified for production.

| # | Feature | Evidence available | Remaining work / test |
|---|---|---|---|
| 1 | Demo workspace | Source inspection | Sample values promoted at signup; synthetic DB integration test and explicit onboarding needed. |
| 2 | Authentication | Source inspection | Run browser/API session and account flows against isolated DB. |
| 3 | Password/recovery | Source inspection | Isolated DB auth suite and security review. |
| 4 | Health profile | Route mock and typecheck | DB transactions, onboarding, plan-changing saves and browser form testing. |
| 5 | Calorie/water guides | Planner assertions | Validate equation assumptions and suitability independently. |
| 6 | Budget plans | 112 synthetic combinations | Real DB/UI, variety and clinically reviewed nutrition. |
| 7 | Diet/allergies | Synthetic filtering and unknown-restriction tests | Test UI/DB and cross-contact warnings; no safety guarantee. |
| 8 | Meal editing/checkmarks | Source inspection | DB/browser CRUD, preservation, dated consumption history. |
| 9 | Meal swaps | Source and planner tests | Isolated DB/browser interactions and budget races. |
| 10 | Grocery export | Source inspection | Browser export and manual meal limitations. |
| 11 | Workout plans | Synthetic planner cases | UX/DB and independently reviewed guidance. |
| 12 | Workout editing/checkmarks | Source inspection | DB/browser CRUD and actual activity journaling. |
| 13 | Water logs | Source inspection | DB/browser CRUD, account isolation and timezone boundary tests. |
| 14 | Reminders | Source inspection | Foreground browser and permission tests; background not implemented. |
| 15 | Weight and progress | Synthetic progress math and chart bounds | DB/browser CRUD and chart visual/accessibility tests; this stage fixes arbitrary maintenance percentages and target chart bounds. |
| 16 | Weight CSV export | Source inspection | Browser download and spreadsheet safety checks. |
| 17 | Local coach | Synthetic rules test | DB/browser history and optional external provider; conversational OpenRouter not in Next app. |
| 18 | Responsive dashboard | Typecheck/build and lint | Actual desktop/mobile/accessibility testing. |
| 19 | PWA/offline | Simulated worker checks and icon dimensions | Browser service-worker/install and physical device tests, missing imagery/fonts. |
| 20 | JSON download | Stubbed route checks | Real DB ownership, browser download, snapshot consistency and validated import. |

18 additional areas remain at various stages, not complete; use DEVELOPMENT_ROADMAP.md and PRODUCT_FEATURE_INVENTORY.md. Test with isolated synthetic data before integration; production migration, deployment and provider replacement need explicit authorization.

Follow-up: plan replacement now archives previous rows in the same transaction and is tested on synthetic PGlite data, including rollback and another user's records. This does not fully validate live PostgreSQL concurrency, HTTP authorization, browser behavior or restore. The archive migration has not been applied to any production database; in-app restore is still missing.

Additional feature progress: an initial manual activity journal is implemented and tested against embedded PostgreSQL with mocked identity/origin. It is not an automatic step counter, does not edit or aggregate records, and needs migration and real-session/browser tests. Other recommended areas remain incomplete.

Additional feature progress: a manual sleep journal now supports create/list/delete and export, with embedded PostgreSQL tests using mocked authentication. No automatic sleep detection, sleep analytics, edit, real-session/browser verification or production migration has been completed.

Plan restore has since been implemented and tested with synthetic embedded PostgreSQL and mock authentication/origin. Cross-account denial, profile compatibility, preserved checkmarks and repeat restore were exercised. Browser, real sessions, concurrency and production migration remain unverified.

Additional feature progress: food, exercise and measurement journals now offer dated manual CRUD and export; PGlite synthetic tests cover validation and owner isolation with mocked identity. Analytics, photos, real sessions, production migration and browser/device testing remain open.
