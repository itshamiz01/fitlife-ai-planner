"use client";
import { useState } from "react";
import { ArrowUpRight, Check, Download, Smartphone } from "lucide-react";
import { useAppInstall } from "./app-install-provider";
import { Button, SectionHeading } from "./ui";

export default function InstallAppCard({ isDemo = false }: { isDemo?: boolean }) {
  const { canInstall, isInstalled, isEmbedded, isInstalling, requestInstall } = useAppInstall();
  const [message, setMessage] = useState("");
  async function install() { const result = await requestInstall(); setMessage(result === "accepted" ? "Installation requested. Follow your browser’s confirmation." : result === "dismissed" ? "No problem. You can install later from your browser menu." : "Open the installation guide for the steps for your phone."); }
  return <section className="panel install-settings-card"><SectionHeading title="Wellness, right in your pocket" subtitle="Add Fit Life Bro to your phone’s home screen."><span className="mini-icon green"><Smartphone size={18} /></span></SectionHeading><p>{isInstalled ? "Fit Life Bro is ready on your home screen. Your everyday wellness is only a tap away." : isDemo ? "Create an account first to keep your demo’s progress, then sign in with that account from the installed app." : "No app store download needed. Install the web app and sign in with the same email to bring your saved progress along."}</p><div className="install-settings-actions">{canInstall && !isInstalled && !isEmbedded && <Button type="button" loading={isInstalling} onClick={() => void install()}><Download size={14} />Install Fit Life Bro</Button>}{isInstalled && <span className="badge badge-green"><Check size={12} />Installed</span>}<a className={`btn ${canInstall && !isInstalled && !isEmbedded ? "btn-secondary" : "btn-primary"}`} href="/install">{isInstalled ? "Installation details" : "Install on my phone"}<ArrowUpRight size={14} /></a></div>{message && <p className="install-status" role="status">{message}</p>}</section>;
}
