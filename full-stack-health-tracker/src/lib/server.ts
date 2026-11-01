import { randomBytes, createHash, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { and, eq, gt, desc, asc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { users, sessions, meals, workouts, waterLogs, weightLogs } from "@/db/schema";
import type { Profile, DashboardData } from "./types";
import { buildMealPlan, buildWorkoutPlan, getBudgetInfo } from "./planner";

const scrypt = promisify(scryptCallback);
export const SESSION_COOKIE = "wellnest_session_v3";
const LEGACY_COOKIES = ["wellnest_session_v2", "wellnest_session"];
export class ApiError extends Error {
  constructor(message: string, public status = 400, public code = status === 401 ? "SESSION_EXPIRED" : "VALIDATION_ERROR", public retryAfter?: number) { super(message); }
}
export function apiError(error: unknown) {
  if (error instanceof ApiError) return NextResponse.json({ error: error.message, code: error.code, ...(error.retryAfter ? { retryAfter: error.retryAfter } : {}) }, { status: error.status, headers: { "Cache-Control": "no-store", ...(error.retryAfter ? { "Retry-After": String(error.retryAfter) } : {}) } });
  if (error instanceof SyntaxError) return NextResponse.json({ error: "The request wasn't valid. Please try again.", code: "INVALID_REQUEST" }, { status: 400 });
  const cause = error && typeof error === "object" && "cause" in error ? error.cause : error;
  if (cause && typeof cause === "object" && "code" in cause && cause.code === "23505") return NextResponse.json({ error: "This email already has an account. Sign in instead, or use your recovery key to reset your password.", code: "EMAIL_EXISTS" }, { status: 409 });
  console.error("Fit Life Bro API:", error);
  return NextResponse.json({ error: "Something went wrong on our side. Please try again in a moment.", code: "SERVER_ERROR" }, { status: 500 });
}
export function publicProfile(user: typeof users.$inferSelect): Profile {
  const { passwordHash: _password, recoveryKeyHash, createdAt: _created, ...profile } = user;
  return { ...profile, hasRecoveryKey: Boolean(recoveryKeyHash) };
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64) as Buffer;
  return `scrypt-v1$${salt}$${hash.toString("hex")}`;
}
export async function verifyPassword(password: string, stored: string) {
  const modern = stored.startsWith("scrypt-v1$");
  const [salt, encoded] = modern ? stored.slice(10).split("$") : stored.split(":");
  if (!salt || !/^[a-f0-9]{32}$/i.test(salt) || !encoded || !/^[a-f0-9]{128}$/i.test(encoded)) return false;
  const expected = Buffer.from(encoded, "hex");
  const matches = async (candidate: string) => { const hash = await scrypt(candidate, salt, 64) as Buffer; return timingSafeEqual(hash, expected); };
  if (await matches(password)) return true;
  // Earlier accounts were created with trimmed passwords. Preserve their access
  // without changing the exact-password behavior of newly created accounts.
  return !modern && password !== password.trim() ? matches(password.trim()) : false;
}
export function isSecureRequest(request: Request): boolean {
  const url = new URL(request.url);
  if (url.protocol === "https:" || request.headers.get("x-forwarded-proto")?.split(",")[0].trim().toLowerCase() === "https") return true;
  const hosts = [request.headers.get("x-forwarded-host"), request.headers.get("host"), url.host].filter((value): value is string => Boolean(value)).map(value => value.split(",")[0].trim().toLowerCase());
  // Some TLS-terminating preview proxies overwrite x-forwarded-proto with
  // their internal HTTP hop. Same-origin browser URLs still identify HTTPS.
  for (const name of ["origin", "referer"]) {
    const value = request.headers.get(name);
    if (!value) continue;
    try { const source = new URL(value); if (source.protocol === "https:" && hosts.includes(source.host.toLowerCase())) return true; } catch { /* Ignore malformed hints. */ }
  }
  // Public production hosts must always use Secure cookies, even when a
  // reverse proxy strips transport headers. Local HTTP remains testable.
  return process.env.NODE_ENV === "production" && hosts.some(host => {
    try {
      const hostname = new URL(`http://${host}`).hostname;
      const local = /(^localhost$|\.localhost$|\.local$|\.internal$|^0\.0\.0\.0$|^127\.|^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\.|^\[?::1\]?$)/i.test(hostname);
      return hostname.includes(".") && !local;
    } catch { return false; }
  });
}
export async function createSession(userId: string, request: Request, remember = true) {
  const token = randomBytes(32).toString("hex");
  const seconds = (remember ? 30 : 1) * 86400;
  await db.insert(sessions).values({ id: createHash("sha256").update(token).digest("hex"), userId, expiresAt: new Date(Date.now() + seconds * 1000) });
  const secure = isSecureRequest(request);
  // HTTPS previews can be embedded cross-site. CHIPS keeps these sessions
  // private to the embedding site without relying on third-party cookies.
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, secure, sameSite: secure ? "none" : "lax", partitioned: secure, path: "/", priority: "high", ...(remember ? { maxAge: seconds } : {}) });
}
export async function sessionToken() {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value || LEGACY_COOKIES.map(name => store.get(name)?.value).find(Boolean);
}
export async function hasSessionCookie() { return Boolean(await sessionToken()); }
export async function currentUser() {
  const token = await sessionToken();
  if (!token || !/^[a-f0-9]{64}$/i.test(token)) return null;
  const [record] = await db.select({ user: users }).from(sessions).innerJoin(users, eq(users.id, sessions.userId)).where(and(eq(sessions.id, createHash("sha256").update(token).digest("hex")), gt(sessions.expiresAt, new Date()))).limit(1);
  return record?.user || null;
}
export async function requireUser() { const user = await currentUser(); if (!user) throw new ApiError("Your session has expired. Please sign in again to keep your progress private.", 401, "SESSION_EXPIRED"); return user; }
export async function endSession(request: Request) {
  const store = await cookies();
  const tokens = [store.get(SESSION_COOKIE)?.value, ...LEGACY_COOKIES.map(name => store.get(name)?.value)].filter((value): value is string => Boolean(value));
  if (tokens.length) await db.delete(sessions).where(inArray(sessions.id, tokens.map(token => createHash("sha256").update(token).digest("hex"))));
  const secure = isSecureRequest(request);
  store.set(SESSION_COOKIE, "", { httpOnly: true, secure, sameSite: secure ? "none" : "lax", partitioned: secure, path: "/", maxAge: 0, expires: new Date(0) });
  for (const name of LEGACY_COOKIES) store.set(name, "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0, expires: new Date(0) });
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) { if (request.headers.get("sec-fetch-site") === "cross-site") throw new ApiError("Open Fit Life Bro directly to make this change.", 403, "ORIGIN_BLOCKED"); return; }
  let parsed: URL;
  try { parsed = new URL(origin); } catch { throw new ApiError("This browser context cannot sign in. Open Fit Life Bro in a new tab and try again.", 403, "ORIGIN_BLOCKED"); }
  const hosts = [new URL(request.url).host, request.headers.get("host"), request.headers.get("x-forwarded-host")].filter((value): value is string => Boolean(value)).map(value => value.split(",")[0].trim().toLowerCase());
  if (!["https:", "http:"].includes(parsed.protocol) || !hosts.includes(parsed.host.toLowerCase())) throw new ApiError("This request came from a different site. Open Fit Life Bro directly and try again.", 403, "ORIGIN_BLOCKED");
}
export function text(value: unknown, label: string, max = 200, required = true) {
  const result = typeof value === "string" ? value.trim() : "";
  if (required && !result) throw new ApiError(`${label} is required.`);
  if (result.length > max) throw new ApiError(`${label} is too long.`);
  return result;
}
export function number(value: unknown, label: string, min: number, max: number) {
  const result = typeof value === "number" || typeof value === "string" ? Number(value) : NaN;
  if (value === "" || value == null || !Number.isFinite(result) || result < min || result > max) throw new ApiError(`${label} must be between ${min} and ${max}.`);
  return result;
}
export function choice(value: unknown, choices: string[], label: string) {
  if (typeof value !== "string" || !choices.includes(value)) throw new ApiError(`Choose a valid ${label}.`);
  return value;
}
export function validDate(value: unknown) {
  const date = text(value, "Date", 10);
  const parsed = new Date(date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date || date > new Date().toISOString().slice(0, 10) || date < "1900-01-01") throw new ApiError("Choose a valid date that is not in the future.");
  return date;
}
export function validTime(value: unknown) { const time = text(value, "Time", 5); if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new ApiError("Choose a valid time."); return time; }
export async function getDashboardData(userId: string): Promise<DashboardData> {
  const [[user], userMeals, userWorkouts, water, weights] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)).limit(1),
    db.select().from(meals).where(eq(meals.userId, userId)).orderBy(asc(meals.day), asc(meals.time)),
    db.select().from(workouts).where(eq(workouts.userId, userId)).orderBy(asc(workouts.day), asc(workouts.time)),
    db.select().from(waterLogs).where(eq(waterLogs.userId, userId)).orderBy(desc(waterLogs.date), desc(waterLogs.time)),
    db.select().from(weightLogs).where(eq(weightLogs.userId, userId)).orderBy(desc(weightLogs.date), desc(weightLogs.createdAt)),
  ]);
  if (!user) throw new ApiError("Account not found.", 404);
  return { planning: getBudgetInfo(publicProfile(user), userMeals), syncedAt: new Date().toISOString(), user: publicProfile(user), meals: userMeals, workouts: userWorkouts, waterLogs: water.map(log => ({ ...log, createdAt: log.createdAt.toISOString() })), weightLogs: weights.map(log => ({ ...log, createdAt: log.createdAt.toISOString() })) };
}
export async function createDemo() {
  return db.transaction(async tx => {
    const [user] = await tx.insert(users).values({ activityTarget: 30 }).returning();
    const profile = publicProfile(user);
    const plan = buildMealPlan(profile, true);
    if (plan.length) await tx.insert(meals).values(plan);
    await tx.insert(workouts).values(buildWorkoutPlan(profile, true));
    const water = [];
    for (let offset = 6; offset >= 0; offset--) {
      const date = new Date(); date.setDate(date.getDate() - offset);
      const glasses = offset === 0 ? 5 : 6 + (offset % 5);
      for (let i = 0; i < glasses; i++) water.push({ userId: user.id, date: date.toISOString().slice(0, 10), time: `${String(7 + i).padStart(2, "0")}:30`, amount: 250 });
    }
    await tx.insert(waterLogs).values(water);
    const weights = Array.from({ length: 8 }, (_, index) => {
      const date = new Date(); date.setDate(date.getDate() - (7 - index) * 4);
      return { userId: user.id, weight: Math.round((80 - index * .5) * 10) / 10, date: date.toISOString().slice(0, 10), note: index === 7 ? "Feeling stronger and more energized!" : index === 0 ? "The beginning of a healthier routine" : "Morning check-in" };
    });
    await tx.insert(weightLogs).values(weights);
    return user;
  });
}
