"use client";
import { useEffect, useState } from "react";
import { authJson } from "@/lib/auth-client";
import { Button } from "./ui";

function applicationKey(value: string) {
  const base64 = (value + "=".repeat((4 - value.length % 4) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), char => char.charCodeAt(0));
}
export default function WaterPushSettings({ enabled }: { enabled: boolean }) {
  const [config, setConfig] = useState<{ configured: boolean; publicKey: string | null } | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [registered, setRegistered] = useState<boolean | null>(null);
  const [savedZone, setSavedZone] = useState<string | null>(null);
  const [nextDue, setNextDue] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const result = await authJson<{ configured: boolean; publicKey: string | null }>("/api/water-push");
        if (!active) return;
        setConfig(result);
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) { setRegistered(false); return; }
        const registration = await navigator.serviceWorker.getRegistration("/");
        const subscription = await registration?.pushManager.getSubscription();
        if (!subscription) { if (active) setRegistered(false); return; }
        const status = await authJson<{ registered: boolean; timeZone: string | null; nextDue: string | null }>("/api/water-push", { method: "POST", body: JSON.stringify({ action: "status", endpoint: subscription.endpoint }) });
        if (active) { setRegistered(status.registered); setSavedZone(status.timeZone); setNextDue(status.nextDue); }
      } catch (error) { if (active) setMessage(error instanceof Error ? error.message : "Could not check closed-app reminders."); }
    })();
    return () => { active = false; };
  }, []);
  async function enable() {
    if (busy || !config?.publicKey) return;
    if (!enabled) { setMessage("Turn on water reminders above first."); return; }
    if (!window.isSecureContext || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) { setMessage("This browser or context does not support Web Push. On iPhone, add the app to your Home Screen and open it there."); return; }
    setBusy(true); setMessage("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setMessage("Notification permission was not granted. In-app reminders still work while the app is open."); return; }
      await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing?.options.applicationServerKey) {
        const oldKey = new Uint8Array(existing.options.applicationServerKey);
        const newKey = applicationKey(config.publicKey);
        if (oldKey.length !== newKey.length || oldKey.some((value, index) => value !== newKey[index])) throw new Error("This device uses an older push key. Disable closed-app reminders on this device, then enable them again.");
      }
      const subscription = existing || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationKey(config.publicKey) });
      await authJson("/api/water-push", { method: "POST", body: JSON.stringify({ subscription: subscription.toJSON(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }) });
      setRegistered(true); setSavedZone(Intl.DateTimeFormat().resolvedOptions().timeZone); setNextDue(null);
      setMessage("This device is registered for closed-app reminders. Delivery also depends on the server scheduler, device connectivity and browser settings.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not enable closed-app reminders."); }
    finally { setBusy(false); }
  }
  async function disable() {
    if (busy || !("serviceWorker" in navigator)) return;
    setBusy(true); setMessage("");
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) { await authJson("/api/water-push", { method: "DELETE", body: JSON.stringify({ endpoint: subscription.endpoint }) }); await subscription.unsubscribe(); }
      setRegistered(false); setNextDue(null); setSavedZone(null);
      setMessage("Closed-app reminders are disabled on this browser. Other devices are unaffected.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not disable closed-app reminders. Reconnect and try again."); }
    finally { setBusy(false); }
  }
  async function disableAll() {
    if (busy || !window.confirm("Disable closed-app water notifications on all devices for this account?")) return;
    setBusy(true); setMessage("");
    try {
      await authJson("/api/water-push", { method: "DELETE", body: JSON.stringify({ all: true }) });
      setRegistered(false); setNextDue(null); setSavedZone(null);
      setMessage("Closed-app reminders are disabled for all devices on this account. An already queued notification may still arrive.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not disable reminders on all devices."); }
    finally { setBusy(false); }
  }
  return <div className="water-push-settings"><h3>Closed-app notifications</h3><p>Opt in on each device. Your first name will appear on the lock screen. Uses your existing reminder interval and sends between 8 AM and 9 PM in your device’s time zone.</p>{config && !config.configured && <p>Closed-app notifications are not configured on this server yet. In-app reminders remain available.</p>}{registered !== null && <p><strong>This device:</strong> {registered ? enabled ? "Registered (delivery depends on server and browser)" : "Registered, but water reminders are paused" : "Not registered to this account"}{savedZone ? ` · Time zone: ${savedZone}` : ""}{nextDue && enabled ? ` · Next eligible check after ${new Date(nextDue).toLocaleString()}` : ""}</p>}{savedZone && savedZone !== Intl.DateTimeFormat().resolvedOptions().timeZone && <p>Your device time zone changed. Select Enable on this device to update it.</p>}<div className="reminder-buttons"><Button variant="secondary" disabled={!config?.configured || busy} onClick={() => void enable()}>{busy ? "Please wait…" : "Enable on this device"}</Button><button type="button" className="text-link" disabled={busy} onClick={() => void disable()}>Disable on this device</button><button type="button" className="text-link" disabled={busy} onClick={() => void disableAll()}>Disable on all devices</button></div><p>Notifications may continue after sign-out unless disabled; turn them off on shared devices. A running server scheduler is required, and delivery can be delayed or blocked by the operating system, connectivity, permissions, or server availability. iPhone and iPad require a compatible browser and an app installed to the Home Screen.</p>{message && <p role="status" aria-live="polite">{message}</p>}</div>;
}
