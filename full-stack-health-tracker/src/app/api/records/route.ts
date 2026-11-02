import { NextResponse } from "next/server";
import { and, eq, desc, ne } from "drizzle-orm";
import { db } from "@/db";
import { meals, workouts, waterLogs, weightLogs, users, waterReminderConfirmations } from "@/db/schema";
import { ApiError, apiError, requireUser, checkOrigin, choice, text, number, validDate, validTime, getDashboardData, publicProfile } from "@/lib/server";

import { recipes, compatibleRecipe, foodById } from "@/lib/food-catalog";
import { recipeMatchesMealType, servingForRecipe } from "@/lib/planner";
import { dailyBudget } from "@/lib/types";
import { scaleSavedServing, servingSnapshotKey } from "@/lib/recipe-serving";
import { substituteIngredient, substitutionOptions } from "@/lib/ingredient-substitutions";

function mealValues(body: Record<string, unknown>) {
  const type = choice(body.mealType, ["Breakfast", "Lunch", "Dinner", "Snack", "Pre-workout", "Post-workout"], "meal type");
  return { recipeId: null, ingredients: [], nutritionSource: "manual", costPaise: body.cost === undefined || body.cost === null || body.cost === "" ? null : Math.round(number(body.cost, "Meal cost in rupees", 0, 10000) * 100), day: Math.round(number(body.day, "Day", 0, 6)), mealType: type, name: text(body.name, "Meal name", 100), description: text(body.description, "Ingredients", 1500, false), portion: text(body.portion, "Portion", 150), time: validTime(body.time), calories: Math.round(number(body.calories, "Calories", 0, 2500)), protein: Math.round(number(body.protein ?? 20, "Protein", 0, 250)), carbs: Math.round(number(body.carbs ?? 40, "Carbs", 0, 400)), fat: Math.round(number(body.fat ?? 15, "Fat", 0, 250)), image: type === "Breakfast" ? "/images/toast.jpg" : type === "Dinner" ? "/images/salmon.jpg" : type === "Snack" ? "/images/snack.jpg" : "/images/salad.jpg" };
}
function workoutValues(body: Record<string, unknown>) {
  return { day: number(body.day, "Day", 0, 6), name: text(body.name, "Workout name", 100), category: choice(body.category, ["Walking", "Strength", "Yoga", "Mobility", "Cardio", "Cycling", "Swimming", "Play"], "activity"), duration: Math.round(number(body.duration, "Duration", 1, 180)), time: validTime(body.time), intensity: choice(body.intensity, ["Gentle", "Moderate", "Energetic"], "intensity"), description: text(body.description, "Instructions", 1500, false) };
}
function waterValues(body: Record<string, unknown>) { return { amount: Math.round(number(body.amount, "Water amount", 50, 2000)), date: validDate(body.date), time: validTime(body.time) }; }
function weightValues(body: Record<string, unknown>) { return { weight: number(body.weight, "Weight", 12, 400), date: validDate(body.date), note: text(body.note, "Note", 500, false) }; }
async function syncWeight(userId: string) {
  const [latest] = await db.select().from(weightLogs).where(eq(weightLogs.userId, userId)).orderBy(desc(weightLogs.date), desc(weightLogs.createdAt)).limit(1);
  if (latest) await db.update(users).set({ currentWeight: latest.weight }).where(eq(users.id, userId));
}
async function mutate(request: Request, method: "POST" | "PATCH" | "DELETE") {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const body = await request.json() as Record<string, unknown>;
    const resource = choice(body.resource, ["meals", "workouts", "water", "weights"], "resource");
    const id = method !== "POST" ? text(body.id, "Record ID", 36) : "";
    if (id && !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id)) throw new ApiError("Invalid record ID.");
    let changed = false;
    if (resource === "meals") {
      const where = and(eq(meals.id, id), eq(meals.userId, user.id));
      if (method === "POST") { await db.insert(meals).values({ ...mealValues(body), userId: user.id }); changed = true; }
      else if (method === "DELETE") changed = (await db.delete(meals).where(where).returning()).length > 0;
      else if (body.substitution !== undefined) {
        const substitution = body.substitution as { index?: unknown; foodId?: unknown } | null;
        if (!substitution || !Number.isInteger(substitution.index) || (substitution.index as number) < 0 || typeof substitution.foodId !== "string" || typeof body.snapshotKey !== "string" || body.snapshotKey.length > 50000 || typeof body.expectedRecipeId !== "string") throw new ApiError("Invalid substitution.");
        await db.transaction(async tx => {
          const [fresh] = await tx.select().from(users).where(eq(users.id, user.id)).for("update");
          const [old] = await tx.select().from(meals).where(where).for("update");
          if (!old) throw new ApiError("This meal could not be found.", 404);
          if (!old.recipeId || old.recipeId !== body.expectedRecipeId || !old.ingredients.length || servingSnapshotKey(old.ingredients) !== body.snapshotKey) throw new ApiError("The meal changed. Reopen it before substituting an ingredient.", 409);
          const index = substitution.index as number;
          if (!substitutionOptions(old.ingredients, index).includes(substitution.foodId as string) || old.ingredients.some(item => !foodById[item.foodId])) throw new ApiError("That substitution is not available for this meal.");
          let scaled;
          try { scaled = substituteIngredient(old.ingredients, index, substitution.foodId as string); } catch { throw new ApiError("This ingredient snapshot cannot be safely substituted."); }
          const profile = publicProfile(fresh);
          const candidate = { id: old.recipeId, name: old.name, types: [old.mealType], ingredients: scaled.ingredients.map(item => [item.foodId, item.grams] as [string, number]), instructions: old.description, image: old.image, tag: "" };
          if (!compatibleRecipe(candidate, profile)) throw new ApiError("The resulting ingredients do not match your current dietary or allergy settings.");
          const weeklyOthers = await tx.select().from(meals).where(and(eq(meals.userId, user.id), ne(meals.id, old.id)));
          if (weeklyOthers.some(item => item.costPaise === null)) throw new ApiError("Other meals have unknown prices, so the budget cannot be confirmed. Add their estimated costs first.");
          const others = weeklyOthers.filter(item => item.day === old.day);
          const weeklyBudget = profile.budgetPeriod === "weekly" ? profile.foodBudgetPaise : dailyBudget(profile) * 7;
          if (weeklyOthers.reduce((sum,item) => sum + (item.costPaise ?? 0), 0) + scaled.costPaise > weeklyBudget) throw new ApiError("That change exceeds your estimated weekly food budget.");
          if (others.reduce((sum,item) => sum + (item.costPaise ?? 0), 0) + scaled.costPaise > dailyBudget(profile)) throw new ApiError("That substitution exceeds your estimated daily food budget.");
          const substitutionNotice = "Ingredient substitutions have been made; the original recipe instructions may not match the saved ingredients. Review the ingredient list and adapt preparation.";
          const description = old.description.includes(substitutionNotice) ? old.description : `${old.description} ${substitutionNotice}`.trim();
          await tx.update(meals).set({ ingredients: scaled.ingredients, calories: Math.round(scaled.calories), protein: Math.round(scaled.protein), carbs: Math.round(scaled.carbs), fat: Math.round(scaled.fat), costPaise: scaled.costPaise, description, completed: false }).where(where);
          changed = true;
        });
      }
      else if (body.servings !== undefined) {
        if (!Number.isInteger(body.servings) || (body.servings as number) < 1 || (body.servings as number) > 4 || typeof body.snapshotKey !== "string" || body.snapshotKey.length > 50000 || typeof body.expectedRecipeId !== "string") throw new ApiError("Choose between 1 and 4 servings.");
        await db.transaction(async tx => {
          const [fresh] = await tx.select().from(users).where(eq(users.id, user.id)).for("update");
          const [old] = await tx.select().from(meals).where(where).for("update");
          if (!old) throw new ApiError("This meal could not be found.", 404);
          if (!old.recipeId || old.recipeId !== body.expectedRecipeId || !old.ingredients.length || servingSnapshotKey(old.ingredients) !== body.snapshotKey) throw new ApiError("The meal changed. Reopen it before adjusting servings.", 409);
          if (old.ingredients.some(item => !foodById[item.foodId])) throw new ApiError("Some saved ingredients are no longer recognized; servings cannot be safely adjusted.");
          const profile = publicProfile(fresh);
          const actualIngredients = { id: old.recipeId, name: old.name, types: [old.mealType], ingredients: old.ingredients.map(item => [item.foodId, item.grams] as [string, number]), instructions: old.description, image: old.image, tag: "" };
          if (!compatibleRecipe(actualIngredients, profile)) throw new ApiError("These ingredients do not match your current dietary or allergy settings.");
          const scaled = scaleSavedServing(old.ingredients, body.servings as number);
          const weeklyOthers = await tx.select().from(meals).where(and(eq(meals.userId, user.id), ne(meals.id, old.id)));
          if (weeklyOthers.some(item => item.costPaise === null)) throw new ApiError("Other meals have unknown prices, so the budget cannot be confirmed. Add their estimated costs first.");
          const others = weeklyOthers.filter(item => item.day === old.day);
          const weeklyBudget = profile.budgetPeriod === "weekly" ? profile.foodBudgetPaise : dailyBudget(profile) * 7;
          if (weeklyOthers.reduce((sum,item) => sum + (item.costPaise ?? 0), 0) + scaled.costPaise > weeklyBudget) throw new ApiError("That change exceeds your estimated weekly food budget.");
          if (others.reduce((sum,item) => sum + (item.costPaise ?? 0), 0) + scaled.costPaise > dailyBudget(profile)) throw new ApiError("That serving change exceeds your estimated daily food budget.");
          await tx.update(meals).set({ ingredients: scaled.ingredients, calories: Math.round(scaled.calories), protein: Math.round(scaled.protein), carbs: Math.round(scaled.carbs), fat: Math.round(scaled.fat), costPaise: scaled.costPaise, portion: `${body.servings} saved recipe ${body.servings === 1 ? "serving" : "servings"} · ingredient weights before cooking`, completed: false }).where(where);
          changed = true;
        });
      }
      else if (typeof body.recipeId === "string") {
        await db.transaction(async tx => {
          const [fresh] = await tx.select().from(users).where(eq(users.id, user.id)).for("update");
          const [old] = await tx.select().from(meals).where(where).limit(1);
          if (!old) throw new ApiError("This meal could not be found.", 404);
          const recipe = recipes.find(item => item.id === body.recipeId);
          const profile = publicProfile(fresh);
          if (!recipe || !recipeMatchesMealType(recipe, old.mealType) || !compatibleRecipe(recipe, profile)) throw new ApiError("This recipe doesn't match your dietary or allergy settings.");
          const replacement = servingForRecipe(profile, recipe, old.mealType, old.day, old.time);
          const others = await tx.select().from(meals).where(and(eq(meals.userId, user.id), eq(meals.day, old.day), ne(meals.id, old.id)));
          const cost = others.reduce((sum,item) => sum + (item.costPaise ?? 0), 0) + replacement.costPaise;
          if (cost > dailyBudget(profile)) throw new ApiError("That swap would exceed your estimated daily food budget. Choose a lower-cost option or update your budget.");
          await tx.update(meals).set(replacement).where(where); changed = true;
        });
      } else changed = (await db.update(meals).set(typeof body.completed === "boolean" ? { completed: body.completed } : mealValues(body)).where(where).returning()).length > 0;
    } else if (resource === "workouts") {
      const where = and(eq(workouts.id, id), eq(workouts.userId, user.id));
      if (method === "POST") { await db.insert(workouts).values({ ...workoutValues(body), userId: user.id }); changed = true; }
      else if (method === "DELETE") changed = (await db.delete(workouts).where(where).returning()).length > 0;
      else changed = (await db.update(workouts).set(typeof body.completed === "boolean" ? { completed: body.completed } : workoutValues(body)).where(where).returning()).length > 0;
    } else if (resource === "water") {
      const where = and(eq(waterLogs.id, id), eq(waterLogs.userId, user.id));
      if (method === "POST") {
        const values = waterValues(body);
        if (body.idempotencyKey !== undefined) {
          if (typeof body.idempotencyKey !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.idempotencyKey)) throw new ApiError("Invalid reminder confirmation ID.");
          const key = body.idempotencyKey;
          await db.transaction(async tx => {
            const inserted = await tx.insert(waterReminderConfirmations).values({ userId: user.id, requestId: key, amount: values.amount }).onConflictDoNothing().returning({ requestId: waterReminderConfirmations.requestId });
            if (inserted.length) await tx.insert(waterLogs).values({ ...values, userId: user.id });
            else {
              const [prior] = await tx.select({ amount: waterReminderConfirmations.amount }).from(waterReminderConfirmations).where(and(eq(waterReminderConfirmations.userId, user.id), eq(waterReminderConfirmations.requestId, key)));
              if (!prior || prior.amount !== values.amount) throw new ApiError("This reminder was already confirmed with a different amount. Review your water history.", 409);
            }
          });
        } else await db.insert(waterLogs).values({ ...values, userId: user.id });
        changed = true;
      }
      else if (method === "DELETE") changed = (await db.delete(waterLogs).where(where).returning()).length > 0;
      else changed = (await db.update(waterLogs).set(waterValues(body)).where(where).returning()).length > 0;
    } else {
      const where = and(eq(weightLogs.id, id), eq(weightLogs.userId, user.id));
      if (method === "POST") { await db.insert(weightLogs).values({ ...weightValues(body), userId: user.id }); changed = true; }
      else if (method === "DELETE") changed = (await db.delete(weightLogs).where(where).returning()).length > 0;
      else changed = (await db.update(weightLogs).set(weightValues(body)).where(where).returning()).length > 0;
      if (changed) await syncWeight(user.id);
    }
    if (!changed) throw new ApiError("This entry could not be found.", 404);
    return NextResponse.json(await getDashboardData(user.id), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
export function POST(request: Request) { return mutate(request, "POST"); }
export function PATCH(request: Request) { return mutate(request, "PATCH"); }
export function DELETE(request: Request) { return mutate(request, "DELETE"); }
