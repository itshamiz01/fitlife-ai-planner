"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { LayoutDashboard, UserRound, Utensils, Dumbbell, Droplets, ChartNoAxesCombined, Settings2, ChevronDown, Bell, Menu, X, LogOut, ArrowUpRight, CircleHelp, Check, AlertCircle, ChevronRight, CalendarDays, Leaf, ShieldCheck, Sparkles, MessageCircle, CheckCircle2, WifiOff } from "lucide-react";
import { WellnestContext, type AppModal } from "./app-context";
import { Brand, Button, PlantIllustration } from "./ui";
import { DashboardView, MealsView, WorkoutsView, WaterView, ProgressView, ProfileView, SettingsView } from "./views";
import Dialogs from "./dialogs";
import CoachView from "./coach-view";
import InstallAppLink from "./install-app-link";
import type { DashboardData, View, Resource } from "@/lib/types";
import { todayIndex, todayKey } from "@/lib/types";
import { authJson, AuthRequestError, type AuthResult } from "@/lib/auth-client";
import type { Profile } from "@/lib/types";

const navItems = [
  { id: "dashboard" as View, label: "Overview", icon: LayoutDashboard },
  { id: "profile" as View, label: "My health profile", icon: UserRound },
  { id: "meals" as View, label: "Meal planner", icon: Utensils },
  { id: "workouts" as View, label: "My workouts", icon: Dumbbell },
  { id: "water" as View, label: "Water tracker", icon: Droplets },
  { id: "progress" as View, label: "My progress", icon: ChartNoAxesCombined },
  { id: "coach" as View, label: "Nivra coach", icon: Sparkles },
];
const titles: Record<View, string> = { dashboard: "Overview", profile: "My health profile", meals: "Meal planner", workouts: "My workouts", water: "Water tracker", progress: "My progress", settings: "Settings & preferences", coach: "Nivra coach" };

async function requestJson<T = DashboardData>(url: string, options?: RequestInit): Promise<T> {
  return authJson<T>(url, options);
}

export default function WellnestApp() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [selectedDay, setSelectedDay] = useState(todayIndex());
  const [modal, setModal] = useState<AppModal>(null);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const accountEpoch = useRef(0);
  const [accountRevision, setAccountRevision] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [reminderVisible, setReminderVisible] = useState(false);
  const [nextReminder, setNextReminder] = useState(Date.now() + 3600000);
  const [notificationPermission, setNotificationPermission] = useState("default");
  const started = useRef(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const notify = useCallback((message: string, type: "success" | "error" = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type }); toastTimer.current = setTimeout(() => setToast(null), 4600);
  }, []);
  const openModal = useCallback((value: AppModal) => { setModal(value); setAccountOpen(false); setNotificationsOpen(false); }, []);
  const closeModal = useCallback(() => setModal(null), []);
  const load = useCallback(async () => {
    setLoadError("");
    try {
      const result = await requestJson("/api/dashboard");
      const session = await authJson<{ user: Profile | null }>("/api/auth");
      if (session.user?.id !== result.user.id) throw new AuthRequestError("Your browser is blocking this preview’s session cookie. Open Fit Life Bro in a new tab to keep your demo and account progress.", "SESSION_COOKIE_BLOCKED");
      setData(result); setNextReminder(Date.now() + result.user.reminderInterval * 60000);
    } catch (error) {
      if (error instanceof AuthRequestError && error.code === "SESSION_EXPIRED") { window.location.replace("/login?reason=expired"); return; }
      setLoadError(error instanceof Error ? error.message : "We couldn't load your workspace.");
    }
  }, []);
  useEffect(() => { if (!started.current) { started.current = true; void load(); } }, [load]);
  useEffect(() => {
    function readView() { const param = new URLSearchParams(window.location.search).get("view"); if (param && Object.keys(titles).includes(param)) setView(param as View); else setView("dashboard"); }
    readView(); window.addEventListener("popstate", readView);
    if ("Notification" in window) setNotificationPermission(Notification.permission);
    return () => { window.removeEventListener("popstate", readView); if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);
  useEffect(() => {
    function outside(event: MouseEvent) {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
      if (!notificationRef.current?.contains(event.target as Node)) setNotificationsOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);
  useEffect(() => {
    if (!data || data.user.isDemo) return;
    let active = true;
    const accountId = data.user.id;
    async function checkSession() {
      try { const session = await authJson<{ user: Profile | null }>("/api/auth"); if (active && session.user?.id !== accountId) { window.location.replace("/login?reason=expired"); return; }
        if (active && !busy.current && !modal && view !== "profile" && view !== "settings" && document.visibilityState === "visible") {
          const fresh = await requestJson("/api/dashboard"); if (active && fresh.user.id === accountId && !busy.current) setData(fresh);
        } } catch { /* A temporary connection issue must not sign someone out. */ }
    }
    const restored = (event: PageTransitionEvent) => { if (event.persisted) void checkSession(); };
    window.addEventListener("focus", checkSession); window.addEventListener("pageshow", restored);
    const refresh = setInterval(() => { if (document.visibilityState === "visible" && navigator.onLine) void checkSession(); }, 30000);
    return () => { active = false; clearInterval(refresh); window.removeEventListener("focus", checkSession); window.removeEventListener("pageshow", restored); };
  }, [data?.user.id, data?.user.isDemo, view, modal]);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update(); window.addEventListener("online", update); window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  const navigate = useCallback((next: View) => {
    setView(next); setMobileOpen(false); setAccountOpen(false); setNotificationsOpen(false);
    window.history.pushState({}, "", next === "dashboard" ? "/" : `/?view=${next}`);
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, []);
  const showReminder = useCallback(() => {
    setReminderVisible(true);
    if ("Notification" in window && Notification.permission === "granted") {
      try { new Notification("A little sip, a little better 💧", { body: "Time for a water break. Your next glass is a small step toward feeling good.", tag: "wellnest-water" }); } catch { /* In-app reminders remain available on unsupported browsers. */ }
    }
    try {
      const audio = new AudioContext();
      const oscillator = audio.createOscillator(); const gain = audio.createGain();
      oscillator.connect(gain); gain.connect(audio.destination); oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(660, audio.currentTime); oscillator.frequency.exponentialRampToValueAtTime(880, audio.currentTime + .2);
      gain.gain.setValueAtTime(.04, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .5);
      oscillator.start(); oscillator.stop(audio.currentTime + .5); oscillator.onended = () => { void audio.close(); };
    } catch { /* Audio is optional. */ }
  }, []);
  useEffect(() => {
    if (!data?.user.remindersEnabled) return;
    const timer = setInterval(() => {
      const hour = new Date().getHours();
      if (Date.now() >= nextReminder && hour >= 8 && hour < 21) { showReminder(); setNextReminder(Date.now() + data.user.reminderInterval * 60000); }
    }, 15000);
    return () => clearInterval(timer);
  }, [data?.user.remindersEnabled, data?.user.reminderInterval, nextReminder, showReminder]);

  async function mutate(resource: Resource, method: "POST" | "PATCH" | "DELETE", values: Record<string, unknown>, success?: string) {
    if (!data || busy.current) return false;
    const previous = data; const epoch = accountEpoch.current; busy.current = true; setSaving(true);
    const key = resource === "water" ? "waterLogs" : resource === "weights" ? "weightLogs" : resource;
    if (method === "DELETE") setData({ ...data, [key]: data[key].filter(item => item.id !== values.id) });
    else if (method === "PATCH" && typeof values.completed === "boolean") setData({ ...data, [key]: data[key].map(item => item.id === values.id ? { ...item, completed: values.completed } : item) });
    else if (resource === "water" && method === "POST") {
      setData({ ...data, waterLogs: [{ id: `temp-${Date.now()}`, userId: data.user.id, amount: Number(values.amount), date: String(values.date), time: String(values.time), createdAt: new Date().toISOString() }, ...data.waterLogs] });
    }
    try {
      const result = await requestJson("/api/records", { method, body: JSON.stringify({ resource, ...values }) });
      if (epoch !== accountEpoch.current) return false;
      setData(result);
      if (resource === "water" && method === "POST") { setNextReminder(Date.now() + result.user.reminderInterval * 60000); setReminderVisible(false); }
      if (success) notify(success);
      return true;
    } catch (error) { if (epoch !== accountEpoch.current) return false; setData(previous); if (error instanceof AuthRequestError && error.code === "SESSION_EXPIRED") { setReminderVisible(false); openModal({ type: "auth", mode: "sign-in" }); } notify(error instanceof Error ? error.message : "We couldn't save that entry.", "error"); return false; }
    finally { busy.current = false; setSaving(false); }
  }
  async function saveProfile(values: Record<string, unknown>) {
    if (!data || busy.current) return false;
    const previous = data; const epoch = accountEpoch.current; busy.current = true; setSaving(true);
    if (typeof values.remindersEnabled === "boolean") setData({ ...data, user: { ...data.user, remindersEnabled: values.remindersEnabled } });
    try {
      const result = await requestJson("/api/profile", { method: "PATCH", body: JSON.stringify(values) }); if (epoch !== accountEpoch.current) return false; setData(result);
      setNextReminder(Date.now() + result.user.reminderInterval * 60000);
      notify(values.name ? (result.meals.length ? "Profile saved. Your budget-aware weekly plan is ready!" : "Profile saved. Review the meal planner’s budget or restriction guidance.") : "Your preferences are saved.");
      return true;
    } catch (error) { if (epoch !== accountEpoch.current) return false; setData(previous); if (error instanceof AuthRequestError && error.code === "SESSION_EXPIRED") openModal({ type: "auth", mode: "sign-in" }); notify(error instanceof Error ? error.message : "We couldn't update your profile.", "error"); return false; }
    finally { busy.current = false; setSaving(false); }
  }
  function completeAuthentication(result: AuthResult, action: "sign-in" | "sign-up", keepOpen = false) {
    accountEpoch.current++; setAccountRevision(value => value + 1);
    const { recoveryKey: _recoveryKey, ...dashboard } = result;
    setData(dashboard); setReminderVisible(false); setNextReminder(Date.now() + result.user.reminderInterval * 60000);
    if (!keepOpen) {
      closeModal(); if (action === "sign-up") navigate("profile");
      notify(action === "sign-up" ? "Your account is ready. Every little win is saved!" : `Welcome back, ${result.user.name.split(" ")[0]}!`);
    }
  }
  async function signOut() {
    if (busy.current) return; busy.current = true; setSaving(true);
    try {
      await requestJson<{ ok: boolean }>("/api/auth", { method: "POST", body: JSON.stringify({ action: "sign-out" }) });
      accountEpoch.current++; setReminderVisible(false); setData(null); window.location.assign("/login?reason=signed-out");
    } catch { notify("We couldn't sign you out. Please try again.", "error"); }
    finally { busy.current = false; setSaving(false); }
  }
  async function regenerate() {
    if (busy.current) return false; const epoch = accountEpoch.current; busy.current = true; setSaving(true);
    try { const result = await requestJson("/api/plan", { method: "POST" }); if (epoch !== accountEpoch.current) return false; setData(result); notify(result.meals.length ? "Your budget-aware weekly plan is ready." : "No compatible food plan fits these settings. Review the planner guidance."); closeModal(); return true; }
    catch (error) { if (epoch !== accountEpoch.current) return false; if (error instanceof AuthRequestError && error.code === "SESSION_EXPIRED") openModal({ type: "auth", mode: "sign-in" }); notify(error instanceof Error ? error.message : "We couldn't generate your plan.", "error"); return false; }
    finally { busy.current = false; setSaving(false); }
  }
  async function enableNotifications() {
    if (!("Notification" in window)) { notify("This browser supports in-app reminders only. Keep Fit Life Bro open for your reminders."); return; }
    try { const permission = await Notification.requestPermission(); setNotificationPermission(permission); notify(permission === "granted" ? "Browser notifications are enabled. You're all set!" : "In-app reminders will still work while Fit Life Bro is open."); }
    catch { notify("Browser notifications aren't available here. In-app reminders are still active."); }
  }

  const initials = data?.user.name.split(" ").map(part => part[0]).slice(0, 2).join("") || "A";
  const currentView = view === "dashboard" ? <DashboardView /> : view === "profile" ? <ProfileView /> : view === "meals" ? <MealsView /> : view === "workouts" ? <WorkoutsView /> : view === "water" ? <WaterView /> : view === "progress" ? <ProgressView /> : view === "coach" ? <CoachView /> : <SettingsView />;
  const shell = <div className="app-shell">
    {mobileOpen && <button className="sidebar-overlay" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <a href="/" className="brand-link" onClick={event => { event.preventDefault(); navigate("dashboard"); }} aria-label="Fit Life Bro home"><Brand /></a>
      <button className="mobile-close icon-button" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={20} /></button>
      <div className="sidebar-label">YOUR WELLNESS SPACE</div>
      <nav className="main-nav" aria-label="Main navigation">{navItems.map(item => <a key={item.id} href={item.id === "dashboard" ? "/" : `/?view=${item.id}`} onClick={event => { event.preventDefault(); navigate(item.id); }} className={`nav-link ${view === item.id ? "active" : ""}`} aria-current={view === item.id ? "page" : undefined}><item.icon size={18} strokeWidth={1.7} /><span>{item.label}</span>{view === item.id && <span className="nav-active-dot" />}</a>)}</nav>
      <div className="sidebar-bottom"><button className="habit-card" onClick={() => openModal({ type: "help" })}><PlantIllustration /><span className="habit-title">Small habits.<br />Healthier you.</span><span className="habit-copy">A little care goes a long way.</span><span className="habit-link">Find your balance <ArrowUpRight size={13} /></span></button>
      <div className="secondary-nav"><button onClick={() => navigate("settings")} className={`nav-link ${view === "settings" ? "active" : ""}`}><Settings2 size={17} strokeWidth={1.7} />Settings & preferences</button><InstallAppLink /><button onClick={() => openModal({ type: "help" })} className="nav-link"><CircleHelp size={17} strokeWidth={1.7} />A little help</button></div>
      <button className="sidebar-account" onClick={() => data?.user.isDemo ? openModal({ type: "auth", mode: "sign-up" }) : navigate("profile")}><span className="avatar">{initials}</span><span><strong>{data?.user.name || "Your wellness space"}</strong><small>{data?.user.isDemo ? "Your personal demo" : "Personal account"}</small></span><ChevronRight size={15} /></button></div>
    </aside>
    <div className="workspace"><header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={21} /></button><span className="breadcrumb-root">My workspace</span><ChevronRight size={13} className="breadcrumb-chevron" /><span className="breadcrumb-current">{titles[view]}</span></div><div className="topbar-actions">{data && <span className={`account-sync-state ${!online ? "is-offline" : ""}`} title={`Last server read: ${new Date(data.syncedAt).toLocaleString()}. Registered accounts refresh on focus and about every 30 seconds. Offline writes are not queued.`}>{!online ? <WifiOff size={12} /> : <CheckCircle2 size={12} />}{!online ? "Offline · connection needed" : saving ? "Saving to server…" : "Saved to account"}</span>}{data?.user.isDemo && <button className="demo-pill" onClick={() => openModal({ type: "auth", mode: "sign-up" })}><span />Demo workspace <ArrowUpRight size={12} /></button>}{data?.user.isDemo && <button className="topbar-sign-in" onClick={() => openModal({ type: "auth", mode: "sign-in" })}>Sign in<ArrowUpRight size={13} /></button>}<div className="notification-container" ref={notificationRef}><button className={`icon-button notification-button ${notificationsOpen ? "selected" : ""}`} onClick={() => { setNotificationsOpen(!notificationsOpen); setAccountOpen(false); }} aria-label="View notifications" aria-expanded={notificationsOpen}><Bell size={19} strokeWidth={1.7} /><span className="notification-dot" /></button>{notificationsOpen && <div className="notification-popover"><div className="popover-heading"><strong>A little encouragement</strong><span className="badge badge-green">For you</span></div><div className="notification-item"><span className="notification-icon"><Leaf size={17} /></span><div><strong>Your week is looking good</strong><p>Your personalized meals and movement are ready. One small step at a time.</p><button onClick={() => navigate("meals")}>Explore your plan <ArrowUpRight size={12} /></button></div></div><div className="notification-item"><span className="notification-icon blue"><Droplets size={17} /></span><div><strong>Make hydration a happy habit</strong><p>{data?.user.remindersEnabled ? `Your gentle water reminder is set for every ${data.user.reminderInterval} minutes.` : "Turn on gentle reminders and make space for a water break."}</p><button onClick={() => navigate("water")}>Visit water tracker <ArrowUpRight size={12} /></button></div></div><div className="popover-foot"><ShieldCheck size={13} />Your health data stays in your account.</div></div>}</div><span className="topbar-divider" /><div className="account-container" ref={accountRef}><button className="topbar-account" onClick={() => { setAccountOpen(!accountOpen); setNotificationsOpen(false); }} aria-expanded={accountOpen}><span className="avatar avatar-small">{initials}</span><span>{data?.user.name.split(" ")[0] || "Welcome"}</span><ChevronDown size={13} /></button>{accountOpen && <div className="account-popover"><strong>{data?.user.name}</strong><small>{data?.user.email || "Exploring your personal demo"}</small><button onClick={() => navigate("profile")}><UserRound size={15} />My health profile</button><button onClick={() => navigate("settings")}><Settings2 size={15} />Preferences</button>{data?.user.isDemo ? <><button onClick={() => openModal({ type: "auth", mode: "sign-up" })}><Leaf size={15} />Create an account</button><button onClick={() => openModal({ type: "auth", mode: "sign-in" })}><ArrowUpRight size={15} />Sign in</button></> : <button onClick={() => void signOut()}><LogOut size={15} />Sign out</button>}</div>}</div></div></header>
      <main className="main-content" id="main-content">{data ? <div className="view-enter" key={`${data.user.id}:${accountRevision}:${view}`}>{currentView}</div> : loadError ? <div className="load-error"><AlertCircle size={32} /><h1>A small pause in your journey</h1><p>{loadError}</p><div className="load-error-actions"><Button onClick={() => void load()}>Try again</Button><a className="btn btn-secondary" href="/login">Go to sign in</a><a className="btn btn-secondary" href="/" target="_blank" rel="noopener noreferrer">Open in a new tab<ArrowUpRight size={14} /></a></div></div> : <DashboardSkeleton />}<footer className="page-footer"><span><Leaf size={12} />Made for your health. At your pace.</span><button onClick={() => openModal({ type: "help" })}>General wellness guidance, not medical advice <ArrowUpRight size={11} /></button></footer></main>
    </div>
    {data && <Dialogs />}
    {data && view !== "coach" && <button className="nivra-launcher" onClick={() => navigate("coach")} aria-label="Ask Nivra, your fitness guide"><span><Sparkles size={20} /></span><span>Ask Nivra</span><MessageCircle size={15} /></button>}
    {toast && <div className={`toast toast-${toast.type}`} role={toast.type === "error" ? "alert" : "status"}>{toast.type === "success" ? <span className="toast-icon"><Check size={15} /></span> : <AlertCircle size={19} />}<span>{toast.message}</span><button onClick={() => setToast(null)} aria-label="Dismiss notification"><X size={16} /></button></div>}
    {reminderVisible && <div className="water-alarm" role="alert"><span className="alarm-drop"><Droplets size={25} /></span><button className="alarm-close icon-button" onClick={() => { setReminderVisible(false); setNextReminder(Date.now() + 600000); }} aria-label="Snooze reminder for 10 minutes"><X size={17} /></button><h3>A little sip, a little better.</h3><p>Take a breath. Have a glass of water.<br />Your body will thank you.</p><Button onClick={() => { const now = new Date(); void mutate("water", "POST", { amount: 250, date: todayKey(), time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}` }, "Cheers to a healthier you! +250 ml logged."); }} loading={saving}><PlusWater />I had a glass · 250 ml</Button><button className="snooze-button" onClick={() => { setReminderVisible(false); setNextReminder(Date.now() + 600000); }}>Remind me in 10 minutes</button></div>}
  </div>;
  if (!data) return shell;
  return <WellnestContext.Provider value={{ data, view, selectedDay, setSelectedDay, navigate, openModal, closeModal, modal, saving, mutate, saveProfile, completeAuthentication, signOut, regenerate, notify, enableNotifications, testReminder: showReminder, notificationPermission, nextReminder }}>{shell}</WellnestContext.Provider>;
}
function PlusWater() { return <Droplets size={16} />; }
function DashboardSkeleton() {
  return <div className="dashboard-skeleton" aria-label="Loading your wellness dashboard" aria-busy="true"><div className="skeleton skeleton-heading" /><div className="skeleton skeleton-subheading" /><div className="hero-grid"><div className="skeleton skeleton-hero" /><div className="skeleton skeleton-hero" /></div><div className="stats-grid">{[0, 1, 2, 3].map(i => <div key={i} className="skeleton skeleton-stat" />)}</div><div className="daily-grid"><div className="skeleton skeleton-panel" /><div className="skeleton skeleton-panel" /></div></div>;
}
