import type { Metadata } from "next";
import AuthScreen from "@/components/auth-screen";
export const metadata: Metadata = { title: "Sign in — Fit Life Bro", description: "Sign in securely to your personal wellness plans and progress." };
export default function LoginPage() { return <AuthScreen initialMode="sign-in" />; }
