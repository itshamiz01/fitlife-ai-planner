import type { Metadata } from "next";
import AuthScreen from "@/components/auth-screen";
export const metadata: Metadata = { title: "Create your account — Fit Life Bro", description: "Create your own private space for healthier habits." };
export default function SignupPage() { return <AuthScreen initialMode="sign-up" />; }
