import { foodById } from "./food-catalog";
import type { MealIngredient } from "./types";
import { savedServingBase, scaleSavedServing } from "./recipe-serving";

// Same raw/edible-weight family only. Not culinary or nutritional equivalence.
const alternatives: Record<string, string[]> = {
  carrot: ["capsicum"], capsicum: ["carrot"],
  spinach: ["cabbage"], cabbage: ["spinach"],
  banana: ["papaya"], papaya: ["banana"],
};
export function substitutionOptions(ingredients: MealIngredient[], index: number) {
  const item = ingredients[index];
  if (!item) return [];
  return (alternatives[item.foodId] ?? []).filter(id => foodById[id] && !ingredients.some(other => other.foodId === id));
}
/** Use new food's reference values at the same raw edible weight, never old nutrient values. */
export function substituteIngredient(ingredients: MealIngredient[], index: number, foodId: string) {
  if (!substitutionOptions(ingredients, index).includes(foodId)) throw new RangeError("Substitution unavailable.");
  const count = ingredients[index].servingCount ?? 1;
  if (!Number.isInteger(count) || count < 1 || count > 4 || ingredients.some(item => (item.servingCount ?? 1) !== count)) throw new RangeError("Inconsistent serving snapshot.");
  const base = savedServingBase(ingredients);
  const food = foodById[foodId];
  const grams = base[index].grams;
  const round = (v: number) => Math.round(v * 100) / 100;
  base[index] = { foodId: food.id, name: food.name, state: food.state, grams, unitPricePaisePer100g: food.price, costPaise: Math.round(food.price * grams / 100), kcal: round(food.kcal * grams / 100), protein: round(food.protein * grams / 100), carbs: round(food.carbs * grams / 100), fat: round(food.fat * grams / 100), allergens: [...food.allergens], sourceUrl: food.sourceUrl };
  return scaleSavedServing(base, count);
}
