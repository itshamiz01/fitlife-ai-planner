import type { Profile } from "./types";

/** A directional goal has measurable progress only when its baseline and target differ. */
export function weightGoalProgress(user: Pick<Profile, "goal" | "startWeight" | "currentWeight" | "targetWeight">): number | null {
  if (user.goal === "maintain" || user.startWeight === user.targetWeight) return null;
  const distance = user.targetWeight - user.startWeight;
  if ((user.goal === "lose" && distance >= 0) || (user.goal === "gain" && distance <= 0) || !["lose", "gain"].includes(user.goal)) return null;
  return Math.min(100, Math.max(0, (user.currentWeight - user.startWeight) / distance * 100));
}

/** Include both measured weights and the target in the chart's plotted range. */
export function weightChartBounds(weights: number[], target: number) {
  return { min: Math.floor(Math.min(...weights, target)) - 1, max: Math.ceil(Math.max(...weights, target)) + 1 };
}
