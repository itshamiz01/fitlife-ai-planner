import type { Meal, MealIngredient } from "./types";

/** Keep saved preparation states separate, even if an older snapshot reused a food ID. */
export function groceryItemKey(item: Pick<MealIngredient, "foodId" | "state">) {
  return JSON.stringify([item.foodId, item.state]);
}

/** Aggregate only saved ingredients; costs remain the sum of their saved snapshots. */
export function aggregateGroceries(meals: Pick<Meal, "day" | "ingredients">[], day: number | null, people: number) {
  if (!Number.isInteger(people) || people < 1 || people > 4) throw new RangeError("Choose 1–4 people.");
  const result = new Map<string, MealIngredient>();
  meals.filter(meal => day === null || meal.day === day).forEach(meal => meal.ingredients.forEach(item => {
    const key = groceryItemKey(item);
    const existing = result.get(key);
    result.set(key, existing ? { ...existing, grams: existing.grams + item.grams * people, costPaise: existing.costPaise + item.costPaise * people } : { ...item, grams: item.grams * people, costPaise: item.costPaise * people });
  }));
  return [...result.values()].sort((a,b) => a.name.localeCompare(b.name) || a.state.localeCompare(b.state));
}

const categories = {
  "Grains & bread": ["rice", "cooked-rice", "atta", "oats", "poha", "suji", "bread", "dalia", "millet"],
  "Pulses & soy": ["lentils", "chana", "besan", "moong", "moong-dal", "rajma-cooked", "kala-chana-cooked", "soy-chunks", "sprouts"],
  "Fruit & vegetables": ["potato", "carrot", "spinach", "cabbage", "banana", "apple", "papaya", "onion", "tomato", "peas", "ginger", "capsicum", "cucumber", "sweet-potato", "dates", "garlic"],
  "Dairy & eggs": ["milk", "paneer", "curd", "egg"],
  "Meat & fish": ["chicken", "fish"],
  "Pantry & seasonings": ["peanuts", "peanut-butter", "oil", "makhana", "mustard-seeds"],
} as const;

/** Unknown historical/custom IDs are retained under Other, never discarded. */
export function groupGroceries(items: MealIngredient[]) {
  const groups = new Map<string, MealIngredient[]>();
  for (const label of [...Object.keys(categories), "Other"]) groups.set(label, []);
  for (const item of items) {
    const category = Object.entries(categories).find(([, ids]) => (ids as readonly string[]).includes(item.foodId))?.[0] ?? "Other";
    groups.get(category)!.push(item);
  }
  return [...groups].filter(([, values]) => values.length > 0).map(([label, values]) => ({ label, items: values }));
}
