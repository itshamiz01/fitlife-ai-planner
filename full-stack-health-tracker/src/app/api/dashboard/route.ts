import { NextResponse } from "next/server";
import { currentUser, hasSessionCookie, createDemo, createSession, endSession, getDashboardData, apiError, ApiError } from "@/lib/server";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    let user = await currentUser();
    if (!user && await hasSessionCookie()) { await endSession(request); throw new ApiError("Your session has expired. Sign in again to return to your saved account.", 401, "SESSION_EXPIRED"); }
    if (!user) { user = await createDemo(); await createSession(user.id, request); }
    return NextResponse.json(await getDashboardData(user.id), { headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } });
  } catch (error) { return apiError(error); }
}
