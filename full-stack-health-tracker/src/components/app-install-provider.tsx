"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type InstallOutcome = "accepted" | "dismissed" | "unavailable";
type InstallPromptEvent = Event & { prompt: () => Promise<unknown>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type InstallContextValue = { canInstall: boolean; isInstalled: boolean; isEmbedded: boolean; isInstalling: boolean; platform: "ios" | "android" | "other"; requestInstall: () => Promise<InstallOutcome> };
const InstallContext = createContext<InstallContextValue | null>(null);

export function AppInstallProvider({ children }: { children: ReactNode }) {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setInstalled] = useState(false);
  const [isEmbedded, setEmbedded] = useState(false);
  const [isInstalling, setInstalling] = useState(false);
  const [platform, setPlatform] = useState<InstallContextValue["platform"]>("other");
  const deferred = useRef<InstallPromptEvent | null>(null);
  const busy = useRef(false);
  useEffect(() => {
    let embedded = false;
    try { embedded = window.self !== window.top; } catch { embedded = true; }
    setEmbedded(embedded);
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setPlatform(ios ? "ios" : /Android/i.test(navigator.userAgent) ? "android" : "other");
    const media = window.matchMedia("(display-mode: standalone)");
    const updateDisplayMode = () => setInstalled(media.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    updateDisplayMode();
    const offered = (event: Event) => { event.preventDefault(); deferred.current = event as InstallPromptEvent; setCanInstall(true); };
    const installed = () => { deferred.current = null; setCanInstall(false); setInstalled(true); };
    window.addEventListener("beforeinstallprompt", offered);
    window.addEventListener("appinstalled", installed);
    if (typeof media.addEventListener === "function") media.addEventListener("change", updateDisplayMode);
    else media.addListener(updateDisplayMode);
    if (!embedded && window.isSecureContext && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => { /* Manual installation and online use remain available. */ });
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", offered); window.removeEventListener("appinstalled", installed);
      if (typeof media.removeEventListener === "function") media.removeEventListener("change", updateDisplayMode); else media.removeListener(updateDisplayMode);
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
