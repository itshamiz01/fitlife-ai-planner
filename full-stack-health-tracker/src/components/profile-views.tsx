"use client";
import { useState } from "react";
import { UserRound, Target, Leaf, ArrowDownRight, ArrowUpRight, Heart, Check, Sparkles, ShieldCheck, LogOut, ArrowUpRight as ExternalArrow, Save, Info, Mail, LockKeyhole } from "lucide-react";
import { useWellnest } from "./app-context";
import { Button, Field, SectionHeading, Brand } from "./ui";
import { PageHeading, SafetyNote } from "./views";
import { ReminderSettings } from "./tracking-views";
import AccountSecurity from "./account-security";
import InstallAppCard from "./install-app-card";
import DataExport from "./data-export";
import PlanArchives from "./plan-archives";

export { default as ProfileView } from "./health-profile-form";
export function SettingsView() {
  const { data, openModal, signOut, saving } = useWellnest();
  const { user } = data;
  return <><PageHeading eyebrow="YOUR SPACE, YOUR PREFERENCES" title="Make yourself at home." description="The little details that make Fit Life Bro feel like you." /><div className="settings-grid"><div><section className="panel account-settings"><SectionHeading title="Your personal space"><span className="mini-icon green"><UserRound size={17} /></span></SectionHeading><div className="settings-identity"><span className="avatar avatar-large">{user.name.split(" ").map(part => part[0]).slice(0, 2).join("")}</span><div><h2>{user.name}</h2><p>{user.email || "Exploring a private demo workspace"}</p><span className={`badge ${user.isDemo ? "badge-orange" : "badge-green"}`}>{user.isDemo ? "Demo account" : "Personal account"}</span></div></div>{user.isDemo ? <><div className="account-save-callout"><Leaf size={20} /><div><h3>A little progress worth keeping.</h3><p>Create your free account to save this profile, your customized plans, and every small win. Your demo data comes with you.</p></div></div><div className="settings-buttons"><Button onClick={() => openModal({ type: "auth", mode: "sign-up" })}>Create my account<ExternalArrow size={15} /></Button><Button variant="secondary" onClick={() => openModal({ type: "auth", mode: "sign-in" })}>I already have an account</Button></div></> : <><div className="account-detail-row"><Mail size={16} /><span>Email address</span><strong>{user.email}</strong></div><div className="account-detail-row"><LockKeyhole size={16} /><span>Session</span><strong>Secure, private sign-in</strong></div><Button variant="secondary" onClick={() => void signOut()} loading={saving}><LogOut size={15} />Sign out securely</Button></>}</section>{!user.isDemo && <AccountSecurity />}<PlanArchives /><DataExport isDemo={user.isDemo} /><InstallAppCard isDemo={user.isDemo} /><section className="panel privacy-card"><span className="privacy-card-icon"><ShieldCheck size={27} strokeWidth={1.5} /></span><h2>A little peace of mind.</h2><p>Your account uses securely hashed passwords and private, HTTP-only session cookies. Your health information is account-scoped and saved in our database—not shared with other users.</p><button className="text-link" onClick={() => openModal({ type: "help" })}>About your wellness guidance<ExternalArrow size={13} /></button></section></div><ReminderSettings /></div></>;
}
