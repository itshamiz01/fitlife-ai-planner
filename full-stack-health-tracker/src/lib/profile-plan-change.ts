import type { Profile } from "./types";

// Keep this conservative: any health or planning input change retains the
// existing regeneration behavior. Display-only fields must not erase plans.
const planInputs = ["age", "gender", "height", "currentWeight", "targetWeight", "goal", "activity", "diet", "allergies", "foodBudgetPaise", "budgetPeriod", "experience", "equipment", "workoutMinutes", "fitnessGoal"] as const;
type PlanInputs = Pick<Profile, typeof planInputs[number]>;
export function profileChangesPlan(previous: PlanInputs, next: PlanInputs) {
  return planInputs.some(key => {
    // The form presents the legacy "balanced" value as non-vegetarian.
    if (key === "diet") {
      const normalize = (value: string) => value === "balanced" ? "nonvegetarian" : value;
      return normalize(previous.diet) !== normalize(next.diet);
    }
    return previous[key] !== next[key];
  });
}
