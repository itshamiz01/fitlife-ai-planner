import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { journalEntries } from "@/db/schema";
import { ApiError, apiError, checkOrigin, choice, requireUser, text } from "@/lib/server";
import { journalKinds, validateJournal } from "@/lib/journal-validation";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
function handleError(error: unknown) {
  const cause = error && typeof error === "object" && "cause" in error ? error.cause : error;
  if (cause && typeof cause === "object" && "code" in cause && cause.code === "42P01") return NextResponse.json({ error: "Journal is unavailable until the database migration is applied.", code: "JOURNAL_NOT_READY" }, { status: 503, headers });
  return apiError(error);
}
export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const kind = choice(new URL(request.url).searchParams.get("kind"), [...journalKinds], "journal type");
    const rows = await db.select().from(journalEntries).where(and(eq(journalEntries.userId,user.id),eq(journalEntries.kind,kind))).orderBy(desc(journalEntries.date),desc(journalEntries.createdAt),desc(journalEntries.id)).limit(201);
    return NextResponse.json({ entries: rows.slice(0,200), hasMore: rows.length > 200 }, { headers });
  } catch (error) { return handleError(error); }
}
export async function POST(request: Request) {
  try { checkOrigin(request); const user = await requireUser(); const values = validateJournal(await request.json()); const [entry] = await db.insert(journalEntries).values({...values,userId:user.id}).returning(); return NextResponse.json({entry}, {status:201,headers}); }
  catch (error) { return handleError(error); }
}
export async function PATCH(request: Request) {
  try {
    checkOrigin(request); const user = await requireUser(); const body = await request.json();
    const id = text(body?.id, "Record ID", 36);
    if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id)) throw new ApiError("Invalid record ID.");
    const values = validateJournal(body);
    const updated = await db.update(journalEntries).set(values).where(and(eq(journalEntries.id,id),eq(journalEntries.userId,user.id),eq(journalEntries.kind,values.kind))).returning();
    if (!updated.length) throw new ApiError("This entry could not be found.",404);
    return NextResponse.json({entry:updated[0]}, {headers});
  } catch (error) { return handleError(error); }
}
export async function DELETE(request: Request) {
  try {
    checkOrigin(request); const user = await requireUser(); const body = await request.json(); const id = text(body?.id,"Record ID",36);
    if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id)) throw new ApiError("Invalid record ID.");
    const deleted = await db.delete(journalEntries).where(and(eq(journalEntries.id,id),eq(journalEntries.userId,user.id))).returning({id:journalEntries.id});
    if (!deleted.length) throw new ApiError("This entry could not be found.",404);
    return NextResponse.json({ok:true}, {headers});
  } catch (error) { return handleError(error); }
}
