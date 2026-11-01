"use client";
import { useEffect, useState } from "react";
import { ArchiveRestore } from "lucide-react";
import { authJson } from "@/lib/auth-client";
import { Button, SectionHeading } from "./ui";

type Archive = { id: string; reason: string; createdAt: string; mealCount: number; workoutCount: number; compatible: boolean };
type Archives = { archives: Archive[]; hasMore: boolean };
export default function PlanArchives() {
  const [data, setData] = useState<Archives | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    void authJson<Archives>("/api/plan/archives").then(result => { if (active) setData(result); }).catch(failure => { if (active) setError(failure instanceof Error ? failure.message : "Could not load archives."); });
    return () => { active = false; };
  }, [retry]);
  async function restore(archive: Archive) {
    if (busy || !archive.compatible || !window.confirm("Restore this plan? Your current meal and workout plans will be archived first. Saved checkmarks are plan markers, not dated logs.")) return;
    setBusy(true); setError("");
    try { await authJson("/api/plan/archives", { method: "POST", body: JSON.stringify({ id: archive.id }) }); window.location.reload(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Could not restore this plan."); setBusy(false); }
  }
  return <section className="panel account-settings"><SectionHeading title="Previous plans"><span className="mini-icon green"><ArchiveRestore size={17} /></span></SectionHeading><p>Restore an archived plan when its planning details match your current profile. Your current plan is archived first; the profile itself is not changed. Checkmarks are not dated logs.</p>{error && <div role="alert"><p>{error}</p>{!data && <Button variant="secondary" onClick={() => {setError("");setRetry(value => value+1);}}>Try again</Button>}</div>}{!data ? !error && <p>Loading previous plans…</p> : data.archives.length ? <div className="table-scroll"><table><thead><tr><th>Saved</th><th>Plan contents</th><th>Status</th><th>Action</th></tr></thead><tbody>{data.archives.map(archive => <tr key={archive.id}><td>{new Date(archive.createdAt).toLocaleString()}</td><td>{archive.mealCount} meals · {archive.workoutCount} activities</td><td>{archive.compatible ? "Matches profile" : "Profile changed"}</td><td><Button variant="secondary" disabled={!archive.compatible || busy} onClick={() => void restore(archive)}>Restore</Button></td></tr>)}</tbody></table></div> : <p>No previous plans yet.</p>}{data?.hasMore && <p>Showing the latest 100 plans. Your JSON export contains all archives.</p>}</section>;
}
