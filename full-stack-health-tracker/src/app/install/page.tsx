import type { Metadata } from "next";
import InstallationPage from "@/components/installation-page";

export const metadata: Metadata = {
  title: "Install Fit Life Bro on your phone",
  description: "Add Fit Life Bro to your Android or iPhone home screen. Simple Chrome and Safari installation instructions, with no app store download needed.",
};
export default function InstallPage() { return <InstallationPage />; }
