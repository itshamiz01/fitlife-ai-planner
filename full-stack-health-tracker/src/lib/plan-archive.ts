import { eq } from "drizzle-orm";
import type { db } from "@/db";
import { meals, workouts, planArchives } from "@/db/schema";
import type { Profile } from "./types";
import { buildMealPlan, buildWorkoutPlan } from "./planner";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
/** Caller locks the user row first. Archive and replacement share one transaction. */
async function snapshotCurrent(tx: Transaction, before: Profile, reason: "profile-change" | "regenerate" | "restore") {
  const oldMeals = await tx.select().from(meals).where(eq(meals.userId, before.id)).for("update");
  const oldWorkouts = await tx.select().from(workouts).where(eq(workouts.userId, before.id)).for("update");
  if (oldMeals.length || oldWorkouts.length) await tx.insert(planArchives).values({ userId: before.id, reason, snapshot: { profile: before, meals: oldMeals, workouts: oldWorkouts } });
}
export async function archiveAndReplacePlan(tx: Transaction, before: Profile, after: Profile, reason: "profile-change" | "regenerate") {
  const nextMeals = buildMealPlan(after);
  const nextWorkouts = buildWorkoutPlan(after);
  await snapshotCurrent(tx, before, reason);
  await tx.delete(meals).where(eq(meals.userId, before.id));
  await tx.delete(workouts).where(eq(workouts.userId, before.id));
  if (nextMeals.length) await tx.insert(meals).values(nextMeals);
  if (nextWorkouts.length) await tx.insert(workouts).values(nextWorkouts);
}

/** Caller has already authenticated, checked compatibility and locked the user row. */
export async function restoreArchivedPlan(tx: Transaction, current: Profile, snapshot: typeof planArchives.$inferSelect.snapshot) {
  await snapshotCurrent(tx, current, "restore");
  await tx.delete(meals).where(eq(meals.userId, current.id));
  await tx.delete(workouts).where(eq(workouts.userId, current.id));
  // New IDs prevent collisions when the same archive is restored repeatedly.
  const restoredMeals = snapshot.meals.map(({ id: _id, ...meal }) => ({ ...meal, userId: current.id }));
  const restoredWorkouts = snapshot.workouts.map(({ id: _id, ...workout }) => ({ ...workout, userId: current.id }));
  if (restoredMeals.length) await tx.insert(meals).values(restoredMeals);
  if (restoredWorkouts.length) await tx.insert(workouts).values(restoredWorkouts);
}
