import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { activityLogs } from "@/db/schema";
import { ApiError, apiError, checkOrigin, requireUser, text } from "@/lib/server";
import { validateActivity } from "@/lib/activity-validation";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
function activityError(error: unknown) {
  const cause = error && typeof error === "object" && "cause" in error ? error.cause : error;
  if (cause && typeof cause === "object" && "code" in cause && cause.code === "42P01") return NextResponse.json({ error: "Activity journal is not available until the database migration has been applied.", code: "ACTIVITY_NOT_READY" }, { status: 503, headers });
  return apiError(error);
}
export async function GET() {
  try {
    const user = await requireUser();
    const rows = await db.select().from(activityLogs).where(eq(activityLogs.userId, user.id)).orderBy(desc(activityLogs.date), desc(activityLogs.createdAt), desc(activityLogs.id)).limit(201);
    return NextResponse.json({ entries: rows.slice(0, 200), hasMore: rows.length > 200 }, { headers });
  } catch (error) { return activityError(error); }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const values = validateActivity(await request.json());
    const [entry] = await db.insert(activityLogs).values({ ...values, userId: user.id }).returning();
    return NextResponse.json({ entry }, { status: 201, headers });
  } catch (error) { return activityError(error); }
}
export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const body = await request.json();
    const id = text(body?.id, "Record ID", 36);
    if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id)) throw new ApiError("Invalid record ID.");
    const deleted = await db.delete(activityLogs).where(and(eq(activityLogs.id, id), eq(activityLogs.userId, user.id))).returning({ id: activityLogs.id });
    if (!deleted.length) throw new ApiError("This entry could not be found.", 404);
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) { return activityError(error); }
}
