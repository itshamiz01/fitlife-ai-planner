"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Bell, Check, Copy, Download, ExternalLink, Leaf, Link as LinkIcon, Share2, ShieldCheck, Smartphone } from "lucide-react";
import { Brand, Button } from "./ui";
import { useAppInstall } from "./app-install-provider";
import { authJson } from "@/lib/auth-client";
import type { Profile } from "@/lib/types";

type Phone = "android" | "ios";
export default function InstallationPage() {
  const { canInstall, isInstalled, isEmbedded, isInstalling, platform, requestInstall } = useAppInstall();
  const [chosenPhone, setChosenPhone] = useState<Phone | null>(null);
  const [installUrl, setInstallUrl] = useState("");
  const [shareAvailable, setShareAvailable] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [installMessage, setInstallMessage] = useState("");
  const [user, setUser] = useState<Profile | null>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const guideRef = useRef<HTMLElement>(null);
  const phone = chosenPhone || (platform === "ios" ? "ios" : "android");
  useEffect(() => {
    let active = true;
    setInstallUrl(new URL("/install", window.location.origin).toString());
    setShareAvailable(typeof navigator.share === "function");
    void authJson<{ user: Profile | null }>("/api/auth").then(result => { if (active) setUser(result.user); }).catch(() => {});
    return () => { active = false; };
  }, []);
  async function install() {
    const result = await requestInstall();
    setInstallMessage(result === "accepted" ? "Installation requested. Follow your browser’s confirmation, then look for the Fit Life Bro icon on your home screen." : result === "dismissed" ? "No problem. You can install later from your browser’s menu using the steps below." : "This browser isn’t offering a direct install prompt. Use the steps below in Safari or Chrome.");
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(installUrl); setShareMessage("Link copied. Send it to your phone and open it in Safari or Chrome."); }
    catch { linkRef.current?.focus(); linkRef.current?.select(); setShareMessage("The link is selected. Copy it and send it to your phone."); }
  }
  async function shareLink() {
    try { await navigator.share({ title: "Install Fit Life Bro", text: "A little wellness, right in your pocket.", url: installUrl }); }
    catch (error) { if (!(error instanceof Error) || error.name !== "AbortError") setShareMessage("Sharing isn’t available here. Copy the link instead."); }
  }
  function showSteps() { guideRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }); }
  function chooseWithKeys(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next: Phone = event.key === "Home" ? "android" : event.key === "End" ? "ios" : phone === "android" ? "ios" : "android";
    setChosenPhone(next); document.getElementById(`install-tab-${next}`)?.focus();
  }
  const steps = phone === "android" ? [
    { title: "Open Fit Life Bro in Chrome", text: "Open this app’s HTTPS link in Chrome on your Android phone, rather than inside an embedded preview." },
    { title: "Choose Install app or Add to Home screen", text: "Tap Chrome’s ⋮ menu (three dots), then look for Install app or Add to Home screen." },
    { title: "Install, open, and make yourself at home", text: "Confirm Install or Add. Tap the new Fit Life Bro icon on your home screen and sign in with your existing account." },
  ] : [
    { title: "Open Fit Life Bro in Safari", text: "Open this app’s HTTPS link in Safari on your iPhone or iPad." },
    { title: "Share → Add to Home Screen", text: "Tap Share (the square with an upward arrow), or Page Menu → Share, then scroll to Add to Home Screen. If it’s missing, choose Edit Actions to add it." },
    { title: "Open as Web App → Add", text: "Turn on Open as Web App if shown, then tap Add. Launch Fit Life Bro from your home screen and sign in with your existing account." },
  ];
  return <main className="installation-page"><header className="installation-header"><a href="/" aria-label="Fit Life Bro home"><Brand /></a><a href="/" className="installation-back"><ArrowLeft size={14} />Back to Fit Life Bro</a></header><section className="installation-hero"><div><span className="installation-eyebrow"><Leaf size={13} />YOUR EVERYDAY, ONE TAP AWAY</span><h1>A little wellness.<br />Right in your pocket.</h1><p>Add Fit Life Bro to your phone’s home screen.<br />No app store download needed.</p><div className="installation-primary-action">{isInstalled ? <div className="installation-installed" role="status"><Check size={17} />Fit Life Bro is installed and ready to go.</div> : isEmbedded ? <a href="/install" target="_blank" rel="noopener noreferrer" className="btn btn-primary">Open installation in a new tab<ExternalLink size={15} /></a> : canInstall ? <Button loading={isInstalling} onClick={() => void install()}><Download size={16} />Install Fit Life Bro</Button> : <Button onClick={showSteps}><Smartphone size={16} />{platform === "ios" ? "Show iPhone steps" : platform === "android" ? "Show Android steps" : "See phone installation steps"}</Button>}</div>{isEmbedded && <p className="installation-embedded-note">Installation isn’t available inside a preview frame. Open the app directly first.</p>}{installMessage && <p className="installation-action-status" role="status">{installMessage}</p>}</div><div className="installation-phone-art" aria-hidden="true"><span className="phone-art-speaker" /><img src="/icons/icon-192.png" alt="" width={70} height={70} /><strong>Fit Life Bro</strong><span>A little better, every day.</span><div className="phone-art-dots"><i /><i /><i /></div><span className="phone-art-home" /></div></section><div className="installation-grid"><div><section className="installation-card installation-guide" ref={guideRef} aria-labelledby="installation-guide-title"><div className="installation-card-heading"><span className="installation-small-icon"><Smartphone size={20} /></span><div><h2 id="installation-guide-title">A home for your healthy habits.</h2><p>Choose your phone. It only takes a moment.</p></div></div><div className="installation-tabs" role="tablist" aria-label="Phone installation instructions"><button id="install-tab-android" type="button" role="tab" aria-selected={phone === "android"} aria-controls="install-steps-panel" tabIndex={phone === "android" ? 0 : -1} className={phone === "android" ? "selected" : ""} onClick={() => setChosenPhone("android")} onKeyDown={chooseWithKeys}>Android · Chrome</button><button id="install-tab-ios" type="button" role="tab" aria-selected={phone === "ios"} aria-controls="install-steps-panel" tabIndex={phone === "ios" ? 0 : -1} className={phone === "ios" ? "selected" : ""} onClick={() => setChosenPhone("ios")} onKeyDown={chooseWithKeys}>iPhone · Safari</button></div><div role="tabpanel" id="install-steps-panel" aria-labelledby={`install-tab-${phone}`}><ol className="installation-steps">{steps.map((step, index) => <li key={`${phone}-${index}`}><span>{index + 1}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></li>)}</ol></div><div className="installation-guide-foot"><Check size={13} />Opens in its own app-style window after installation.</div></section><section className="installation-account-note"><ShieldCheck size={22} /><div><h2>{user && !user.isDemo ? "Your progress goes with you." : "Bring your progress along."}</h2><p>{user && !user.isDemo ? "Sign in with the same registered email and password in the installed app to load your saved health records." : "If you’ve been exploring the demo, create an account first to keep those records. Then sign in with that same email on your phone."}</p><a href={user && !user.isDemo ? "/login" : "/signup"}>{user && !user.isDemo ? "Sign in to my account" : "Save my demo to an account"}<ArrowUpRight size={13} /></a></div></section></div><aside className="installation-aside"><section className="installation-card installation-share"><div className="installation-card-heading"><span className="installation-small-icon"><LinkIcon size={19} /></span><div><h2>Open this link on your phone.</h2><p>A little link. Your whole wellness space.</p></div></div><label className="installation-link-label" htmlFor="wellnest-install-link">Your installation link</label><input ref={linkRef} id="wellnest-install-link" className="installation-link-input" value={installUrl} readOnly aria-label="Your Fit Life Bro installation link" placeholder="Your app’s installation link" onFocus={event => event.target.select()} /><div className="installation-share-actions"><Button variant="secondary" onClick={() => void copyLink()} disabled={!installUrl}><Copy size={14} />Copy link</Button>{shareAvailable && <Button variant="secondary" onClick={() => void shareLink()} disabled={!installUrl}><Share2 size={14} />Share link</Button>}</div>{shareMessage && <p className="installation-copy-status" role="status">{shareMessage}</p>}<p className="installation-hosting-note">Use a public HTTPS link on your phone, not localhost. Preview links may expire; a published deployment with a running server and database is needed for lasting access.</p></section><section className="installation-card installation-reminder-note"><span className="installation-reminder-icon"><Bell size={20} /></span><h2>A little note about reminders.</h2><p>Installation adds the app to your home screen. It doesn’t turn water reminders into background alarms.</p><p>Current reminders need Fit Life Bro to stay open. Your phone may pause timers when the app is in the background or the screen is locked.</p><span>Personal health tracking needs an internet connection.</span></section></aside></div><footer className="installation-footer"><span><Leaf size={12} />Made for your health. At your pace.</span><a href="/">Back to my wellness space<ArrowRight size={12} /></a></footer></main>;
}
