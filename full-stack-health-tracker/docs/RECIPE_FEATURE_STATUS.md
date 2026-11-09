# Recipe feature status

| Capability | Status | Qualification |
| --- | --- | --- |
| Catalog expansion | Implemented | 18 original IDs retained, 30 added; saved snapshots not rewritten. |
| Recipe instructions | Partial | New 30 have structured details; original 18 existing instruction sentences are shown as steps, with unknown times and no new recipe validation. |
| Search and filters | Partial | Name, category, diet, recipe price, protein, time and adult energy comparison to the first meal-slot estimate; the latter is not a weight-change prediction or goal prescription. Unknown original-recipe times are excluded when a time limit is selected. |
| Planner and budget | Implemented with limits | Existing four-slot planning, compatible recipes, estimated weekly budget caps and diversity scoring. Actual price and feasibility are not guaranteed. Optional manually created pre/post-workout slots can use tagged budget-checked swaps; not automatically scheduled. |
| Dietary/allergy filtering | Implemented with limits | Ingredient and recognized alias checks, unknown restrictions fail closed; no cross-contact guarantee. Check labels, optional seasonings and individual tolerances. |
| Nutrition and price | Provisional | Estimates by ingredient/state, not individually source-verified or live-priced. Fiber unavailable; unquantified seasonings excluded. |
| Servings | Implemented with limits | Save 1–4 multiples of an ingredient-based saved meal with baseline snapshots, stale edit, allergy and estimated budget checks. Library and grocery controls remain previews; adjust quantities in instructions manually. |
| Groceries | Partial | Day/week and 1–4 people preview and grouped download. Account-scoped purchase marks persist for the most recently edited list after migration 0005; concurrent tabs are last-write-wins. Manual entries may lack ingredients. |
| Substitutions | Partial | Three reversible pairs at the same raw edible weight; server checks diet, allergies and estimated budget. Instructions need user adaptation; alternatives are not nutritionally equivalent. |
| Images | Partial | Generated hero and three dish-specific illustrations; generic fallback for most recipes rather than individual photography. |
| Verification | Partial | Synthetic and build tests passed; no real browser, live PostgreSQL, clinical or market validation. |
