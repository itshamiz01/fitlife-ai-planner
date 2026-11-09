import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, waterPushSubscriptions } from "@/db/schema";
import { ApiError, apiError, checkOrigin, requireUser } from "@/lib/server";
import { waterPushConfig } from "@/lib/water-push-config";
import { validPushEndpoint, validPushKey, validTimeZone } from "@/lib/water-push";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
function pushError(error: unknown) {
  const cause = error && typeof error === "object" && "cause" in error ? error.cause : error;
  if (cause && typeof cause === "object" && "code" in cause && cause.code === "42P01") return NextResponse.json({ error: "Closed-app reminders require a database migration.", code: "PUSH_NOT_READY" }, { status: 503, headers });
  if (error instanceof ApiError || error instanceof SyntaxError) return apiError(error);
  // Database errors can contain subscription endpoints or keys; never log them.
  return NextResponse.json({ error: "Could not update device notification settings. Please try again.", code: "PUSH_ERROR" }, { status: 503, headers });
}
export async function GET() {
  try {
    const user = await requireUser();
    const config = waterPushConfig();
    // Surface a missing migration before asking the user for browser permission.
    await db.select({ id: waterPushSubscriptions.id }).from(waterPushSubscriptions).where(eq(waterPushSubscriptions.userId,user.id)).limit(1);
    return NextResponse.json({ configured: Boolean(config), publicKey: config?.publicKey ?? null }, { headers });
  } catch (error) { return pushError(error); }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const body = await request.json();
    if (body?.action === "status") {
      if (!validPushEndpoint(body.endpoint)) throw new ApiError("Invalid push subscription.");
      const [entry] = await db.select({ nextDue: waterPushSubscriptions.nextDue, timeZone: waterPushSubscriptions.timeZone }).from(waterPushSubscriptions).where(and(eq(waterPushSubscriptions.userId,user.id),eq(waterPushSubscriptions.endpoint,body.endpoint))).limit(1);
      return NextResponse.json({ registered: Boolean(entry), nextDue: entry?.nextDue ?? null, timeZone: entry?.timeZone ?? null }, { headers });
    }
    if (!waterPushConfig()) throw new ApiError("Closed-app reminders are not configured on this server.", 503, "PUSH_NOT_CONFIGURED");
    const subscription = body?.subscription;
    if (!validPushEndpoint(subscription?.endpoint) || !validPushKey(subscription?.keys?.p256dh,65) || !validPushKey(subscription?.keys?.auth,16) || !validTimeZone(body?.timeZone)) throw new ApiError("Invalid or unsupported push subscription.");
    const endpoint = subscription.endpoint as string;
    await db.transaction(async tx => {
      // Serialize registration per account so the device limit survives concurrent requests.
      const [fresh] = await tx.select({ id: users.id, reminderInterval: users.reminderInterval }).from(users).where(eq(users.id,user.id)).for("update");
      if (!fresh) throw new ApiError("Account not found.",404);
      const [existing] = await tx.select({ userId: waterPushSubscriptions.userId }).from(waterPushSubscriptions).where(eq(waterPushSubscriptions.endpoint,endpoint));
      if (existing && existing.userId !== user.id) throw new ApiError("This device is already registered to another account. Disable its notifications in that account first.", 409);
      if (!existing) {
        const devices = await tx.select({ id: waterPushSubscriptions.id }).from(waterPushSubscriptions).where(eq(waterPushSubscriptions.userId,user.id)).limit(10);
        if (devices.length >= 10) throw new ApiError("This account has reached the 10-device reminder limit. Disable a device before adding another.", 409);
      }
      const values = { userId: user.id, endpoint, p256dh: subscription.keys.p256dh as string, auth: subscription.keys.auth as string, timeZone: body.timeZone as string, nextDue: new Date(Date.now() + Math.max(15, Math.min(180,fresh.reminderInterval)) * 60000) };
      const inserted = await tx.insert(waterPushSubscriptions).values(values).onConflictDoUpdate({ target: waterPushSubscriptions.endpoint, set: { p256dh: values.p256dh, auth: values.auth, timeZone: values.timeZone, nextDue: values.nextDue }, setWhere: eq(waterPushSubscriptions.userId, user.id) }).returning({ id: waterPushSubscriptions.id });
      if (!inserted.length) throw new ApiError("This device is already registered to another account.", 409);
    });
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) { return pushError(error); }
}
export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const body = await request.json();
    if (body?.all === true) {
      await db.delete(waterPushSubscriptions).where(eq(waterPushSubscriptions.userId, user.id));
      return NextResponse.json({ ok: true }, { headers });
    }
    if (!validPushEndpoint(body?.endpoint)) throw new ApiError("Invalid push subscription.");
    const [existing] = await db.select({ userId: waterPushSubscriptions.userId }).from(waterPushSubscriptions).where(eq(waterPushSubscriptions.endpoint, body.endpoint));
    if (existing && existing.userId !== user.id) throw new ApiError("This device is registered to another account. Disable it in that account first.", 409);
    await db.delete(waterPushSubscriptions).where(and(eq(waterPushSubscriptions.userId, user.id), eq(waterPushSubscriptions.endpoint, body.endpoint)));
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) { return pushError(error); }
}
