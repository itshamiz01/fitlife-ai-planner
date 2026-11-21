"use client";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ArrowLeft, ArrowUpRight, Check, Droplets, Footprints, Heart, Leaf, ShieldCheck, Utensils } from "lucide-react";
import { Brand } from "./ui";
import AuthForm from "./auth-form";
import { authJson, type AuthMode } from "@/lib/auth-client";
import { subscribeStatic, serverText, authReason } from "@/lib/browser-snapshot";
import type { Profile } from "@/lib/types";

export default function AuthScreen({ initialMode = "sign-in" }: { initialMode?: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [user, setUser] = useState<Profile | null>(null);
  const reason = useSyncExternalStore(subscribeStatic, authReason, serverText);
  const notice = reason === "signed-out" ? "You’re signed out securely. Your saved progress is right where you left it." : reason === "expired" ? "Your session has expired. Sign in again to return to your saved progress." : "";
  useEffect(() => {
    let active = true;
    void authJson<{ user: Profile | null }>("/api/auth").then(result => { if (active) setUser(result.user); }).catch(() => {});
    return () => { active = false; };
  }, []);
  return <main className="auth-page"><header className="auth-page-header"><Link href="/" aria-label="Fit Life Bro home"><Brand /></Link><Link className="auth-back-home" href="/"><ArrowLeft size={15} />Back to the demo</Link></header><div className="auth-page-grid"><section className="auth-story"><div className="auth-story-copy"><span className="auth-story-eyebrow"><Leaf size={14} />A LITTLE BETTER, EVERY DAY</span><h1>Your next healthy chapter<br />starts with a little care.</h1><p>A space for nourishing food, feel-good movement,<br className="desktop-only" /> and all the small habits that add up to you.</p><div className="auth-story-benefits"><span><Utensils size={17} />A personal seven-day meal plan</span><span><Footprints size={17} />Movement at your own pace</span><span><Droplets size={17} />Gentle nudges to stay hydrated</span></div></div><div className="auth-story-photo"><span className="auth-story-note"><Heart size={15} />Small steps. A healthier you.</span></div><div className="auth-story-footer"><span><ShieldCheck size={15} />Private by design.</span><span><Check size={15} />Made for your everyday.</span></div></section><section className="auth-page-form"><span className="auth-form-eyebrow">YOUR OWN LITTLE WELLNESS SPACE</span><h2>{mode === "sign-up" ? "A healthier chapter starts here." : mode === "recover" ? "A fresh start, safely." : "Welcome back. Feel right at home."}</h2><p className="auth-page-description">{mode === "sign-up" ? "Create your account and keep every little win." : mode === "recover" ? "Use your saved recovery key to choose a new password." : "Sign in to your plans, your progress, and your peace of mind."}</p>{notice && <div className="auth-page-notice" role="status"><ShieldCheck size={17} /><p>{notice}</p></div>}{user && !user.isDemo && <div className="auth-existing-session"><span>Already signed in as <strong>{user.name}</strong>.</span><Link href="/">Go to my dashboard<ArrowUpRight size={12} /></Link></div>}<AuthForm initialMode={initialMode} onModeChange={next => { setMode(next); void authJson<{ user: Profile | null }>("/api/auth").then(result => setUser(result.user)).catch(() => {}); }} onAuthenticated={(_result, action) => window.location.assign(action === "sign-up" ? "/?view=profile" : "/")} /></section></div><footer className="auth-page-footer"><span><Leaf size={12} />A little care. A lot of possibility.</span><span>General wellness guidance. Always at your pace.</span></footer></main>;
}
