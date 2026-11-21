import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import webpush from "web-push";
import { db } from "@/db";
import { users, meals, workouts, waterPushSubscriptions, planPushSends } from "@/db/schema";
import { waterPushConfig } from "@/lib/water-push-config";
import { validPushEndpoint } from "@/lib/water-push";
import { isPlanItemDue, localDayParts, mealPushMessage, workoutPushMessage, type PlanPushKind } from "@/lib/plan-push";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };
const SUBSCRIPTION_BATCH = 50;

export async function POST(request: Request) {
  const config = waterPushConfig();
  if (!config) return NextResponse.json({ error: "Push delivery is not configured." }, { status: 503, headers });
  const provided = request.headers.get("authorization") || "";
  const expected = `Bearer ${config.secret}`;
  if (Buffer.byteLength(provided) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) return NextResponse.json({ error: "Unauthorized." }, { status: 401, headers });
  try {
    webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
    const now = new Date();
    const subscriptions = await db.select({ subscription: waterPushSubscriptions, name: users.name, mealEnabled: users.mealRemindersEnabled, workoutEnabled: users.workoutRemindersEnabled })
      .from(waterPushSubscriptions)
      .innerJoin(users, eq(users.id, waterPushSubscriptions.userId))
      .limit(SUBSCRIPTION_BATCH);
    let attempted = 0, accepted = 0, expired = 0, failed = 0;

    async function claimAndSend(row: typeof subscriptions[number], kind: PlanPushKind, itemId: string, payload: object) {
      const { subscription } = row;
      // The ledger insert is the claim: overlapping scheduler invocations and
      // later ticks cannot send the same planned item twice to this device.
      const claimed = await db.insert(planPushSends)
        .values({ userId: subscription.userId, subscriptionId: subscription.id, kind, itemId, localDate: localDayParts(now, subscription.timeZone).dateKey })
        .onConflictDoNothing()
        .returning({ userId: planPushSends.userId });
      if (!claimed.length) return;
      attempted++;
      try {
        await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify(payload), { TTL: 300, timeout: 10000 });
        accepted++;
      } catch (error) {
        const status = error && typeof error === "object" && "statusCode" in error ? error.statusCode : null;
        if (status === 404 || status === 410) {
          // Deleting the subscription cascades to its ledger rows.
          await db.delete(waterPushSubscriptions).where(eq(waterPushSubscriptions.id, subscription.id));
          expired++;
        } else {
          failed++;
          // Release the claim so a later tick inside the grace window can retry.
          await db.delete(planPushSends).where(and(
            eq(planPushSends.subscriptionId, subscription.id),
            eq(planPushSends.kind, kind),
            eq(planPushSends.itemId, itemId),
            eq(planPushSends.localDate, localDayParts(now, subscription.timeZone).dateKey),
          ));
        }
      }
    }

    async function processSubscription(row: typeof subscriptions[number]) {
      const { subscription, name } = row;
      if (!validPushEndpoint(subscription.endpoint)) return;
      let parts;
      try { parts = localDayParts(now, subscription.timeZone); } catch { failed++; return; }
      if (row.mealEnabled) {
        const todaysMeals = await db.select().from(meals).where(and(eq(meals.userId, subscription.userId), eq(meals.day, parts.dayIndex), eq(meals.completed, false)));
        for (const meal of todaysMeals) {
          if (isPlanItemDue(meal.time, parts.minutes)) await claimAndSend(row, "meal", meal.id, mealPushMessage(name, meal.mealType, meal.name, meal.portion));
        }
      }
      if (row.workoutEnabled) {
        const todaysWorkouts = await db.select().from(workouts).where(and(eq(workouts.userId, subscription.userId), eq(workouts.day, parts.dayIndex), eq(workouts.completed, false)));
        for (const workout of todaysWorkouts) {
          if (isPlanItemDue(workout.time, parts.minutes)) await claimAndSend(row, "workout", workout.id, workoutPushMessage(name, workout.name, workout.duration, workout.time));
        }
      }
    }

    for (let i = 0; i < subscriptions.length; i += 5) await Promise.all(subscriptions.slice(i, i + 5).map(processSubscription));
    return NextResponse.json({ attempted, accepted, expired, failed, batchLimit: SUBSCRIPTION_BATCH }, { headers });
  } catch {
    // Never print VAPID credentials, device endpoints, or message payloads.
    return NextResponse.json({ error: "Push delivery failed. Verify server configuration and migration." }, { status: 503, headers });
  }
}
