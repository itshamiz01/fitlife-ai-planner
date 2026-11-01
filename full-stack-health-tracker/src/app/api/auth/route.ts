import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { ApiError, apiError, checkOrigin, choice, text, hashPassword, verifyPassword, currentUser, publicProfile, createDemo, createSession, endSession, getDashboardData } from "@/lib/server";
import { assertAuthAllowed, recordAuthFailure, clearAuthFailures, readAuthBody, readEmail, readPassword, confirmPassword, makeRecoveryKey, matchesRecoveryKey, dummyPasswordHash } from "@/lib/auth-core";

export const dynamic = "force-dynamic";
const privateHeaders = { "Cache-Control": "private, no-store", Vary: "Cookie" };
export async function GET() {
  try { const user = await currentUser(); return NextResponse.json({ user: user ? publicProfile(user) : null }, { headers: privateHeaders }); }
  catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const body = await readAuthBody(request);
    const action = choice(body.action, ["sign-in", "sign-up", "sign-out", "recover"], "action");
    if (action === "sign-out") { await endSession(request); return NextResponse.json({ ok: true }, { headers: privateHeaders }); }
    const email = readEmail(body.email);
    if (action === "recover") {
      const password = readPassword(body.newPassword, true, "New password");
      confirmPassword(password, body.confirmPassword);
      await assertAuthAllowed("recover", email);
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!user || !matchesRecoveryKey(body.recoveryKey, user.recoveryKeyHash)) {
        await recordAuthFailure("recover", email);
        throw new ApiError("The email and recovery key don't match, or this key has already been replaced. Check your saved key and try again.", 401, "INVALID_RECOVERY_KEY");
      }
      const next = makeRecoveryKey();
      const passwordHash = await hashPassword(password);
      await db.transaction(async tx => {
        const changed = await tx.update(users).set({ passwordHash, recoveryKeyHash: next.recoveryKeyHash }).where(and(eq(users.id, user.id), eq(users.recoveryKeyHash, user.recoveryKeyHash!))).returning({ id: users.id });
        if (!changed.length) throw new ApiError("That recovery key has already been used. Use your most recently saved key.", 401, "INVALID_RECOVERY_KEY");
        await tx.delete(sessions).where(eq(sessions.userId, user.id));
      });
      await clearAuthFailures(email);
      await endSession(request);
      return NextResponse.json({ ok: true, recoveryKey: next.recoveryKey, message: "Password reset. All previous sessions are signed out. Save your replacement recovery key, then sign in with your new password." }, { headers: privateHeaders });
    }
    const password = readPassword(body.password, action === "sign-up");
    if (body.remember !== undefined && typeof body.remember !== "boolean") throw new ApiError("Choose a valid remember-me preference.");
    const remember = body.remember !== false;
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    let user: typeof users.$inferSelect;
    let recoveryKey: string | undefined;
    if (action === "sign-in") {
      await assertAuthAllowed("sign-in", email);
      const valid = await verifyPassword(password, existing?.passwordHash || await dummyPasswordHash);
      if (!existing || !valid || existing.isDemo) {
        await recordAuthFailure("sign-in", email);
        throw new ApiError("The email or password is incorrect. New here? Create an account first. Alex Morgan is a demo profile, not a registered login.", 401, "INVALID_CREDENTIALS");
      }
      user = existing;
      await clearAuthFailures(email, "sign-in");
    } else {
      confirmPassword(password, body.confirmPassword, false);
      if (existing) throw new ApiError("This email already has an account. Sign in instead, or use your recovery key to reset your password.", 409, "EMAIL_EXISTS");
      const name = text(body.name, "Name", 80);
      const demo = await currentUser();
      const base = demo?.isDemo ? demo : await createDemo();
      const next = makeRecoveryKey();
      const passwordHash = await hashPassword(password);
      const [created] = await db.update(users).set({ email, name, passwordHash, recoveryKeyHash: next.recoveryKeyHash, isDemo: false }).where(and(eq(users.id, base.id), eq(users.isDemo, true))).returning();
      if (!created) throw new ApiError("This demo has already been saved to an account. Please sign in to continue.", 409, "ACCOUNT_ALREADY_CREATED");
      user = created;
      recoveryKey = next.recoveryKey;
    }
    await endSession(request);
    await createSession(user.id, request, remember);
    return NextResponse.json({ ...await getDashboardData(user.id), ...(recoveryKey ? { recoveryKey } : {}) }, { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}
