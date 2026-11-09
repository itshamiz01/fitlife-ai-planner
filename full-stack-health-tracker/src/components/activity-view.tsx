"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Footprints, Trash2 } from "lucide-react";
import { subscribeStatic, serverText } from "@/lib/browser-snapshot";
import { authJson } from "@/lib/auth-client";
import { Button, Field, SectionHeading } from "./ui";
import { PageHeading } from "./views";

type Entry = { id: string; date: string; activity: string; steps: number | null; distanceKm: number | null; durationMinutes: number | null; note: string };
type List = { entries: Entry[]; hasMore: boolean };
function localDate() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
export default function ActivityView() {
  const today = useSyncExternalStore(subscribeStatic, localDate, serverText);
  const [list, setList] = useState<List | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    void authJson<List>("/api/activity").then(result => { if (active) setList(result); }).catch(failure => { if (active) setError(failure instanceof Error ? failure.message : "Could not load activity."); });
    return () => { active = false; };
  }, [retry]);
  async function refresh() { setList(await authJson<List>("/api/activity")); }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setBusy(true); setError(""); setMessage("");
    try {
      await authJson("/api/activity", { method: "POST", body: JSON.stringify(values) });
      form.reset();
      try { await refresh(); setMessage("Activity saved as a manual entry."); }
      catch { setMessage("Activity saved, but the list could not refresh. Reload to see it."); }
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not save activity."); }
    finally { setBusy(false); }
  }
  async function remove(id: string) {
    if (busy || !window.confirm("Permanently delete this manual activity entry?")) return;
    setBusy(true); setError(""); setMessage("");
    try { await authJson("/api/activity", { method: "DELETE", body: JSON.stringify({id}) }); setList(current => current ? { ...current, entries: current.entries.filter(entry => entry.id !== id) } : current); setMessage("Activity entry deleted."); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Could not delete activity."); }
    finally { setBusy(false); }
  }
  return <><PageHeading eyebrow="MOVEMENT YOU RECORD" title="Your activity journal." description="Add your own walking, running or cycling records. No automatic steps or calorie burn are assumed." /><div className="settings-grid"><section className="panel account-settings"><SectionHeading title="Add a manual entry"><span className="mini-icon green"><Footprints size={18} /></span></SectionHeading><form onSubmit={save} className="form-grid"><Field label="Date"><input type="date" name="date" key={today} defaultValue={today} max={today || undefined} required /></Field><Field label="Activity"><select name="activity"><option value="walking">Walking</option><option value="running">Running</option><option value="cycling">Cycling</option><option value="other">Other</option></select></Field><Field label="Steps" hint="Optional; enter a whole number."><input type="number" name="steps" min="0" max="200000" step="1" /></Field><Field label="Distance (km)" hint="Optional; your measured or estimated distance."><input type="number" name="distanceKm" min="0" max="500" step="0.01" /></Field><Field label="Duration (minutes)" hint="Optional; enter whole minutes."><input type="number" name="durationMinutes" min="0" max="1440" step="1" /></Field><Field label="Note" className="full-span"><input name="note" maxLength={500} /></Field><p className="full-span">Enter at least one of steps, distance or duration. These are manual entries, not sensor readings or workout prescriptions.</p><Button type="submit" loading={busy} disabled={!list}>Save activity</Button></form>{message && <p role="status">{message}</p>}{error && <div role="alert"><p>{error}</p>{!list && <Button variant="secondary" onClick={() => {setError("");setRetry(value => value+1);}}>Try again</Button>}</div>}</section><section className="panel account-settings"><SectionHeading title="Your recent activity" subtitle="Manual entries only; newest first." />{!list ? <p>{error ? "Activity is unavailable. If the database has not been updated, an administrator must apply the activity migration." : "Loading activity…"}</p> : list.entries.length ? <div className="table-scroll"><table><thead><tr><th>Date & activity</th><th>Recorded</th><th>Note</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{list.entries.map(entry => <tr key={entry.id}><td>{entry.date}<br />{entry.activity}</td><td>{entry.steps !== null && <div>{entry.steps.toLocaleString()} steps</div>}{entry.distanceKm !== null && <div>{entry.distanceKm} km</div>}{entry.durationMinutes !== null && <div>{entry.durationMinutes} min</div>}</td><td>{entry.note}</td><td><button type="button" className="icon-button danger-text" disabled={busy} aria-label={`Delete ${entry.activity} on ${entry.date}`} onClick={() => void remove(entry.id)}><Trash2 size={15} /></button></td></tr>)}</tbody></table></div> : <p>No manual activity recorded yet.</p>}{list?.hasMore && <p>Showing the latest 200 entries. All saved entries are included in your JSON export.</p>}</section></div></>;
}
