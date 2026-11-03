import { foodById, type Recipe } from "./food-catalog";
import type { MealIngredient } from "./types";

/** Scale actual ingredient snapshots, not recipe labels. Prices are indicative. */
export function scaleIngredients(ingredients: MealIngredient[], servings: number) {
  if (!Number.isInteger(servings) || servings < 1 || servings > 4) throw new RangeError("Choose 1–4 servings.");
  const scaled = ingredients.map(item => ({ ...item, grams: Math.round(item.grams * servings * 100) / 100, costPaise: item.costPaise * servings, kcal: item.kcal * servings, protein: item.protein * servings, carbs: item.carbs * servings, fat: item.fat * servings }));
  const sum = (key: "kcal" | "protein" | "carbs" | "fat") => Math.round(scaled.reduce((total, item) => total + item[key], 0) * 10) / 10;
  return { ingredients: scaled, calories: sum("kcal"), protein: sum("protein"), carbs: sum("carbs"), fat: sum("fat"), costPaise: scaled.reduce((total,item) => total + item.costPaise,0) };
}
export function baseRecipeIngredients(recipe: Recipe): MealIngredient[] {
  return recipe.ingredients.map(([id,grams]) => {
    const food = foodById[id];
    if (!food) throw new Error(`Unknown ingredient: ${id}`);
    const round = (value: number) => Math.round(value * 100) / 100;
    return { foodId:id, name:food.name, grams, state:food.state, costPaise:Math.round(food.price * grams / 100), unitPricePaisePer100g:food.price, kcal:round(food.kcal * grams / 100), protein:round(food.protein * grams / 100), carbs:round(food.carbs * grams / 100), fat:round(food.fat * grams / 100), allergens:[...food.allergens], sourceUrl:food.sourceUrl };
  });
}
export function dietaryClass(recipe: Recipe) {
  const kinds = recipe.ingredients.map(([id]) => foodById[id].kind);
  return kinds.includes("meat") ? "Non-vegetarian" : kinds.includes("egg") ? "Eggetarian" : kinds.includes("dairy") ? "Vegetarian" : "Vegan";
}

/** Stable comparison of saved values, independent of JSON object key order. */
export function servingSnapshotKey(ingredients: MealIngredient[]) {
  return JSON.stringify(ingredients.map(item => [item.foodId, item.state, item.grams, item.costPaise, item.kcal, item.protein, item.carbs, item.fat, item.servingCount ?? 1, item.servingBase ? [item.servingBase.grams, item.servingBase.costPaise, item.servingBase.kcal, item.servingBase.protein, item.servingBase.carbs, item.servingBase.fat] : null]));
}
/** Keep the first saved portion as baseline so subsequent changes are reversible. */
export function savedServingBase(ingredients: MealIngredient[]) {
  return ingredients.map(({ servingBase, servingCount: _count, ...item }) => ({ ...item, ...(servingBase ?? {}) }));
}
export function scaleSavedServing(ingredients: MealIngredient[], servings: number) {
  const base = savedServingBase(ingredients);
  const result = scaleIngredients(base, servings);
  return { ...result, ingredients: result.ingredients.map((item, index) => ({ ...item, servingCount: servings, servingBase: { grams: base[index].grams, costPaise: base[index].costPaise, kcal: base[index].kcal, protein: base[index].protein, carbs: base[index].carbs, fat: base[index].fat } })) };
}
