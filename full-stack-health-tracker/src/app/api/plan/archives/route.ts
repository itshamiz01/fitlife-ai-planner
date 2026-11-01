import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { planArchives, users } from "@/db/schema";
import { ApiError, apiError, checkOrigin, publicProfile, requireUser, text } from "@/lib/server";
import { profileChangesPlan } from "@/lib/profile-plan-change";
import { restoreArchivedPlan } from "@/lib/plan-archive";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
function archiveError(error: unknown) {
  const cause = error && typeof error === "object" && "cause" in error ? error.cause : error;
  if (cause && typeof cause === "object" && "code" in cause && cause.code === "42P01") return NextResponse.json({ error: "Plan archives are unavailable until the database migration is applied.", code: "ARCHIVES_NOT_READY" }, { status: 503, headers });
  return apiError(error);
}
export async function GET() {
  try {
    const user = await requireUser();
    const rows = await db.select().from(planArchives).where(eq(planArchives.userId, user.id)).orderBy(desc(planArchives.createdAt), desc(planArchives.id)).limit(101);
    const current = publicProfile(user);
    const archives = rows.slice(0, 100).map(row => ({ id: row.id, reason: row.reason, createdAt: row.createdAt, mealCount: row.snapshot.meals.length, workoutCount: row.snapshot.workouts.length, compatible: !profileChangesPlan(row.snapshot.profile, current) }));
    return NextResponse.json({ archives, hasMore: rows.length > 100 }, { headers });
  } catch (error) { return archiveError(error); }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const body = await request.json();
    const id = text(body?.id, "Archive ID", 36);
    if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id)) throw new ApiError("Invalid archive ID.");
    await db.transaction(async tx => {
      const [fresh] = await tx.select().from(users).where(eq(users.id, user.id)).for("update");
      if (!fresh) throw new ApiError("Account not found.", 404);
      const [archive] = await tx.select().from(planArchives).where(and(eq(planArchives.id, id), eq(planArchives.userId, user.id))).limit(1);
      if (!archive) throw new ApiError("This archive could not be found.", 404);
      const snapshot = archive.snapshot;
      if (!snapshot || !snapshot.profile || snapshot.profile.id !== user.id || !Array.isArray(snapshot.meals) || !Array.isArray(snapshot.workouts) || snapshot.meals.some(meal => meal.userId !== user.id) || snapshot.workouts.some(workout => workout.userId !== user.id)) throw new ApiError("This archive cannot be safely restored. Download your data for review.", 409, "INVALID_ARCHIVE");
      const current = publicProfile(fresh);
      if (profileChangesPlan(snapshot.profile, current)) throw new ApiError("Your health or planning details have changed since this archive. Review your current profile before restoring; the archive remains available in your JSON download.", 409, "PROFILE_MISMATCH");
      await restoreArchivedPlan(tx, current, snapshot);
    });
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) { return archiveError(error); }
}
