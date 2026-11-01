import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { and, asc, eq, lte } from "drizzle-orm";
import webpush from "web-push";
import { db } from "@/db";
import { users, waterPushSubscriptions } from "@/db/schema";
import { waterPushConfig } from "@/lib/water-push-config";
import { isReminderTime, pushMessage, validPushEndpoint } from "@/lib/water-push";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };
export async function POST(request: Request) {
  const config = waterPushConfig();
  if (!config) return NextResponse.json({ error: "Push delivery is not configured." }, { status: 503, headers });
  const provided = request.headers.get("authorization") || "";
  const expected = `Bearer ${config.secret}`;
  if (Buffer.byteLength(provided) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) return NextResponse.json({ error: "Unauthorized." }, { status: 401, headers });
  try {
    webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
    const now = new Date();
    const due = await db.select({ subscription: waterPushSubscriptions, name: users.name, interval: users.reminderInterval }).from(waterPushSubscriptions).innerJoin(users, eq(users.id, waterPushSubscriptions.userId)).where(and(eq(users.remindersEnabled,true), lte(waterPushSubscriptions.nextDue,now))).orderBy(asc(waterPushSubscriptions.nextDue)).limit(20);
    let attempted = 0, accepted = 0, expired = 0, failed = 0;
    async function deliver(row: typeof due[number]) {
      const interval = Math.max(15, Math.min(180, row.interval));
      let activeHours = false;
      try { activeHours = isReminderTime(now, row.subscription.timeZone); } catch { failed++; }
      const nextDue = new Date(now.getTime() + (activeHours ? interval : 15) * 60000);
      // Atomic lease: competing scheduler invocations cannot send the same due event.
      // A process crash after this claim can miss one reminder, rather than duplicate it.
      const claimed = await db.update(waterPushSubscriptions).set({ nextDue }).where(and(eq(waterPushSubscriptions.id,row.subscription.id),lte(waterPushSubscriptions.nextDue,now))).returning({ id: waterPushSubscriptions.id });
      if (!claimed.length || !activeHours) return;
      // Honor opt-out and deletion as close to delivery as practical.
      const [stillEnabled] = await db.select({ id: users.id }).from(users).innerJoin(waterPushSubscriptions,eq(waterPushSubscriptions.userId,users.id)).where(and(eq(waterPushSubscriptions.id,row.subscription.id),eq(waterPushSubscriptions.nextDue,nextDue),eq(waterPushSubscriptions.p256dh,row.subscription.p256dh),eq(waterPushSubscriptions.auth,row.subscription.auth),eq(users.remindersEnabled,true))).limit(1);
      if (!stillEnabled || !validPushEndpoint(row.subscription.endpoint)) return;
      attempted++;
      try {
        await webpush.sendNotification({ endpoint: row.subscription.endpoint, keys: { p256dh: row.subscription.p256dh, auth: row.subscription.auth } }, JSON.stringify(pushMessage(row.name)), { TTL: 300, timeout: 10000 });
        accepted++;
      } catch (error) {
        const status = error && typeof error === "object" && "statusCode" in error ? error.statusCode : null;
        if (status === 404 || status === 410) {
          await db.delete(waterPushSubscriptions).where(and(eq(waterPushSubscriptions.id,row.subscription.id),eq(waterPushSubscriptions.nextDue,nextDue),eq(waterPushSubscriptions.p256dh,row.subscription.p256dh),eq(waterPushSubscriptions.auth,row.subscription.auth)));
          expired++;
        } else {
          failed++;
          // Transient errors are retried later, not in a tight loop. Permanent
          // errors wait for the regular interval. A process crash may still miss a push.
          if (status === 429 || (typeof status === "number" && status >= 500) || status === null) {
            const retryAt = new Date(now.getTime() + 15 * 60000);
            if (retryAt < nextDue) await db.update(waterPushSubscriptions).set({ nextDue: retryAt }).where(and(eq(waterPushSubscriptions.id,row.subscription.id),eq(waterPushSubscriptions.nextDue,nextDue),eq(waterPushSubscriptions.p256dh,row.subscription.p256dh),eq(waterPushSubscriptions.auth,row.subscription.auth)));
          }
        }
      }
    }
    for (let i = 0; i < due.length; i += 5) await Promise.all(due.slice(i, i + 5).map(deliver));
    return NextResponse.json({ attempted, accepted, expired, failed, batchLimit: 20 }, { headers });
  } catch {
    // Never print VAPID credentials, device endpoints, or message payloads.
    return NextResponse.json({ error: "Push delivery failed. Verify server configuration and migration." }, { status: 503, headers });
  }
}
