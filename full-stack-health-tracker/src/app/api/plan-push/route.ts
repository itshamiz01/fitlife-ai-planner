import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ApiError, apiError, checkOrigin, requireUser } from "@/lib/server";
import { waterPushConfig } from "@/lib/water-push-config";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };

function planPushError(error: unknown) {
  const cause = error && typeof error === "object" && "cause" in error ? error.cause : error;
  const code = cause && typeof cause === "object" && "code" in cause ? cause.code : null;
  // 42P01 = missing table, 42703 = missing column: migration 0009 has not been applied.
  if (code === "42P01" || code === "42703") return NextResponse.json({ error: "Meal and workout notifications require a database migration.", code: "PUSH_NOT_READY" }, { status: 503, headers });
  if (error instanceof ApiError || error instanceof SyntaxError) return apiError(error);
  return NextResponse.json({ error: "Could not update meal and workout notification settings. Please try again.", code: "PUSH_ERROR" }, { status: 503, headers });
}

export async function GET() {
  try {
    const user = await requireUser();
    const [fresh] = await db.select({ meal: users.mealRemindersEnabled, workout: users.workoutRemindersEnabled }).from(users).where(eq(users.id, user.id)).limit(1);
    if (!fresh) throw new ApiError("Account not found.", 404);
    return NextResponse.json({ configured: Boolean(waterPushConfig()), mealRemindersEnabled: fresh.meal, workoutRemindersEnabled: fresh.workout }, { headers });
  } catch (error) { return planPushError(error); }
}

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const body = await request.json();
    const patch: { mealRemindersEnabled?: boolean; workoutRemindersEnabled?: boolean } = {};
    if (body?.mealRemindersEnabled !== undefined) {
      if (typeof body.mealRemindersEnabled !== "boolean") throw new ApiError("Choose a valid meal reminder setting.");
      patch.mealRemindersEnabled = body.mealRemindersEnabled;
    }
    if (body?.workoutRemindersEnabled !== undefined) {
      if (typeof body.workoutRemindersEnabled !== "boolean") throw new ApiError("Choose a valid workout reminder setting.");
      patch.workoutRemindersEnabled = body.workoutRemindersEnabled;
    }
    if (patch.mealRemindersEnabled === undefined && patch.workoutRemindersEnabled === undefined) throw new ApiError("Nothing to update.");
    const [updated] = await db.update(users).set(patch).where(eq(users.id, user.id)).returning({ meal: users.mealRemindersEnabled, workout: users.workoutRemindersEnabled });
    if (!updated) throw new ApiError("Account not found.", 404);
    return NextResponse.json({ configured: Boolean(waterPushConfig()), mealRemindersEnabled: updated.meal, workoutRemindersEnabled: updated.workout }, { headers });
  } catch (error) { return planPushError(error); }
}
