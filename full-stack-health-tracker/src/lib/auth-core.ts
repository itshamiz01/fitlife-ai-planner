import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { authFailures } from "@/db/schema";
import { ApiError, hashPassword, text } from "./server";

const MAX_FAILURES = 10;
const WINDOW_MS = 15 * 60 * 1000;
type AttemptKind = "sign-in" | "recover" | "account";
const attemptKey = (kind: AttemptKind, email: string) => createHash("sha256").update(`${kind}:${email.toLowerCase()}`).digest("hex");
export const dummyPasswordHash = hashPassword(randomBytes(32).toString("hex"));
export async function assertAuthAllowed(kind: AttemptKind, email: string) {
  const [attempt] = await db.select().from(authFailures).where(eq(authFailures.key, attemptKey(kind, email))).limit(1);
  if (attempt && attempt.expiresAt.getTime() > Date.now() && attempt.failures >= MAX_FAILURES) {
    const seconds = Math.max(1, Math.ceil((attempt.expiresAt.getTime() - Date.now()) / 1000));
    throw new ApiError(`Too many unsuccessful attempts for this account. Try again in ${Math.ceil(seconds / 60)} minute${seconds > 60 ? "s" : ""}, or use your recovery key.`, 429, "AUTH_RATE_LIMITED", seconds);
  }
}
export async function recordAuthFailure(kind: AttemptKind, email: string) {
  await db.insert(authFailures).values({ key: attemptKey(kind, email), failures: 1, expiresAt: new Date(Date.now() + WINDOW_MS) }).onConflictDoUpdate({ target: authFailures.key, set: {
    failures: sql`case when ${authFailures.expiresAt} <= now() then 1 else ${authFailures.failures} + 1 end`,
    expiresAt: sql`case when ${authFailures.expiresAt} <= now() then now() + interval '15 minutes' else ${authFailures.expiresAt} end`,
  } });
}
export async function clearAuthFailures(email: string, kind?: AttemptKind) {
  await db.delete(authFailures).where(kind ? eq(authFailures.key, attemptKey(kind, email)) : inArray(authFailures.key, ["sign-in", "recover", "account"].map(value => attemptKey(value as AttemptKind, email))));
}
export async function readAuthBody(request: Request): Promise<Record<string, unknown>> {
  const value: unknown = await request.json();
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ApiError("Please submit a valid sign-in form.", 400, "INVALID_REQUEST");
  return value as Record<string, unknown>;
}
export function readEmail(value: unknown) {
  const email = text(value, "Email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError("Enter a valid email address, like you@example.com.", 400, "INVALID_EMAIL");
  return email;
}
export function readPassword(value: unknown, creating = false, label = "Password") {
  if (typeof value !== "string" || !value.length) throw new ApiError(`Enter your ${label.toLowerCase()}.`, 400, "PASSWORD_REQUIRED");
  if (value.length > 128) throw new ApiError(`${label} cannot be longer than 128 characters.`, 400, "PASSWORD_TOO_LONG");
  if (creating && (value.length < 8 || !value.trim())) throw new ApiError("Choose a password with at least 8 characters, not just spaces.", 400, "PASSWORD_TOO_SHORT");
  return value;
}
export function confirmPassword(password: string, confirmation: unknown, required = true) {
  if ((required || confirmation !== undefined) && confirmation !== password) throw new ApiError("The two passwords don't match. Please check both fields.", 400, "PASSWORD_MISMATCH");
}
export function makeRecoveryKey() {
  const value = randomBytes(20).toString("hex").toUpperCase();
  const recoveryKey = `FLB-${value.match(/.{5}/g)!.join("-")}`;
  return { recoveryKey, recoveryKeyHash: recoveryHash(recoveryKey) };
}
function recoveryHash(value: string) { return createHash("sha256").update(value.replace(/[\s-]/g, "").toUpperCase()).digest("hex"); }
export function matchesRecoveryKey(value: unknown, expected: string | null) {
  const normalized = typeof value === "string" && value.length <= 100 ? value.replace(/[\s-]/g, "").toUpperCase() : "";
  const hash = recoveryHash(normalized);
  const stored = expected && /^[a-f0-9]{64}$/i.test(expected) ? expected : "0".repeat(64);
  const equal = timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(stored, "hex"));
  return /^(?:WN|FLB)[A-F0-9]{40}$/.test(normalized) && Boolean(expected) && equal;
}
