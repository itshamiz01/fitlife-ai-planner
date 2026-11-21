"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { subscribeStatic, serverText, serverFalse, embedded, platform as browserPlatform, subscribeDisplayMode, displayMode } from "@/lib/browser-snapshot";

type InstallOutcome = "accepted" | "dismissed" | "unavailable";
type InstallPromptEvent = Event & { prompt: () => Promise<unknown>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type InstallContextValue = { canInstall: boolean; isInstalled: boolean; isEmbedded: boolean; isInstalling: boolean; platform: "ios" | "android" | "other"; requestInstall: () => Promise<InstallOutcome> };
const InstallContext = createContext<InstallContextValue | null>(null);

export function AppInstallProvider({ children }: { children: ReactNode }) {
  const [canInstall, setCanInstall] = useState(false);
  const [installedEvent, setInstalled] = useState(false);
  const isInstalled = useSyncExternalStore(subscribeDisplayMode, displayMode, serverFalse) || installedEvent;
  const isEmbedded = useSyncExternalStore(subscribeStatic, embedded, serverFalse);
  const [isInstalling, setInstalling] = useState(false);
  const platformValue = useSyncExternalStore(subscribeStatic, browserPlatform, serverText);
  const platform: InstallContextValue["platform"] = platformValue === "ios" || platformValue === "android" ? platformValue : "other";
  const deferred = useRef<InstallPromptEvent | null>(null);
  const busy = useRef(false);
  useEffect(() => {
    const offered = (event: Event) => { event.preventDefault(); deferred.current = event as InstallPromptEvent; setCanInstall(true); };
    const installed = () => { deferred.current = null; setCanInstall(false); setInstalled(true); };
    window.addEventListener("beforeinstallprompt", offered);
    window.addEventListener("appinstalled", installed);
    if (!embedded() && window.isSecureContext && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => { /* Manual installation and online use remain available. */ });
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", offered); window.removeEventListener("appinstalled", installed);
    };
  }, []);
  const requestInstall = useCallback(async (): Promise<InstallOutcome> => {
    const event = deferred.current;
    if (!event || busy.current) return "unavailable";
    busy.current = true; setInstalling(true); deferred.current = null; setCanInstall(false);
    try { await event.prompt(); return (await event.userChoice).outcome; }
    catch { return "unavailable"; }
    finally { busy.current = false; setInstalling(false); }
  }, []);
  const value = useMemo(() => ({ canInstall, isInstalled, isEmbedded, isInstalling, platform, requestInstall }), [canInstall, isInstalled, isEmbedded, isInstalling, platform, requestInstall]);
  return <InstallContext.Provider value={value}>{children}</InstallContext.Provider>;
}
export function useAppInstall() { const context = useContext(InstallContext); if (!context) throw new Error("Installation context is not available."); return context; }
