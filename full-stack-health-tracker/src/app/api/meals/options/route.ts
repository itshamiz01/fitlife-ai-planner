import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { meals } from "@/db/schema";
import { apiError, ApiError, requireUser, publicProfile } from "@/lib/server";
import { recipeCandidates } from "@/lib/planner";
import { dailyBudget } from "@/lib/types";
export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const id = new URL(request.url).searchParams.get("mealId");
    if (!id || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id)) throw new ApiError("Choose a valid meal.");
    const [meal] = await db.select().from(meals).where(and(eq(meals.id, id), eq(meals.userId, user.id))).limit(1);
    if (!meal) throw new ApiError("This meal could not be found.", 404);
    const others = await db.select().from(meals).where(and(eq(meals.userId, user.id), eq(meals.day, meal.day), ne(meals.id, meal.id)));
    const knownOtherCost = others.reduce((sum,item) => sum + (item.costPaise ?? 0), 0);
    const remaining = Math.max(0, dailyBudget(publicProfile(user)) - knownOtherCost);
    const options = recipeCandidates(publicProfile(user), meal.mealType, meal.day).filter(option => option.meal.costPaise <= remaining && option.recipe.id !== meal.recipeId).map(option => ({ ...option.meal, tag: option.recipe.tag }));
    return NextResponse.json({ options, remainingPaise: remaining, hasUnpricedMeals: others.some(item => item.costPaise === null) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
