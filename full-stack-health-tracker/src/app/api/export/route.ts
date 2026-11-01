import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { coachMessages, planArchives, activityLogs, sleepLogs, journalEntries, groceryPurchases } from "@/db/schema";
import { apiError, checkOrigin, getDashboardData, requireUser } from "@/lib/server";

export const dynamic = "force-dynamic";

// An explicit allowlist prevents account credentials or future private user
// columns from silently becoming part of an export.
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const [data, messages] = await Promise.all([
      getDashboardData(user.id),
      db.select({ id: coachMessages.id, role: coachMessages.role, content: coachMessages.content, sources: coachMessages.sources, mode: coachMessages.mode, createdAt: coachMessages.createdAt })
        .from(coachMessages).where(eq(coachMessages.userId, user.id)).orderBy(asc(coachMessages.createdAt), asc(coachMessages.id)),
    ]);
    // Existing installations can still export their current data before the
    // additive archive migration is applied. Other database failures surface.
    let archivesAvailable = true;
    let archives: { id: string; reason: string; snapshot: typeof planArchives.$inferSelect.snapshot; createdAt: Date }[] = [];
    try {
      archives = await db.select({ id: planArchives.id, reason: planArchives.reason, snapshot: planArchives.snapshot, createdAt: planArchives.createdAt })
        .from(planArchives).where(eq(planArchives.userId, user.id)).orderBy(asc(planArchives.createdAt), asc(planArchives.id));
    } catch (error) {
      const cause = error && typeof error === "object" && "cause" in error ? error.cause : error;
      if (!cause || typeof cause !== "object" || !("code" in cause) || cause.code !== "42P01") throw error;
      archivesAvailable = false;
    }
    let activityAvailable = true;
    let activity: (typeof activityLogs.$inferSelect)[] = [];
    try {
      activity = await db.select().from(activityLogs).where(eq(activityLogs.userId, user.id)).orderBy(asc(activityLogs.date), asc(activityLogs.createdAt), asc(activityLogs.id));
    } catch (error) {
      const cause = error && typeof error === "object" && "cause" in error ? error.cause : error;
      if (!cause || typeof cause !== "object" || !("code" in cause) || cause.code !== "42P01") throw error;
      activityAvailable = false;
    }
    let sleepAvailable = true;
    let sleep: (typeof sleepLogs.$inferSelect)[] = [];
    try {
      sleep = await db.select().from(sleepLogs).where(eq(sleepLogs.userId, user.id)).orderBy(asc(sleepLogs.endedAt), asc(sleepLogs.createdAt), asc(sleepLogs.id));
    } catch (error) {
      const cause = error && typeof error === "object" && "cause" in error ? error.cause : error;
      if (!cause || typeof cause !== "object" || !("code" in cause) || cause.code !== "42P01") throw error;
      sleepAvailable = false;
    }
    let journalsAvailable = true;
    let journals: (typeof journalEntries.$inferSelect)[] = [];
    try {
      journals = await db.select().from(journalEntries).where(eq(journalEntries.userId, user.id)).orderBy(asc(journalEntries.date), asc(journalEntries.createdAt), asc(journalEntries.id));
    } catch (error) {
      const cause = error && typeof error === "object" && "cause" in error ? error.cause : error;
      if (!cause || typeof cause !== "object" || !("code" in cause) || cause.code !== "42P01") throw error;
      journalsAvailable = false;
    }
    let groceriesAvailable = true;
    let groceryPurchaseState: { listSignature: string; purchasedKeys: string[]; updatedAt: Date } | null = null;
    try {
      [groceryPurchaseState] = await db.select({ listSignature: groceryPurchases.listSignature, purchasedKeys: groceryPurchases.purchasedKeys, updatedAt: groceryPurchases.updatedAt }).from(groceryPurchases).where(eq(groceryPurchases.userId, user.id));
      groceryPurchaseState ??= null;
    } catch (error) {
      const cause = error && typeof error === "object" && "cause" in error ? error.cause : error;
      if (!cause || typeof cause !== "object" || !("code" in cause) || cause.code !== "42P01") throw error;
      groceriesAvailable = false;
    }
    const p = data.user;
    const profile = {
      id: p.id, email: p.email, name: p.name, isDemo: p.isDemo,
      age: p.age, gender: p.gender, height: p.height, currentWeight: p.currentWeight,
      startWeight: p.startWeight, targetWeight: p.targetWeight, goal: p.goal,
      activity: p.activity, diet: p.diet, allergies: p.allergies,
      foodBudgetPaise: p.foodBudgetPaise, budgetPeriod: p.budgetPeriod,
      experience: p.experience, equipment: p.equipment, workoutMinutes: p.workoutMinutes,
      fitnessGoal: p.fitnessGoal, calorieTarget: p.calorieTarget, waterTarget: p.waterTarget,
      activityTarget: p.activityTarget, remindersEnabled: p.remindersEnabled, reminderInterval: p.reminderInterval,
    };
    return NextResponse.json({ format: "fitlife-account-export", version: 1, exportedAt: new Date().toISOString(), profile, meals: data.meals, workouts: data.workouts, waterLogs: data.waterLogs, weightLogs: data.weightLogs, coachMessages: messages, planArchivesAvailable: archivesAvailable, planArchives: archives, activityAvailable, activityLogs: activity, sleepAvailable, sleepLogs: sleep, journalsAvailable, journalEntries: journals, groceriesAvailable, groceryPurchaseState }, {
      headers: { "Cache-Control": "private, no-store", "Vary": "Cookie", "X-Fitlife-Archives-Available": String(archivesAvailable), "X-Fitlife-Activity-Available": String(activityAvailable), "X-Fitlife-Sleep-Available": String(sleepAvailable), "X-Fitlife-Journals-Available": String(journalsAvailable), "X-Fitlife-Groceries-Available": String(groceriesAvailable), "X-Content-Type-Options": "nosniff", "Content-Disposition": 'attachment; filename="fitlife-account-export.json"' },
    });
  } catch (error) { return apiError(error); }
}
