import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { meals, workouts, users } from "@/db/schema";
import { apiError, requireUser, checkOrigin, publicProfile, getDashboardData } from "@/lib/server";
import { buildMealPlan, buildWorkoutPlan } from "@/lib/planner";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    await db.transaction(async tx => {
      const [fresh] = await tx.select().from(users).where(eq(users.id, user.id)).for("update");
      await tx.delete(meals).where(eq(meals.userId, user.id));
      await tx.delete(workouts).where(eq(workouts.userId, user.id));
      const plan = buildMealPlan(publicProfile(fresh));
      if (plan.length) await tx.insert(meals).values(plan);
      await tx.insert(workouts).values(buildWorkoutPlan(publicProfile(fresh)));
    });
    return NextResponse.json(await getDashboardData(user.id), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
