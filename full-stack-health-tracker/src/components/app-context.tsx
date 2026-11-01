"use client";
import { createContext, useContext } from "react";
import type { DashboardData, Meal, Workout, WaterLog, WeightLog, View, Resource } from "@/lib/types";
import type { AuthResult } from "@/lib/auth-client";
export type AppModal =
  | { type: "meal"; item?: Meal }
  | { type: "meal-detail"; item: Meal }
  | { type: "meal-swap"; item: Meal }
  | { type: "workout"; item?: Workout }
  | { type: "water"; item?: WaterLog }
  | { type: "weight"; item?: WeightLog }
  | { type: "auth"; mode?: "sign-in" | "sign-up" }
  | { type: "confirm"; resource: Resource; id: string; label: string }
  | { type: "regenerate" }
  | { type: "help" }
  | null;
export type WellnestContextValue = {
  data: DashboardData; view: View; selectedDay: number; setSelectedDay: (day: number) => void;
  navigate: (view: View) => void; openModal: (modal: AppModal) => void; closeModal: () => void;
  modal: AppModal; saving: boolean;
  mutate: (resource: Resource, method: "POST" | "PATCH" | "DELETE", values: Record<string, unknown>, success?: string) => Promise<boolean>;
  saveProfile: (values: Record<string, unknown>) => Promise<boolean>;
  completeAuthentication: (result: AuthResult, action: "sign-in" | "sign-up", keepOpen?: boolean) => void;
  signOut: () => Promise<void>; regenerate: () => Promise<boolean>;
  notify: (message: string, type?: "success" | "error") => void;
  enableNotifications: () => Promise<void>; testReminder: () => void; notificationPermission: string; nextReminder: number;
};
export const WellnestContext = createContext<WellnestContextValue | null>(null);
export function useWellnest() { const context = useContext(WellnestContext); if (!context) throw new Error("Fit Life Bro context is not available"); return context; }
