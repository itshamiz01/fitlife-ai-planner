import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { groceryPurchases } from "@/db/schema";
import { ApiError, apiError, checkOrigin, requireUser } from "@/lib/server";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
function groceryError(error: unknown) {
  const cause = error && typeof error === "object" && "cause" in error ? error.cause : error;
  if (cause && typeof cause === "object" && "code" in cause && cause.code === "42P01") return NextResponse.json({ error: "Saved grocery marks are unavailable until the database migration has been applied.", code: "GROCERIES_NOT_READY" }, { status: 503, headers });
  return apiError(error);
}
export async function GET() {
  try {
    const user = await requireUser();
    const [entry] = await db.select({ listSignature: groceryPurchases.listSignature, purchasedKeys: groceryPurchases.purchasedKeys }).from(groceryPurchases).where(eq(groceryPurchases.userId, user.id));
    return NextResponse.json({ entry: entry ?? null }, { headers });
  } catch (error) { return groceryError(error); }
}
export async function PUT(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.listSignature !== "string" || body.listSignature.length < 1 || body.listSignature.length > 16000 || !Array.isArray(body.purchasedKeys) || body.purchasedKeys.length > 200 || body.purchasedKeys.some(key => typeof key !== "string" || key.length < 1 || key.length > 500)) throw new ApiError("Invalid grocery list state.");
    const purchasedKeys = [...new Set(body.purchasedKeys as string[])];
    const values = { userId: user.id, listSignature: body.listSignature, purchasedKeys, updatedAt: new Date() };
    await db.insert(groceryPurchases).values(values).onConflictDoUpdate({ target: groceryPurchases.userId, set: { listSignature: values.listSignature, purchasedKeys, updatedAt: values.updatedAt } });
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) { return groceryError(error); }
}
