import { NextResponse } from "next/server";
import { and, eq, desc, ne } from "drizzle-orm";
import { db } from "@/db";
import { meals, workouts, waterLogs, weightLogs, users } from "@/db/schema";
import { ApiError, apiError, requireUser, checkOrigin, choice, text, number, validDate, validTime, getDashboardData, publicProfile } from "@/lib/server";

import { recipes, compatibleRecipe } from "@/lib/food-catalog";
import { servingForRecipe } from "@/lib/planner";
import { dailyBudget } from "@/lib/types";

function mealValues(body: Record<string, unknown>) {
  const type = choice(body.mealType, ["Breakfast", "Lunch", "Dinner", "Snack"], "meal type");
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
      else if (typeof body.recipeId === "string") {
        await db.transaction(async tx => {
          const [fresh] = await tx.select().from(users).where(eq(users.id, user.id)).for("update");
          const [old] = await tx.select().from(meals).where(where).limit(1);
          if (!old) throw new ApiError("This meal could not be found.", 404);
          const recipe = recipes.find(item => item.id === body.recipeId);
          const profile = publicProfile(fresh);
          if (!recipe || !recipe.types.includes(old.mealType) || !compatibleRecipe(recipe, profile)) throw new ApiError("This recipe doesn't match your dietary or allergy settings.");
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
      if (method === "POST") { await db.insert(waterLogs).values({ ...waterValues(body), userId: user.id }); changed = true; }
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
