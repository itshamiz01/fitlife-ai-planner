import type { Profile, Meal, BudgetInfo } from "./types";
import { recipeImage } from "./illustrative-image";
import { dailyBudget, rupees } from "./types";
import { recipes, recipeNutrition, compatibleRecipe, parseAllergies, PRICE_NOTE, type Recipe } from "./food-catalog";

export const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];
export const mealTimes = ["08:00", "12:30", "19:00", "16:00"];
export const calorieShares = [.24, .30, .34, .12];
// Optional workout slots are user-created, not automatically added to the daily plan.
export function recipeMatchesMealType(recipe: Recipe, type: string) {
  return type === "Pre-workout" || type === "Post-workout" ? Boolean(recipe.details?.categories.includes(type)) : recipe.types.includes(type);
}
export function recommendations(p: Pick<Profile, "age" | "gender" | "currentWeight" | "height" | "activity" | "goal"> & { workoutMinutes?: number }) {
  const minor = p.age < 18;
  const bmr = 10 * p.currentWeight + 6.25 * p.height - 5 * p.age + (p.gender === "male" ? 5 : p.gender === "female" ? -161 : -78);
  const multiplier = p.activity === "low" ? 1.25 : p.activity === "high" ? 1.7 : 1.45;
  const adjustment = minor || p.age >= 65 ? 0 : p.goal === "lose" ? -350 : p.goal === "gain" ? 250 : 0;
  return {
    calorieTarget: minor ? 0 : Math.round(Math.min(3800, Math.max(p.gender === "female" ? 1500 : 1600, bmr * multiplier + adjustment)) / 10) * 10,
    waterTarget: p.age < 9 ? 1200 : p.age < 14 ? 1600 : Math.round(Math.min(3500, Math.max(1500, p.currentWeight * 32)) / 100) * 100,
    activityTarget: minor ? 60 : p.age >= 65 ? 30 : p.workoutMinutes || 30,
  };
}
export function servingForRecipe(profile: Profile, recipe: Recipe, mealType: string, day: number, time?: string) {
  const index = mealTypes.indexOf(mealType);
  const slot = index < 0 ? 3 : index;
  const nutrition = recipeNutrition(recipe, (profile.calorieTarget || 2000) * calorieShares[slot]);
  const child = profile.age < 18;
  return {
    userId: profile.id, day, mealType, name: recipe.name,
    description: `${recipe.instructions}${child ? " Caregiver: this is a family recipe reference, not a prescribed child portion. Adapt texture and portions to age, appetite and professional guidance." : ""}`,
    portion: child ? "Family recipe reference · caregiver chooses serving" : "1 recipe serving · ingredient weights before cooking",
    time: time || mealTimes[slot], image: recipeImage(recipe.id), completed: false,
    recipeId: recipe.id, nutritionSource: "ingredient-reference-v1", ...nutrition,
  };
}
export function recipeCandidates(profile: Profile, mealType: string, day = 0) {
  return recipes.filter(recipe => recipeMatchesMealType(recipe, mealType) && compatibleRecipe(recipe, profile)).map(recipe => ({ recipe, meal: servingForRecipe(profile, recipe, mealType, day) })).sort((a,b) => a.meal.costPaise - b.meal.costPaise || a.recipe.id.localeCompare(b.recipe.id));
}
export function getBudgetInfo(profile: Profile, currentMeals: Pick<Meal,"costPaise">[] = []): BudgetInfo {
  const budget = dailyBudget(profile);
  const allergy = parseAllergies(profile.allergies);
  const options = mealTypes.map(type => recipeCandidates(profile, type));
  const minimum = options.every(slot => slot.length) ? options.reduce((sum,slot) => sum + slot[0].meal.costPaise, 0) : null;
  const warnings: string[] = [];
  if (allergy.unknown.length) warnings.push(`We cannot verify these allergy notes: ${allergy.unknown.join(", ")}. No generated meal plan will be suggested until you clarify them. Supported ingredient/allergen filtering does not check package labels or cross-contact.`);
  else if (minimum === null) warnings.push("No complete set of compatible meals exists in the current catalog for these restrictions. Ask a qualified dietitian for alternatives; we won't guess substitutions.");
  else if (minimum > budget) warnings.push(`The least-cost reference menu is about ${rupees(minimum,2)} per day, above your ${rupees(budget,2)} budget. We won't shrink portions simply to hide the shortfall. Review local prices, pantry ingredients, community food support or your budget with appropriate help.`);
  if (currentMeals.some(meal => meal.costPaise === null)) warnings.push("Some saved or custom meals have no ingredient-based price. They are not free. Refresh your weekly plan or enter a cost to estimate its total.");
  return { dailyBudgetPaise: budget, weeklyBudgetPaise: profile.budgetPeriod === "weekly" ? profile.foodBudgetPaise : budget * 7, minimumDailyPaise: minimum, warnings, unknownAllergies: allergy.unknown, priceNote: PRICE_NOTE };
}
export function buildMealPlan(profile: Profile, demo = false) {
  const budget = dailyBudget(profile);
  const slots = mealTypes.map(type => recipeCandidates(profile, type));
  if (slots.some(slot => !slot.length) || slots.reduce((sum,slot) => sum + slot[0].meal.costPaise, 0) > budget) return [];
  const result: ReturnType<typeof servingForRecipe>[] = [];
  const recipeCounts = new Map<string, number>();
  const primaryCounts = new Map<string, number>();
  const primary = (recipe: Recipe) => [...recipe.ingredients].sort((a,b) => b[1]-a[1])[0]?.[0] || "";
  const currentDay = (new Date().getDay() + 6) % 7;
  for (let day = 0; day < 7; day++) {
    const selected = slots.map(slot => slot[0]);
    for (let offset = 0; offset < slots.length; offset++) {
      const index = (day + offset) % slots.length;
      const otherCost = selected.reduce((sum,item,i) => i === index ? sum : sum + item.meal.costPaise, 0);
      let affordable = slots[index].filter(item => item.meal.costPaise + otherCost <= budget);
      const distinct = affordable.filter(item => !selected.some((choice,i) => i !== index && choice.recipe.id === item.recipe.id));
      if (distinct.length) affordable = distinct;
      // Prefer a recipe not served anywhere yesterday, not just in the same slot.
      // Constraints win: relax this preference if no compatible option fits.
      const yesterday = new Set(result.filter(item => item.day === day - 1).map(item => item.recipeId));
      const notYesterday = affordable.filter(item => !yesterday.has(item.recipe.id));
      if (notYesterday.length) affordable = notYesterday;
      const score = (item: typeof affordable[number]) => (recipeCounts.get(item.recipe.id) || 0) * 100 + (primaryCounts.get(primary(item.recipe)) || 0) * 3;
      affordable.sort((a,b) => score(a) - score(b) || a.meal.costPaise - b.meal.costPaise || a.recipe.id.localeCompare(b.recipe.id));
      selected[index] = affordable[0];
    }
    selected.forEach((item,index) => { recipeCounts.set(item.recipe.id, (recipeCounts.get(item.recipe.id) || 0) + 1); const ingredient = primary(item.recipe); primaryCounts.set(ingredient, (primaryCounts.get(ingredient) || 0) + 1); result.push({ ...item.meal, day, completed: demo && day === currentDay && index !== 2 }); });
  }
  return result;
}
export function buildWorkoutPlan(profile: Profile, demo = false) {
  const gentle = profile.age >= 65 || profile.activity === "low";
  const minor = profile.age < 18;
  const currentDay = (new Date().getDay() + 6) % 7;
  const duration = profile.workoutMinutes || 30;
  const walking = Math.min(15, Math.max(5, Math.round(duration / 3)));
  const main = Math.max(5, duration - walking);
  const sets = profile.experience === "advanced" ? 4 : profile.experience === "intermediate" ? 3 : 2;
  const reps = profile.fitnessGoal === "strength" ? "6–8" : "8–12";
  const rest = profile.fitnessGoal === "strength" ? 120 : profile.experience === "beginner" ? 75 : 90;
  const exercise = profile.equipment === "gym" ? "1. Goblet squat or leg press; 2. machine chest press; 3. seated cable row; 4. supported plank" : profile.equipment === "home" ? "1. Dumbbell squat; 2. light dumbbell row; 3. wall or incline push-up; 4. glute bridge" : "1. Chair squat; 2. wall push-up; 3. glute bridge; 4. bird-dog";
  return Array.from({ length: 7 }, (_,day) => [
    { userId: profile.id, day, name: minor ? "Outdoor play & movement" : gentle ? "Easy morning walk" : "A purposeful daily walk", category: "Walking", duration: minor ? 20 : walking, time: "07:00", description: minor ? "Play, walk or cycle with appropriate supervision. This session is only part of a child's varied daily activity, not a calorie-burning prescription." : "Walk at a conversational pace. Start and finish slowly. Stop with pain, dizziness or unusual breathlessness.", intensity: gentle || minor ? "Gentle" : "Moderate", completed: demo && day === currentDay },
    { userId: profile.id, day, name: minor ? "Family stretch & balance" : gentle ? "Gentle balance & mobility" : day % 2 === 0 ? `${profile.equipment === "gym" ? "Gym" : profile.equipment === "home" ? "Home" : "Bodyweight"} ${profile.fitnessGoal === "strength" ? "strength foundations" : "full-body foundations"}` : "Recovery & mobility flow", category: gentle || minor ? "Mobility" : day % 2 === 0 ? "Strength" : "Yoga", duration: minor ? 15 : main, time: "17:30", description: gentle ? "Use a sturdy chair for support. Try gentle ankle circles, seated leg raises and comfortable shoulder rolls. Keep balance work supported. Have a clinician adapt this to your health and fall risk." : minor ? "Gentle family stretching and balance games. A caregiver chooses age-appropriate activities; no automatic loaded progression." : day % 2 === 0 ? `Warm up for 3–5 minutes. In order: ${exercise}. Start with up to ${sets} sets of ${reps} controlled repetitions each, resting ${rest} seconds. For a plank, use a comfortable 10–20-second hold instead of repetitions. Choose a load or variation leaving 2–3 comfortable reps in reserve. Fit only what feels manageable in ${main} minutes; skip a set rather than rush. Stop for pain. These are prescriptions, not a record of sets actually completed.` : "Use comfortable cat-cow, shoulder circles, supported calf stretches and easy breathing. Hold gentle stretches about 20 seconds without bouncing or pushing into pain.", intensity: gentle || minor || day % 2 !== 0 ? "Gentle" : "Moderate", completed: false },
  ]).flat();
}
