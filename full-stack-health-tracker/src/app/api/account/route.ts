import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { ApiError, apiError, requireUser, checkOrigin, choice, verifyPassword, hashPassword, createSession, sessionToken } from "@/lib/server";
import { readAuthBody, readPassword, confirmPassword, assertAuthAllowed, recordAuthFailure, clearAuthFailures, makeRecoveryKey } from "@/lib/auth-core";
export async function PATCH(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    if (user.isDemo || !user.email || !user.passwordHash) throw new ApiError("Create an account before setting up account security.", 403, "ACCOUNT_REQUIRED");
    const body = await readAuthBody(request);
    const action = choice(body.action, ["change-password", "recovery-key", "sign-out-others"], "security action");
    const currentPassword = readPassword(body.currentPassword, false, "Current password");
    await assertAuthAllowed("account", user.email);
    if (!(await verifyPassword(currentPassword, user.passwordHash))) { await recordAuthFailure("account", user.email); throw new ApiError("Your current password isn't correct. Please check it and try again.", 401, "CURRENT_PASSWORD_INVALID"); }
    await clearAuthFailures(user.email, "account");
    if (action === "sign-out-others") {
      const token = await sessionToken();
      const currentId = createHash("sha256").update(token!).digest("hex");
      const removed = await db.delete(sessions).where(and(eq(sessions.userId, user.id), ne(sessions.id, currentId))).returning({ id: sessions.id });
      return NextResponse.json({ ok: true, message: `${removed.length} other session${removed.length === 1 ? "" : "s"} signed out. This device stays signed in.` }, { headers: { "Cache-Control": "no-store" } });
    }
    if (action === "recovery-key") {
      const next = makeRecoveryKey();
      const changed = await db.update(users).set({ recoveryKeyHash: next.recoveryKeyHash }).where(and(eq(users.id, user.id), eq(users.passwordHash, user.passwordHash))).returning({ id: users.id });
      if (!changed.length) throw new ApiError("Your account changed in another window. Sign in again and retry.", 409, "ACCOUNT_CHANGED");
      return NextResponse.json({ ok: true, recoveryKey: next.recoveryKey, message: "Your new recovery key is ready. Any previous recovery key no longer works." }, { headers: { "Cache-Control": "no-store" } });
    }
    const password = readPassword(body.newPassword, true, "New password");
    confirmPassword(password, body.confirmPassword);
    if (await verifyPassword(password, user.passwordHash)) throw new ApiError("Choose a new password different from your current one.", 400, "PASSWORD_UNCHANGED");
    const passwordHash = await hashPassword(password);
    await db.transaction(async tx => {
      const changed = await tx.update(users).set({ passwordHash }).where(and(eq(users.id, user.id), eq(users.passwordHash, user.passwordHash!))).returning({ id: users.id });
      if (!changed.length) throw new ApiError("Your account changed in another window. Sign in again and retry.", 409, "ACCOUNT_CHANGED");
      await tx.delete(sessions).where(eq(sessions.userId, user.id));
    });
    await clearAuthFailures(user.email);
    await createSession(user.id, request);
    return NextResponse.json({ ok: true, message: "Password updated. Your other devices have been signed out; this device stays signed in." }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
