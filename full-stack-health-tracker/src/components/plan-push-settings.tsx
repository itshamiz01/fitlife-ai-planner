"use client";
import { useEffect, useState } from "react";
import { authJson } from "@/lib/auth-client";
import { Toggle } from "./ui";

type PlanPushState = { configured: boolean; mealRemindersEnabled: boolean; workoutRemindersEnabled: boolean };

export default function PlanPushSettings() {
  const [state, setState] = useState<PlanPushState | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const result = await authJson<PlanPushState>("/api/plan-push");
        if (active) setState(result);
      } catch (error) { if (active) setMessage(error instanceof Error ? error.message : "Could not load meal and workout notification settings."); }
    })();
    return () => { active = false; };
  }, []);
  async function save(patch: Partial<Pick<PlanPushState, "mealRemindersEnabled" | "workoutRemindersEnabled">>) {
    if (busy || !state) return;
    setBusy(true); setMessage("");
    try {
      const result = await authJson<PlanPushState>("/api/plan-push", { method: "POST", body: JSON.stringify(patch) });
      setState(result);
      setMessage("Saved. Meal and workout notifications use the same device registration as closed-app water reminders.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save notification settings."); }
    finally { setBusy(false); }
  }
  return <div className="water-push-settings"><h3>Meal and workout notifications</h3><p>Get a closed-app notification at each planned meal and workout time, on every device registered above. Items you have already checked off are skipped. If this device is not registered yet, use Enable on this device in the closed-app notifications section above first.</p>{state && !state.configured && <p>Closed-app notifications are not configured on this server yet.</p>}<div className="setting-toggle-row"><div><strong>Meal reminders</strong><p>{state?.mealRemindersEnabled ? "A nudge at each planned meal time." : "Meal notifications are off."}</p></div><Toggle checked={Boolean(state?.mealRemindersEnabled)} disabled={!state || busy} label="Enable meal notifications" onChange={() => { void save({ mealRemindersEnabled: !state?.mealRemindersEnabled }); }} /></div><div className="setting-toggle-row"><div><strong>Workout reminders</strong><p>{state?.workoutRemindersEnabled ? "A nudge at each planned workout time." : "Workout notifications are off."}</p></div><Toggle checked={Boolean(state?.workoutRemindersEnabled)} disabled={!state || busy} label="Enable workout notifications" onChange={() => { void save({ workoutRemindersEnabled: !state?.workoutRemindersEnabled }); }} /></div>{message && <p role="status" aria-live="polite">{message}</p>}</div>;
}
