import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Install Fit Life Bro",
  description: "Option A: add the Fit Life Bro web app to your Android or iPhone home screen.",
  robots: { index: false, follow: true },
};
export default function DownloadPage() { redirect("/install"); }
