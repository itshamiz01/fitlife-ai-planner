"use client";
import { useState } from "react";
import { Download, ShieldCheck } from "lucide-react";
import { Button, SectionHeading } from "./ui";

export default function DataExport({ isDemo }: { isDemo: boolean }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function download() {
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/export", { method: "POST", cache: "no-store" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(typeof body?.error === "string" ? body.error : "Export failed. Please try again.");
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url; link.download = "fitlife-account-export.json";
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      const missing = [response.headers.get("X-Fitlife-Archives-Available") === "false" ? "plan archives" : "", response.headers.get("X-Fitlife-Activity-Available") === "false" ? "activity journal" : "", response.headers.get("X-Fitlife-Sleep-Available") === "false" ? "sleep journal" : "", response.headers.get("X-Fitlife-Journals-Available") === "false" ? "food, exercise and measurement journals" : "", response.headers.get("X-Fitlife-Groceries-Available") === "false" ? "grocery purchase marks" : ""].filter(Boolean);
      setMessage(missing.length ? `Your download started, but ${missing.join(" and ")} were unavailable. Database migrations may be needed. Store the file privately.` : "Your download has started. Store the file somewhere private.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Export failed. Please try again."); }
    finally { setBusy(false); }
  }
  return <section className="panel account-settings">
    <SectionHeading title="Download your data"><span className="mini-icon green"><ShieldCheck size={17} /></span></SectionHeading>
    <p>Download a JSON copy of your profile, current plans, archived plans, water, weight, manual activity, sleep, food, exercise and measurement records, grocery purchase marks, and coach messages. Passwords, recovery keys and sessions are excluded. This is a download, not an automatic backup; import is not available yet.</p>
    {isDemo && <p>This demo contains sample data as well as any changes you made.</p>}
    <p>This file contains sensitive health information. Keep it private and delete it from shared devices.</p>
    <Button variant="secondary" onClick={() => void download()} loading={busy}><Download size={15} />Download JSON</Button>
    {message && <p role="status" aria-live="polite">{message}</p>}
  </section>;
}
