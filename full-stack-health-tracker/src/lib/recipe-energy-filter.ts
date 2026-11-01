import type { Recipe } from "./food-catalog";
import type { Profile } from "./types";
import { baseRecipeIngredients, scaleIngredients } from "./recipe-serving";

/** Comparison only, not a weight-change prediction or recommendation. */
export function recipeEnergyComparison(recipe: Recipe, profile: Pick<Profile, "age" | "calorieTarget">) {
  if (profile.age < 18 || !Number.isFinite(profile.calorieTarget) || profile.calorieTarget <= 0) return null;
  // The first catalog meal type is the reference; multiple-slot recipes may differ at other meals.
  const share: Record<string, number> = { Breakfast: .24, Lunch: .30, Dinner: .34, Snack: .12 };
  const reference = profile.calorieTarget * (share[recipe.types[0]] ?? .12);
  const calories = scaleIngredients(baseRecipeIngredients(recipe), 1).calories;
  return calories < reference * .8 ? "lower" : calories > reference * 1.2 ? "higher" : "similar";
}
