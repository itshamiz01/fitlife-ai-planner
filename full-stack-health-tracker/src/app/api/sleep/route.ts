import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { sleepLogs } from "@/db/schema";
import { ApiError, apiError, checkOrigin, requireUser, text } from "@/lib/server";
import { validateSleep } from "@/lib/sleep-validation";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
function sleepError(error: unknown) {
  const cause = error && typeof error === "object" && "cause" in error ? error.cause : error;
  if (cause && typeof cause === "object" && "code" in cause && cause.code === "42P01") return NextResponse.json({ error: "Sleep journal is not available until the database migration has been applied.", code: "SLEEP_NOT_READY" }, { status: 503, headers });
  return apiError(error);
}
export async function GET() {
  try {
    const user = await requireUser();
    const rows = await db.select().from(sleepLogs).where(eq(sleepLogs.userId, user.id)).orderBy(desc(sleepLogs.endedAt), desc(sleepLogs.createdAt), desc(sleepLogs.id)).limit(201);
    return NextResponse.json({ entries: rows.slice(0, 200), hasMore: rows.length > 200 }, { headers });
  } catch (error) { return sleepError(error); }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const values = validateSleep(await request.json());
    const [entry] = await db.insert(sleepLogs).values({ ...values, userId: user.id }).returning();
    return NextResponse.json({ entry }, { status: 201, headers });
  } catch (error) { return sleepError(error); }
}
export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const body = await request.json();
    const id = text(body?.id, "Record ID", 36);
    if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id)) throw new ApiError("Invalid record ID.");
    const removed = await db.delete(sleepLogs).where(and(eq(sleepLogs.id, id), eq(sleepLogs.userId, user.id))).returning({ id: sleepLogs.id });
    if (!removed.length) throw new ApiError("This entry could not be found.", 404);
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) { return sleepError(error); }
}
