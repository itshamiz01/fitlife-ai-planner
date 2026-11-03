import { recipes } from "./food-catalog";
import type { MealIngredient } from "./types";

// Only reviewed illustrations are listed here. Do not substitute unrelated food photos.
export const NO_MEAL_IMAGE = "/images/meal-image-unavailable.svg";
export const mealImages: Record<string, string> = Object.fromEntries([
  "rice-dal-breakfast", "dal-chilla", "chana-roti-breakfast", "banana-oats", "milk-oats",
  "egg-roti", "khichdi", "chana-rice", "dal-rice", "chana-roti",
  "palak-dal", "chicken-rice", "egg-dal-rice", "chana-chaat", "banana-peanuts",
  "chana-papaya", "milk-banana", "egg-banana", "rajma-rice", "egg-curry-rice",
  "besan-paneer-chilla", "vegetable-peanut-poha", "vegetable-suji-upma", "pessarattu", "egg-bhurji-toast",
  "vegetable-dalia", "kala-chana-roti", "soya-masala-rice", "paneer-bhurji-roti", "fish-curry-rice",
  "millet-moong-khichdi", "chicken-stir-fry-roti", "moong-sprout-chaat", "curd-vegetable-sandwich", "masala-makhana",
  "sweet-potato-chaat", "pan-paneer-tikka", "vegetable-frankie", "chicken-vegetable-soup", "egg-vegetable-roll",
  "banana-peanut-toast", "banana-date-smoothie", "potato-workout-chaat", "curd-banana-oats",
  "paneer-recovery-bowl", "egg-toast-recovery", "boiled-eggs", "banana-fruit",
  "soya-protein-salad", "chicken-rice-recovery", "papaya-fruit",
].map(id => [id, `/images/meals/${id}.webp`]));

export function recipeImage(recipeId: string | null): string {
  return recipeId ? mealImages[recipeId] ?? NO_MEAL_IMAGE : NO_MEAL_IMAGE;
}

// Saved meals can have substitutions or be manually edited. Show a recipe image only
// when its name and full ingredient IDs still match the catalog, never by legacy path.
export function savedMealImage(meal: { recipeId: string | null; name: string; ingredients: Pick<MealIngredient, "foodId">[] }): string {
  const recipe = recipes.find(item => item.id === meal.recipeId);
  if (!recipe || meal.name !== recipe.name || !meal.ingredients.length) return NO_MEAL_IMAGE;
  const saved = meal.ingredients.map(item => item.foodId).sort();
  const expected = recipe.ingredients.map(([id]) => id).sort();
  return saved.length === expected.length && saved.every((id, index) => id === expected[index]) ? recipeImage(recipe.id) : NO_MEAL_IMAGE;
}
