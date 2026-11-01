import type { DashboardData, Profile } from "./types";

export type AuthMode = "sign-in" | "sign-up" | "recover";
export type AuthResult = DashboardData & { recoveryKey?: string };
export class AuthRequestError extends Error {
  constructor(message: string, public code = "REQUEST_FAILED", public status = 0, public retryAfter?: number, public recoveryKey?: string) { super(message); this.name = "AuthRequestError"; }
}
export async function authJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try { response = await fetch(url, { ...options, credentials: "include", cache: "no-store", headers: { "Content-Type": "application/json", ...options.headers } }); }
  catch { throw new AuthRequestError("We couldn't connect. Check your connection and try again.", "NETWORK_ERROR"); }
  let result;
  try { result = await response.json(); }
  catch { throw new AuthRequestError("The server returned an unexpected response. Please try again.", "INVALID_RESPONSE", response.status); }
  if (!response.ok) throw new AuthRequestError(result.error || "We couldn't complete that request. Please try again.", result.code, response.status, result.retryAfter);
  return result as T;
}
export async function submitAuthentication(action: "sign-in" | "sign-up", values: Record<string, unknown>): Promise<AuthResult> {
  const result = await authJson<AuthResult>("/api/auth", { method: "POST", body: JSON.stringify({ action, ...values }) });
  const session = await authJson<{ user: Profile | null }>("/api/auth");
  if (!session.user || session.user.id !== result.user.id || session.user.isDemo) {
    throw new AuthRequestError("Your browser didn't save the sign-in cookie. Open Fit Life Bro in a new tab and sign in there, or allow cookies for this site. Your account has not been deleted.", "SESSION_COOKIE_BLOCKED", 0, undefined, result.recoveryKey);
  }
  return result;
}
