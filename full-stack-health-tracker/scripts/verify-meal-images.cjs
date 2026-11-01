const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const cache = new Map();
function load(name) {
  const file = path.resolve(name);
  if (cache.has(file)) return cache.get(file).exports;
  const loaded = { exports: {} }; cache.set(file, loaded);
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  new Function('require', 'module', 'exports', js)(x => x.startsWith('.') ? load(path.resolve(path.dirname(file), x) + '.ts') : require(x), loaded, loaded.exports);
  return loaded.exports;
}
const { recipes, individualFoods, libraryRecipes, compatibleRecipe } = load('src/lib/food-catalog.ts');
const { recipeImage, savedMealImage, mealImages, NO_MEAL_IMAGE } = load('src/lib/illustrative-image.ts');
assert.equal(recipes.length, 48);
assert.equal(libraryRecipes.length, 51);
assert.equal(new Set(libraryRecipes.map(r => r.id)).size, 51);
for (const [id, image] of Object.entries(mealImages)) {
  assert.ok(libraryRecipes.some(r => r.id === id), id);
  assert.ok(fs.existsSync(path.join('public', image)), image);
}
assert.ok(fs.existsSync(path.join('public', NO_MEAL_IMAGE)));
for (const recipe of recipes) {
  const meal = { recipeId: recipe.id, name: recipe.name, ingredients: recipe.ingredients.map(([foodId]) => ({ foodId })) };
  assert.equal(savedMealImage(meal), recipeImage(recipe.id));
  assert.equal(savedMealImage({...meal, name: 'Custom meal'}), NO_MEAL_IMAGE);
  assert.equal(savedMealImage({...meal, ingredients: [...meal.ingredients, {foodId:'unknown'}]}), NO_MEAL_IMAGE);
  assert.equal(savedMealImage({...meal, ingredients: []}), NO_MEAL_IMAGE);
}
assert.equal(savedMealImage({recipeId:null,name:'Egg curry',ingredients:[]}), NO_MEAL_IMAGE);
assert.notEqual(recipeImage('egg-curry-rice'), NO_MEAL_IMAGE);
assert.notEqual(recipeImage('rajma-rice'), NO_MEAL_IMAGE);
assert.notEqual(recipeImage('soya-masala-rice'), NO_MEAL_IMAGE);
assert.notEqual(recipeImage('millet-moong-khichdi'), NO_MEAL_IMAGE);
assert.notEqual(recipeImage('banana-date-smoothie'), NO_MEAL_IMAGE);
assert.notEqual(recipeImage('soya-protein-salad'), NO_MEAL_IMAGE);
assert.notEqual(recipeImage('chicken-rice-recovery'), NO_MEAL_IMAGE);
assert.notEqual(recipeImage('papaya-fruit'), NO_MEAL_IMAGE);
assert.equal(recipeImage('unknown-recipe'), NO_MEAL_IMAGE);
assert.deepEqual(individualFoods.map(r => r.ingredients[0][0]), ['egg', 'banana', 'papaya']);
assert.ok(individualFoods.every(r => r.ingredients.length === 1 && !recipes.some(p => p.id === r.id)));
const egg = individualFoods[0];
assert.equal(compatibleRecipe(egg, {diet:'vegan',allergies:''}), false);
assert.equal(compatibleRecipe(egg, {diet:'eggetarian',allergies:'egg'}), false);
assert.equal(compatibleRecipe(egg, {diet:'eggetarian',allergies:''}), true);
console.log(`Meal images: ${Object.keys(mealImages).length} reviewed mappings; ${libraryRecipes.length-Object.keys(mealImages).length} neutral placeholders. Saved/custom/substituted meals and individual food restrictions passed.`);
