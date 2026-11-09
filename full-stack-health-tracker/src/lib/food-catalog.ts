import { expandedFoods, expandedRecipes } from "./recipe-expansion";
import type { Profile, MealIngredient } from "./types";

export const FOOD_REFERENCE = "https://www.fitcalcs.app/charts/macros-by-food";
export const USDA_REFERENCE = "https://fdc.nal.usda.gov/";
export const PRICE_NOTE = "Sample Indian retail ingredient prices, not live market quotes. Local prices, edible yield, brands, spices and cooking fuel vary. Costs exclude fuel, delivery and eating out.";
export type Food = { id: string; name: string; state: string; kcal: number; protein: number; carbs: number; fat: number; price: number; allergens: string[]; kind: "plant" | "dairy" | "egg" | "meat"; sourceUrl: string; aliases: string[] };
const f = (id: string, name: string, state: string, kcal: number, protein: number, carbs: number, fat: number, price: number, allergens: string[] = [], kind: Food["kind"] = "plant", aliases: string[] = [], sourceUrl = FOOD_REFERENCE): Food => ({ id, name, state, kcal, protein, carbs, fat, price, allergens, kind, aliases: [id, name.toLowerCase(), ...aliases], sourceUrl });
// Per 100 g edible portion. Grain/pulse values are DRY, not cooked.
// Curated USDA SR Legacy reference values; generic averages, not local-brand lab results.
// Prices are paise per 100 g, intentionally independent of nutrition references.
export const foods: Food[] = [
  f("rice", "White rice", "dry, before cooking", 365, 7.1, 80, .7, 650),
  f("lentils", "Lentils / dal", "dry, before cooking", 352, 24.6, 63.4, 1.1, 1200, [], "plant", ["dal", "lentil", "moong", "masoor"]),
  f("chana", "Chickpeas / chana", "dry, before soaking and cooking", 378, 20.5, 63, 6, 1000, ["chana"], "plant", ["chickpea", "chickpeas", "bengal gram", "chana"]),
  f("atta", "Whole-wheat atta", "dry flour", 340, 13.2, 72, 2.5, 500, ["gluten"], "plant", ["wheat", "roti", "chapati", "flour"], "https://www.nutritionvalue.org/Wheat_flour%2C_whole-grain_nutritional_value.html"),
  f("oats", "Rolled oats", "dry", 379, 13.2, 67.7, 6.5, 1600, ["gluten"], "plant", ["oat", "oatmeal"]),
  f("potato", "Potato", "raw edible portion", 77, 2, 17.5, .1, 300, [], "plant", ["potatoes", "aloo"]),
  f("carrot", "Carrot", "raw edible portion", 41, .9, 9.6, .2, 400, [], "plant", ["carrots"], "https://fdc.nal.usda.gov/fdc-app.html#/food-details/170393/nutrients"),
  f("spinach", "Spinach", "raw edible portion", 23, 2.9, 3.6, .4, 400, [], "plant", ["palak"], "https://fdc.nal.usda.gov/fdc-app.html#/food-details/168462/nutrients"),
  f("cabbage", "Cabbage", "raw edible portion", 25, 1.3, 5.8, .1, 350, [], "plant", [], USDA_REFERENCE),
  f("banana", "Banana", "raw, peeled edible portion", 89, 1.1, 22.8, .3, 600, [], "plant", ["bananas"], "https://fdc.nal.usda.gov/fdc-app.html#/food-details/173944/nutrients"),
  f("apple", "Apple", "raw edible portion with skin", 52, .3, 13.8, .2, 1800, [], "plant", ["apples"]),
  f("papaya", "Papaya", "raw edible portion", 43, .5, 10.8, .3, 500, [], "plant", [], USDA_REFERENCE),
  f("peanuts", "Peanuts", "raw edible portion; roast before serving", 567, 25.8, 16.1, 49.2, 1400, ["peanuts"], "plant", ["peanut", "groundnut", "groundnuts"], USDA_REFERENCE),
  f("milk", "Whole milk", "fluid, as sold; grams", 61, 3.1, 4.8, 3.3, 650, ["milk"], "dairy", ["dairy", "lactose"]),
  f("egg", "Whole egg", "raw edible weight without shell; cook fully", 143, 12.6, .7, 9.5, 1400, ["eggs"], "egg", ["eggs"], "https://fdc.nal.usda.gov/fdc-app.html#/food-details/171287/nutrients"),
  f("chicken", "Skinless chicken breast", "raw edible portion; cook fully", 120, 22.5, 0, 2.6, 2800, [], "meat", ["poultry"]),
  f("oil", "Sunflower oil", "as sold; grams", 884, 0, 0, 100, 2000, [], "plant", ["sunflower"], USDA_REFERENCE),
  ...expandedFoods,
];
export const foodById: Record<string, Food> = Object.fromEntries(foods.map(food => [food.id, food]));
export type Recipe = { id: string; name: string; types: string[]; ingredients: [string, number][]; instructions: string; image: string; tag: string; details?: { description: string; preparationMinutes: number | null; cookingMinutes: number | null; servings: number; categories: string[]; steps: string[]; equipment: string; storage: string; seasoning: string } };
// Preserve the original instructions verbatim while presenting their sentences as steps.
// Historical cooking times were not recorded; do not fabricate them.
const r = (id: string, name: string, types: string[], ingredients: Recipe["ingredients"], instructions: string, image: string, tag = "Everyday ingredients"): Recipe => ({
  id, name, types, ingredients, instructions, image, tag,
  details: {
    description: `Original catalog recipe: ${name}.`, preparationMinutes: null, cookingMinutes: null, servings: 1,
    categories: [], steps: instructions.match(/[^.!?]+(?:[.!?]+|$)/g)?.map(step => step.trim()).filter(Boolean) || [instructions],
    equipment: "Basic cooking utensils; exact equipment was not recorded.",
    storage: "Refrigerate leftovers promptly and reheat thoroughly; follow applicable food-safety guidance.",
    seasoning: "Check all ingredients, labels and cross-contact. Water and any unlisted seasonings are not included in estimates.",
  },
});
export const recipes: Recipe[] = [
  r("rice-dal-breakfast", "Soft rice & dal breakfast", ["Breakfast"], [["rice",60],["lentils",40],["carrot",70],["oil",5]], "Rinse rice and dal, then simmer with carrot and enough water until completely soft. Add the measured oil. Grain and pulse weights are dry before cooking; check labels and cross-contact if avoiding gluten.", "/images/dal-rice.jpg", "Simple pantry staples"),
  r("dal-chilla", "Dal chilla & seasonal sabzi", ["Breakfast"], [["lentils",65],["atta",30],["carrot",70],["oil",5]], "Soak the lentils, blend with water and flour, and cook small chillas thoroughly. Lightly sauté the carrot with the measured oil. Water and a pinch of salt are not costed.", "/images/roti-dal.jpg", "Protein from pulses"),
  r("chana-roti-breakfast", "Chana roti breakfast", ["Breakfast"], [["chana",60],["atta",40],["cabbage",70],["oil",5]], "Soak and boil chickpeas until soft. Make chapatis from atta and water. Serve with lightly cooked cabbage and the measured oil.", "/images/roti-dal.jpg", "Budget staple"),
  r("banana-oats", "Banana & peanut oats", ["Breakfast"], [["oats",70],["banana",100],["peanuts",10]], "Cook oats with water, add sliced banana and crushed roasted peanuts. No milk or sweetener is included. Oats are excluded for gluten-related allergies unless a suitable certified product is chosen with professional guidance.", "/images/banana-oats.jpg"),
  r("milk-oats", "Warm banana milk porridge", ["Breakfast"], [["oats",55],["milk",160],["banana",100]], "Simmer oats in milk and water as needed. Top with banana. No added sugar is included.", "/images/banana-oats.jpg"),
  r("egg-roti", "Egg & potato roti plate", ["Breakfast","Dinner"], [["egg",100],["atta",60],["potato",100],["spinach",80],["oil",5]], "Cook the eggs fully; 50 g raw edible egg is approximately one large egg. Make chapatis and serve with cooked potato and spinach, using the measured oil.", "/images/roti-dal.jpg", "Eggetarian option"),
  r("khichdi", "Dal & carrot khichdi", ["Lunch","Dinner"], [["lentils",50],["rice",90],["carrot",80],["oil",5]], "Rinse rice and lentils. Simmer together with carrot and enough water until fully soft. Finish with the measured oil. Quantities of rice and dal are dry weights.", "/images/dal-rice.jpg", "Comfort on a budget"),
  r("chana-rice", "Chana rice & seasonal greens", ["Lunch","Dinner"], [["chana",70],["rice",80],["spinach",100],["oil",5]], "Soak chickpeas overnight and boil thoroughly until tender. Cook rice separately. Add cooked spinach and measured oil; season to taste.", "/images/chana.jpg", "Plant-powered protein"),
  r("dal-rice", "Everyday dal, rice & sabzi", ["Lunch","Dinner"], [["lentils",65],["rice",85],["cabbage",100],["oil",5]], "Cook dal until soft, steam the rice and sauté cabbage with the measured oil. These ingredient weights are before cooking; cooked portions will weigh more because of water.", "/images/dal-rice.jpg", "Simple & nourishing"),
  r("chana-roti", "Chana, roti & cabbage sabzi", ["Lunch","Dinner"], [["chana",70],["atta",90],["cabbage",100],["oil",5]], "Soak chickpeas and boil until fully tender. Make chapatis from atta and water, and serve with cooked cabbage. Use only the listed amount of oil.", "/images/roti-dal.jpg", "Budget staple"),
  r("palak-dal", "Palak dal & whole-wheat roti", ["Lunch","Dinner"], [["lentils",70],["atta",80],["spinach",100],["oil",5]], "Simmer dal thoroughly, fold in spinach, and serve with chapatis. Measure oil rather than pouring freely.", "/images/roti-dal.jpg", "Seasonal greens"),
  r("chicken-rice", "Home-style chicken rice bowl", ["Lunch","Dinner"], [["chicken",150],["rice",90],["carrot",80],["spinach",60],["oil",8]], "Cook chicken completely, using a food thermometer where available (74°C in the thickest part). Serve with cooked rice, carrot and spinach. Do not reuse utensils that touched raw chicken.", "/images/chicken-bowl.jpg", "Non-vegetarian option"),
  r("egg-dal-rice", "Egg, dal & rice bowl", ["Lunch","Dinner"], [["egg",100],["lentils",45],["rice",65],["carrot",80],["oil",5]], "Boil the eggs fully. Cook dal and rice separately and serve with softened carrot. All quantities refer to raw/dry edible ingredients.", "/images/dal-rice.jpg", "Egg-based protein"),
  r("chana-chaat", "Simple boiled chana chaat", ["Snack"], [["chana",50],["carrot",50],["oil",3]], "Soak and boil the chickpeas fully before eating. Mix with grated carrot and the measured oil. Dry chickpeas must not be eaten raw.", "/images/chana.jpg", "Pocket-friendly snack"),
  r("banana-peanuts", "Banana & roasted peanuts", ["Snack"], [["banana",100],["peanuts",25]], "Serve peeled banana with roasted peanuts. Adapt texture for children; whole nuts can be a choking hazard.", "/images/banana-oats.jpg", "No fancy fruit needed"),
  r("chana-papaya", "Chana & seasonal papaya", ["Snack"], [["chana",40],["papaya",150]], "Soak and thoroughly boil chickpeas, then serve alongside peeled papaya. Choose ripe, locally available fruit.", "/images/chana.jpg", "Seasonal fruit"),
  r("milk-banana", "Milk & banana break", ["Snack"], [["milk",200],["banana",100]], "Serve banana with pasteurized milk. This contains dairy and is not suitable for a milk allergy.", "/images/banana-oats.jpg"),
  r("egg-banana", "Boiled eggs & banana", ["Snack"], [["egg",100],["banana",100]], "Boil eggs until fully cooked. Serve with peeled banana. Two large eggs are roughly 100 g raw edible egg before cooking.", "/images/banana-oats.jpg", "Eggetarian option"),
  ...expandedRecipes,
];
// Individual foods are browsable references, not automatic plan candidates: a single
// fruit or egg portion should not silently replace a balanced generated meal.
export const individualFoods: Recipe[] = [
  r("boiled-eggs", "Boiled eggs", ["Snack"], [["egg",100]], "Boil eggs until both yolks and whites are firm. One reference serving uses about 100 g raw edible egg, approximately two large eggs; actual weights vary.", "", "Individual food"),
  r("banana-fruit", "Banana", ["Snack"], [["banana",100]], "Peel the banana and serve. The reference quantity is 100 g edible portion; actual fruit sizes vary.", "", "Individual food"),
  r("papaya-fruit", "Papaya", ["Snack"], [["papaya",150]], "Wash, peel and remove seeds from ripe papaya before serving. The reference quantity is 150 g edible portion.", "", "Individual food"),
];
export const libraryRecipes = [...recipes, ...individualFoods];

const allergyAliases: Record<string, string[]> = {
  milk: ["milk", "dairy", "lactose"], eggs: ["egg", "eggs"], gluten: ["gluten", "wheat", "celiac", "coeliac"],
  peanuts: ["peanut", "peanuts", "groundnut", "groundnuts"], "tree-nuts": ["tree nuts", "almond", "almonds", "cashew", "cashews", "walnut", "walnuts"],
  chana: ["kala chana", "chickpea flour", "gram flour", "bengal gram", "chickpeas", "chickpea", "chana", "besan"], soy: ["soy", "soya"], mustard: ["mustard", "rai"], sesame: ["sesame", "til"], fish: ["fish"], shellfish: ["shellfish", "shell fish", "shrimp", "prawn", "prawns"],
};
export function parseAllergies(input: string) {
  const raw = input.toLowerCase().trim();
  if (!raw || /^(none|no allergies|nil|n\/a)$/.test(raw)) return { excluded: [] as string[], unknown: [] as string[] };
  const excluded = new Set<string>();
  const unknown: string[] = [];
  for (const original of raw.split(/[,;\n]+/)) {
    let remainder = original.trim();
    if (!remainder) continue;
    if (/\bnuts\b/.test(remainder) && !remainder.includes("tree nuts")) { excluded.add("peanuts"); excluded.add("tree-nuts"); remainder = remainder.replace(/\bnuts\b/g, " "); }
    const groups = [...Object.entries(allergyAliases), ...foods.map(food => [food.id, food.aliases] as [string, string[]])];
    for (const [key, aliases] of groups) for (const alias of [...aliases].sort((a,b) => b.length - a.length)) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`\\b${escaped}\\b`, "g");
      if (pattern.test(remainder)) { excluded.add(key); remainder = remainder.replace(new RegExp(`\\b${escaped}\\b`, "g"), " "); }
    }
    remainder = remainder.replace(/\b(and|or|allergy|allergies|allergic|to|intolerance|intolerant|avoid|free|sensitive|sensitivity)\b/g, " ").replace(/[^a-z0-9]/g, "").trim();
    if (remainder) unknown.push(original.trim());
  }
  return { excluded: [...excluded], unknown };
}
export function compatibleRecipe(recipe: Recipe, profile: Pick<Profile,"diet"|"allergies">) {
  const allergy = parseAllergies(profile.allergies);
  if (allergy.unknown.length) return false;
  return recipe.ingredients.every(([id]) => {
    const food = foodById[id];
    if (allergy.excluded.includes(id) || food.allergens.some(allergen => allergy.excluded.includes(allergen))) return false;
    if (profile.diet === "vegan" && food.kind !== "plant") return false;
    if (profile.diet === "vegetarian" && (food.kind === "egg" || food.kind === "meat")) return false;
    if (profile.diet === "eggetarian" && food.kind === "meat") return false;
    return true;
  });
}
export function recipeNutrition(recipe: Recipe, targetCalories: number) {
  const base = recipe.ingredients.reduce((sum,[id,g]) => sum + foodById[id].kcal * g / 100, 0);
  const scale = targetCalories / base;
  const ingredients: MealIngredient[] = recipe.ingredients.map(([id, amount]) => {
    const food = foodById[id];
    const grams = id === "egg" ? Math.max(50, Math.round(amount * scale / 50) * 50) : Math.max(1, Math.round(amount * scale));
    const round = (value: number) => Math.round(value * 10) / 10;
    return { foodId: id, name: food.name, grams, state: food.state, costPaise: Math.round(food.price * grams / 100), unitPricePaisePer100g: food.price, kcal: round(food.kcal * grams / 100), protein: round(food.protein * grams / 100), carbs: round(food.carbs * grams / 100), fat: round(food.fat * grams / 100), allergens: [...food.allergens], sourceUrl: food.sourceUrl };
  });
  const sum = (key: "kcal"|"protein"|"carbs"|"fat") => Math.round(ingredients.reduce((total,food) => total + food[key], 0));
  return { ingredients, calories: sum("kcal"), protein: sum("protein"), carbs: sum("carbs"), fat: sum("fat"), costPaise: ingredients.reduce((sum,food) => sum + food.costPaise, 0) };
}
