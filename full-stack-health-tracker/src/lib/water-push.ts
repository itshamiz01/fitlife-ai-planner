import { inReminderWindow } from "./hydration/reminder-window";
/** Strict endpoint allowlist prevents users from making the server send to arbitrary URLs. */
export function validPushEndpoint(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && !url.username && !url.password && !url.port && !url.hash && (host === "fcm.googleapis.com" || host === "updates.push.services.mozilla.com" || host.endsWith(".push.apple.com") || host.endsWith(".notify.windows.com"));
  } catch { return false; }
}
export function validPushKey(value: unknown, length: number): value is string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) return false;
  try { return Buffer.from(value, "base64url").length === length; } catch { return false; }
}
export function validTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 100) return false;
  try { new Intl.DateTimeFormat("en", { timeZone: value }); return true; } catch { return false; }
}
export function isReminderTime(now: Date, timeZone: string, start = 480, end = 1260) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const hour = Number(parts.find(part => part.type === "hour")?.value);
  const minute = Number(parts.find(part => part.type === "minute")?.value);
  return inReminderWindow(hour * 60 + minute, start, end);
}
export function pushMessage(name: string) {
  const first = name.trim().split(/\s+/)[0]?.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 40) || "there";
  return { title: `Hey ${first}, it's your water time 💧`, body: "Take a water break if you need one. Follow your healthcare professional's fluid advice.", url: "/?view=water" };
}
