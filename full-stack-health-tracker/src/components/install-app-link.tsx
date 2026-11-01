"use client";
import { Smartphone } from "lucide-react";
import { useAppInstall } from "./app-install-provider";

export default function InstallAppLink() {
  const { isEmbedded } = useAppInstall();
  return <a className="nav-link" href="/install" target={isEmbedded ? "_blank" : undefined} rel={isEmbedded ? "noopener noreferrer" : undefined} title="Option A: install the home-screen web app"><Smartphone size={17} strokeWidth={1.7} /><span>Install Fit Life Bro</span></a>;
}
