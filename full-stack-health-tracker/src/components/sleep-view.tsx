"use client";
import { useEffect, useState } from "react";
import { Moon, Trash2 } from "lucide-react";
import { authJson } from "@/lib/auth-client";
import { Button, Field, SectionHeading } from "./ui";
import { PageHeading } from "./views";

type Entry = { id: string; startedAt: string; endedAt: string; quality: number | null; note: string };
type List = { entries: Entry[]; hasMore: boolean };
function parseLocal(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error("Choose valid start and end times.");
  const date = new Date(value);
  const formatted = Number.isFinite(date.getTime()) ? `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}T${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}` : "";
  if (formatted !== value) throw new Error("That local time does not exist. Please choose another time.");
  return date.toISOString();
}
export default function SleepView() {
  const [list, setList] = useState<List | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => { let active = true; void authJson<List>("/api/sleep").then(result => { if (active) setList(result); }).catch(failure => { if (active) setError(failure instanceof Error ? failure.message : "Could not load sleep entries."); }); return () => { active = false; }; }, [retry]);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = event.currentTarget, data = new FormData(form);
    setBusy(true); setError(""); setMessage("");
    try {
      const values = { startedAt: parseLocal(data.get("startedAt")), endedAt: parseLocal(data.get("endedAt")), quality: data.get("quality"), note: data.get("note") };
      await authJson("/api/sleep", { method: "POST", body: JSON.stringify(values) });
      form.reset();
      try { setList(await authJson<List>("/api/sleep")); setMessage("Sleep entry saved."); }
      catch { setMessage("Entry saved, but the list could not refresh. Reload to see it."); }
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not save sleep entry."); }
    finally { setBusy(false); }
  }
  async function remove(id: string) {
    if (busy || !window.confirm("Permanently delete this sleep entry?")) return;
    setBusy(true); setError(""); setMessage("");
    try { await authJson("/api/sleep", { method: "DELETE", body: JSON.stringify({id}) }); setList(current => current ? { ...current, entries: current.entries.filter(entry => entry.id !== id) } : current); setMessage("Sleep entry deleted."); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Could not delete sleep entry."); }
    finally { setBusy(false); }
  }
  return <><PageHeading eyebrow="REST, ON YOUR TERMS" title="Sleep & recovery journal." description="Record the time you spent in bed and how you felt. These are self-reported entries, not sleep-sensor readings." /><div className="settings-grid"><section className="panel account-settings"><SectionHeading title="Add a sleep entry"><span className="mini-icon green"><Moon size={18} /></span></SectionHeading><form className="form-grid" onSubmit={save}><Field label="Went to bed" hint="Use the local time on this device."><input type="datetime-local" name="startedAt" required /></Field><Field label="Got up"><input type="datetime-local" name="endedAt" required /></Field><Field label="How rested did you feel?" hint="Optional, your own rating."><select name="quality" defaultValue=""><option value="">Not rated</option>{[1,2,3,4,5].map(value => <option value={value} key={value}>{value} / 5</option>)}</select></Field><Field label="Note" className="full-span"><input name="note" maxLength={500} /></Field><p className="full-span">Times are stored as UTC and displayed in this device’s time zone. Repeated times when clocks change can be ambiguous. Time in bed is not necessarily time asleep.</p><Button type="submit" loading={busy} disabled={!list}>Save sleep entry</Button></form>{message && <p role="status">{message}</p>}{error && <div role="alert"><p>{error}</p>{!list && <Button variant="secondary" onClick={() => {setError("");setRetry(value => value+1);}}>Try again</Button>}</div>}</section><section className="panel account-settings"><SectionHeading title="Recent entries" subtitle="Self-reported, most recent first." />{!list ? <p>{error ? "Sleep journal is unavailable. An administrator may need to apply the database migration." : "Loading sleep entries…"}</p> : list.entries.length ? <div className="table-scroll"><table><thead><tr><th>Local time</th><th>Time in bed</th><th>Rating & note</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{list.entries.map(entry => {const minutes = Math.round((new Date(entry.endedAt).getTime()-new Date(entry.startedAt).getTime())/60000);return <tr key={entry.id}><td>{new Date(entry.startedAt).toLocaleString()}<br />to {new Date(entry.endedAt).toLocaleString()}</td><td>{Math.floor(minutes/60)} h {minutes%60} min</td><td>{entry.quality !== null ? `${entry.quality} / 5` : "Not rated"}{entry.note && <div>{entry.note}</div>}</td><td><button type="button" className="icon-button danger-text" disabled={busy} aria-label={`Delete sleep entry ending ${new Date(entry.endedAt).toLocaleString()}`} onClick={() => void remove(entry.id)}><Trash2 size={15} /></button></td></tr>;})}</tbody></table></div> : <p>No sleep entries recorded yet.</p>}{list?.hasMore && <p>Showing the latest 200 entries. All saved entries are included in your JSON export.</p>}</section></div></>;
}
