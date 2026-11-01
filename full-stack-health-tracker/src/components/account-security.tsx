"use client";
import { useState } from "react";
import { AlertCircle, Check, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { useWellnest } from "./app-context";
import { Button, SectionHeading } from "./ui";
import { PasswordField, RecoveryKeyCard } from "./auth-form";
import { authJson, AuthRequestError } from "@/lib/auth-client";

type SecurityAction = "change-password" | "recovery-key" | "sign-out-others";
export default function AccountSecurity() {
  const { data } = useWellnest();
  const [action, setAction] = useState<SecurityAction>("change-password");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [key, setKey] = useState("");
  const [hasKey, setHasKey] = useState(data.user.hasRecoveryKey);
  function changeAction(next: SecurityAction) { setAction(next); setError(""); setSuccess(""); setCurrentPassword(""); setPassword(""); setConfirmation(""); }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending) return; setError(""); setSuccess("");
    if (!currentPassword) { setError("Enter your current password to confirm this security change."); return; }
    if (action === "change-password" && (password.length < 8 || !password.trim())) { setError("Choose a new password with at least 8 characters, not just spaces."); return; }
    if (action === "change-password" && password !== confirmation) { setError("The new passwords don't match. Please check both fields."); return; }
    setPending(true);
    try {
      const result = await authJson<{ message: string; recoveryKey?: string }>("/api/account", { method: "PATCH", body: JSON.stringify({ action, currentPassword, newPassword: password, confirmPassword: confirmation }) });
      setCurrentPassword(""); setPassword(""); setConfirmation("");
      if (result.recoveryKey) { setKey(result.recoveryKey); setHasKey(true); }
      else {
        if (action === "change-password") { const session = await authJson<{ user: { id: string } | null }>("/api/auth"); if (session.user?.id !== data.user.id) throw new AuthRequestError("Your password was updated, but the browser couldn't keep the new session. Open /login in a new tab and sign in with your new password."); }
        setSuccess(result.message);
      }
    } catch (failure) { setError(failure instanceof Error ? failure.message : "We couldn't complete this security change. Please try again."); }
    finally { setPending(false); }
  }
  return <section className="panel account-security"><SectionHeading title="Sign-in & security" subtitle="A little extra peace of mind for your personal space."><span className="mini-icon green"><ShieldCheck size={18} /></span></SectionHeading>{key ? <RecoveryKeyCard recoveryKey={key} title="Your new recovery key is ready." description="Save this key somewhere private. Any previous key has been replaced. This is the only time we can show the new one." doneLabel="I’m all set" onDone={() => { setKey(""); setSuccess("Recovery key saved. Keep it somewhere private, away from your password."); }} /> : <><div className="security-key-status"><KeyRound size={15} /><span>{hasKey ? "Recovery key active" : "Recovery key not set up"}</span><span className={`badge ${hasKey ? "badge-green" : "badge-orange"}`}>{hasKey ? "Protected" : "Recommended"}</span></div><div className="security-tabs" role="tablist" aria-label="Account security"><button type="button" role="tab" aria-selected={action === "change-password"} className={action === "change-password" ? "selected" : ""} onClick={() => changeAction("change-password")} disabled={pending}>Change password</button><button type="button" role="tab" aria-selected={action === "recovery-key"} className={action === "recovery-key" ? "selected" : ""} onClick={() => changeAction("recovery-key")} disabled={pending}>Recovery key</button><button type="button" role="tab" aria-selected={action === "sign-out-others"} className={action === "sign-out-others" ? "selected" : ""} onClick={() => changeAction("sign-out-others")} disabled={pending}>Other devices</button></div>{error && <div className="auth-inline-error" role="alert"><AlertCircle size={17} /><p>{error}</p></div>}{success && <div className="auth-inline-success" role="status"><Check size={17} /><p>{success}</p></div>}<form onSubmit={save} noValidate><PasswordField name="currentPassword" label="Current password" value={currentPassword} onChange={setCurrentPassword} disabled={pending} />{action === "change-password" ? <div className="form-grid"><PasswordField name="newPassword" label="New password" value={password} onChange={setPassword} creating disabled={pending} /><PasswordField name="confirmPassword" label="Confirm new password" value={confirmation} onChange={setConfirmation} autoComplete="new-password" disabled={pending} /></div> : <p className="security-action-note">{action === "recovery-key" ? "Generate a private recovery key to reset your password if you forget it. Replacing a key makes the previous one stop working. Your current password is required." : "Sign out every other device connected to this account. This device stays signed in. Other devices will need your password to return."}</p>}<Button type="submit" loading={pending}><LockKeyhole size={14} />{action === "change-password" ? "Update my password" : action === "recovery-key" ? hasKey ? "Replace my recovery key" : "Create my recovery key" : "Sign out other devices"}</Button></form></>}</section>;
}
