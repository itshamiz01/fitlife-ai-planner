"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { BookOpen, Pencil, Trash2 } from "lucide-react";
import { authJson } from "@/lib/auth-client";
import { subscribeStatic, serverText } from "@/lib/browser-snapshot";
import type { JournalKind } from "@/lib/journal-validation";
import { Button, Field, SectionHeading } from "./ui";
import { PageHeading } from "./views";

type Entry = { id: string; date: string; title: string; kind: JournalKind; details: Record<string, number | null>; note: string };
type List = { entries: Entry[]; hasMore: boolean };
const configs = {
  food: { title: "Food diary", description: "Record what you actually ate. Nutrition figures are your own estimates; blank means unknown.", name: "Food or meal", fields: [{ key:"calories", label:"Calories (kcal)", max:10000, step:"0.1" },{ key:"protein", label:"Protein (g)", max:1000, step:"0.1" },{ key:"carbs", label:"Carbohydrates (g)", max:1000, step:"0.1" },{ key:"fat", label:"Fat (g)", max:1000, step:"0.1" }] },
  exercise: { title: "Exercise journal", description: "Record movement you actually performed, separately from your planned workouts.", name: "Exercise or session", fields: [{ key:"durationMinutes", label:"Duration (minutes)", max:1440, step:"1" },{ key:"sets", label:"Sets", max:100, step:"1" },{ key:"reps", label:"Total repetitions", max:10000, step:"1" },{ key:"loadKg", label:"Load (kg)", max:1000, step:"0.1" }] },
  measurement: { title: "Body measurements", description: "Record measurements manually in centimetres. These values are not a diagnosis.", name: "Measurement (e.g. waist)", fields: [{ key:"centimetres", label:"Measurement (cm)", max:400, step:"0.1" }] },
} as const;
function localDate() { const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
export default function JournalView({ kind }: { kind: JournalKind }) {
  const config = configs[kind];
  const today = useSyncExternalStore(subscribeStatic,localDate,serverText);
  const [list,setList] = useState<List | null>(null);
  const [editing,setEditing] = useState<Entry | null>(null);
  const [error,setError] = useState(""); const [message,setMessage] = useState("");
  const [busy,setBusy] = useState(false); const [retry,setRetry] = useState(0);
  const url = `/api/journal?kind=${kind}`;
  useEffect(() => {let active=true;void authJson<List>(url).then(result=>{if(active)setList(result);}).catch(failure=>{if(active)setError(failure instanceof Error?failure.message:"Could not load entries.");});return()=>{active=false;};},[url,retry]);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();if(busy)return;const form=event.currentTarget;const values=Object.fromEntries(new FormData(form));setBusy(true);setError("");setMessage("");
    try {
      await authJson("/api/journal",{method:editing?"PATCH":"POST",body:JSON.stringify({...values,kind,...(editing?{id:editing.id}:{})})});
      form.reset();setEditing(null);
      try {setList(await authJson<List>(url));setMessage("Entry saved.");} catch {setMessage("Entry saved, but the list could not refresh. Reload to see it.");}
    } catch(failure) {setError(failure instanceof Error?failure.message:"Could not save entry.");} finally {setBusy(false);}
  }
  async function remove(id:string) {
    if(busy||!window.confirm("Permanently delete this journal entry?"))return;setBusy(true);setError("");setMessage("");
    try {await authJson("/api/journal",{method:"DELETE",body:JSON.stringify({id})});setList(current=>current?{...current,entries:current.entries.filter(entry=>entry.id!==id)}:current);if(editing?.id===id)setEditing(null);setMessage("Entry deleted.");}
    catch(failure){setError(failure instanceof Error?failure.message:"Could not delete entry.");}finally{setBusy(false);}
  }
  return <><PageHeading eyebrow="YOUR ACTUAL RECORDS" title={config.title} description={config.description} /><div className="settings-grid"><section className="panel account-settings"><SectionHeading title={editing?"Edit entry":"Add an entry"}><span className="mini-icon green"><BookOpen size={17} /></span></SectionHeading><form key={`${editing?.id || "new"}:${today}`} className="form-grid" onSubmit={save}><Field label="Date"><input name="date" type="date" defaultValue={editing?.date || today} max={today || undefined} required /></Field><Field label={config.name}><input name="title" maxLength={100} defaultValue={editing?.title || ""} required /></Field>{config.fields.map(field=><Field label={field.label} key={field.key} hint={kind === "measurement" ? undefined : "Optional; leave blank if unknown."}><input type="number" name={field.key} min={kind === "measurement" ? "0.1" : "0"} max={field.max} step={field.step} defaultValue={editing?.details[field.key] ?? ""} required={kind === "measurement"} /></Field>)}<Field label="Note" className="full-span"><input name="note" maxLength={500} defaultValue={editing?.note || ""} /></Field><div className="full-span"><Button type="submit" loading={busy} disabled={!list}>{editing?"Save changes":"Save entry"}</Button>{editing && <Button type="button" variant="secondary" disabled={busy} onClick={()=>setEditing(null)}>Cancel edit</Button>}</div></form>{message && <p role="status">{message}</p>}{error && <div role="alert"><p>{error}</p>{!list && <Button variant="secondary" onClick={()=>{setError("");setRetry(value=>value+1);}}>Try again</Button>}</div>}</section><section className="panel account-settings"><SectionHeading title="Your recent entries" subtitle="Manually entered, newest first." />{!list ? <p>{error ? "Journal unavailable. An administrator may need to apply the database migration." : "Loading entries…"}</p> : list.entries.length ? <div className="table-scroll"><table><thead><tr><th>Date & name</th><th>Details</th><th>Note</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{list.entries.map(entry=><tr key={entry.id}><td>{entry.date}<br />{entry.title}</td><td>{config.fields.map(field=>entry.details[field.key] != null && <div key={field.key}>{field.label}: {entry.details[field.key]}</div>)}</td><td>{entry.note}</td><td><button className="icon-button" type="button" aria-label={`Edit ${entry.title}`} disabled={busy} onClick={()=>setEditing(entry)}><Pencil size={15} /></button><button className="icon-button danger-text" type="button" aria-label={`Delete ${entry.title}`} disabled={busy} onClick={()=>void remove(entry.id)}><Trash2 size={15} /></button></td></tr>)}</tbody></table></div> : <p>No entries yet.</p>}{list?.hasMore && <p>Showing the latest 200 entries. All entries are included in your JSON export.</p>}</section></div></>;
}
