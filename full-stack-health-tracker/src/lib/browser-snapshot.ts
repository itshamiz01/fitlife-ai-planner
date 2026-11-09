// Browser-only values are read after hydration without mutating state in an effect.
export function subscribeStatic() { return () => {}; }
export function serverText() { return ""; }
export function serverFalse() { return false; }
export function installUrl() { return new URL("/install", window.location.origin).toString(); }
export function canShare() { return typeof navigator.share === "function"; }
export function authReason() { return new URLSearchParams(window.location.search).get("reason") || ""; }
export function embedded() { try { return window.self !== window.top; } catch { return true; } }
export function platform() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ? "ios" : /Android/i.test(navigator.userAgent) ? "android" : "other";
}
export function notificationPermission() { return "Notification" in window ? Notification.permission : "default"; }
export function subscribeDisplayMode(callback: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");
  if (typeof media.addEventListener === "function") media.addEventListener("change", callback);
  else media.addListener(callback);
  return () => { if (typeof media.removeEventListener === "function") media.removeEventListener("change", callback); else media.removeListener(callback); };
}
export function displayMode() { return window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone); }
