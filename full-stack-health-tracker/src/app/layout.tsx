import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppInstallProvider } from "@/components/app-install-provider";
import "./globals.css";
import "./auth.css";
import "./install.css";
import "./fitlife.css";

export const metadata: Metadata = {
  title: "Fit Life Bro — A little better, every day",
  description: "Your personal space for healthier habits. Thoughtful meal plans, joyful movement, water reminders, and meaningful progress for every stage of life.",
  applicationName: "Fit Life Bro",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Fit Life Bro", statusBarStyle: "default" },
  icons: { apple: [{ url: "/icons/apple-touch-icon-dual-leaf.png", sizes: "180x180", type: "image/png" }] },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#3d7046" };
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body><AppInstallProvider>{children}</AppInstallProvider></body></html>;
}
