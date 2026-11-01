# Product feature inventory and improvement opportunities

Assessment: 2026-11-01, Next.js app in this checkout, not the independent root Vite app or unverified Floot project. A "feature" here is a user-facing capability grouped at product level, not a count of buttons, API routes, or complete features. This is a planning inventory rather than a claim that each feature works end-to-end. Cross-account PostgreSQL, browser and device tests remain outstanding. Some features share components; another grouping would yield a different total.

## 20 existing feature groups

| # | Feature group | Current status / limits |
|---|---|---|
| 1 | Demo workspace | Implemented; contains synthetic history that carries through signup. |
| 2 | Sign-up, sign-in and sign-out | Implemented; current DB/browser execution unverified. |
| 3 | Password and recovery-key security | Implemented; DB/browser and security validation outstanding. |
| 4 | Health profile and goals | Basic profile; detailed medical/injury data and onboarding incomplete. |
| 5 | Calorie and water guides | Estimates only; formulas and suitability need independent review. |
| 6 | Budget-aware weekly meal plans | Deterministic, limited catalog, no protein optimization; estimates. |
| 7 | Diet and allergy filtering | Catalog-level only; unknown restrictions fail closed; no cross-contact guarantee. |
| 8 | Meal plan editing and checkmarks | Custom entries, changes and completion markers; not a dated consumption journal. |
| 9 | Meal alternatives | Catalog swaps and budget checks; unpriced meals limit certainty. |
| 10 | Grocery list | Ingredient-based text export for catalog meals; excludes manual items. |
| 11 | Workout plans | Profile-based templates, limited personalization; not actual exercise history. |
| 12 | Workout editing and checkmarks | Custom entries and completion markers; not recorded sets or actual minutes. |
| 13 | Water tracking | Dated manual logs; DB/browser test pending. |
| 14 | Water reminders | Foreground timers; no reliable background alerts. |
| 15 | Weight check-ins and progress | Dated logs and charts; maintenance display and goal chart need correction. |
| 16 | Weight CSV export | Narrow export of weight records, not complete backup. |
| 17 | Local coach and optional intent routing | Local source-grounded rules with optional Groq topic classification; not OpenRouter chat. |
| 18 | Responsive navigation and dashboard | Implemented in code; accessibility and device testing needed. |
| 19 | PWA installation and offline page | Placeholder icons added; simulated shell test passes; actual installation unverified, no offline health sync. |
| 20 | JSON account-data download | Added to settings; mock tested, not browser/DB verified; no import or consistent snapshot. |

## 18 recommended capability areas, prioritized

| Priority | Opportunity | Why it matters |
|---|---|---|
| P0 | Preserve plan versions and custom entries | Regeneration and plan-changing profile saves currently remove existing rows. Prevent irreversible data loss; additive schema and tested restore design. |
| P0 | Honest onboarding and demo separation | Sample demographics/history should never silently become real health data; preserve unknown legacy records, ask user how to proceed. |
| P0 | Security, privacy and independent isolation tests | Sensitive health data needs tested access control, abuse protection, session/CSRF review, minimal collection and clear retention. |
| P0 | Reliable operations and recovery | Reproducible dependencies, vulnerability review, isolated DB integration tests, backups and tested restore precede public use. |
| P1 | Dated food diary and nutrient totals | Separate proposed meals from what was actually consumed, including quantity, uncertainty and source. |
| P1 | Better affordable Indian nutrition | Expand regionally relevant, reviewed recipes, user price inputs and monthly budgets; distinguish estimates from live prices. |
| P1 | Safer dietary personalization | Explicit restrictions, cross-contact warnings, feasible protein/macro guidance and clinician-reviewed safeguards help avoid unsafe claims. |
| P1 | Real workout journal and progression | Actual sets, repetitions, load, effort and recovery support progress rather than treating a planned session as completed work. |
| P1 | Injury, accessibility and exercise modifications | Adapt safely to mobility and equipment; offer low-impact alternatives without diagnosing or prescribing rehabilitation. |
| P1 | Manual activity and walking records | Provide useful measured/manual steps, distance and duration now, with source and no invented readings. |
| P1 | Sleep and recovery journal | Track self-reported sleep and subjective recovery with time-zone aware overnight records; no medical diagnosis. |
| P1 | Body measurements and meaningful progress | Optional measurements, well-defined goal calculations and missing-data-aware trends add context beyond weight. |
| P1 | Account deletion and portable import | Give users control of personal data; deletion confirmation, backup, audit and validated conflict-safe import need careful design. |
| P2 | OpenRouter conversational coach | With authorization and consent, add server-side provider integration, spending controls, grounded context, safety checks and honest unavailable states; preserve existing provider until approved. |
| P2 | Android / Health Connect integration | Permission-based native integration can provide actual sensor data; requires architecture review, physical-device tests and manual fallback. PWA is not proof of background tracking. |
| P2 | Reliable reminders and offline workflows | Native/background reminders and conflict-safe offline writes need platform support, consent and privacy-safe sync; existing foreground timers are limited. |
| P2 | Accessibility and localization | Screen readers, keyboard, contrast, reduced motion and Indian-language support broaden usability; validate with real users. |
| P2 | Personalized insights and practical engagement | Show explainable, source-labelled trends and optional goals/check-ins, without fabricated streaks, shame, excessive notifications or medical claims. |

World-class quality also requires independent clinical/nutrition review, real user research across budgets and accessibility needs, resilience/performance monitoring without exposing health data, legal review and a verified production deployment. More features alone cannot establish a "world best" claim.
