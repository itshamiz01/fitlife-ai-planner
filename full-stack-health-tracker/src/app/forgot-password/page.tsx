import type { Metadata } from "next";
import AuthScreen from "@/components/auth-screen";
export const metadata: Metadata = { title: "Reset your password — Fit Life Bro", description: "Reset your password securely with your saved recovery key.", referrer: "no-referrer", robots: { index: false, follow: false } };
export default function ForgotPasswordPage() { return <AuthScreen initialMode="recover" />; }
