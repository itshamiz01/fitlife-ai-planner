import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { apiError, requireUser, checkOrigin, publicProfile, getDashboardData } from "@/lib/server";
import { archiveAndReplacePlan } from "@/lib/plan-archive";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    await db.transaction(async tx => {
      const [fresh] = await tx.select().from(users).where(eq(users.id, user.id)).for("update");
      const profile = publicProfile(fresh);
      await archiveAndReplacePlan(tx, profile, profile, "regenerate");
    });
    return NextResponse.json(await getDashboardData(user.id), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
