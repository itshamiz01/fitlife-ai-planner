export type Profile = {
  id: string; email: string | null; name: string; isDemo: boolean; hasRecoveryKey: boolean; age: number;
  gender: string; height: number; currentWeight: number; startWeight: number;
  targetWeight: number; goal: string; activity: string; diet: string; allergies: string;
  foodBudgetPaise: number; budgetPeriod: string; experience: string; equipment: string;
  workoutMinutes: number; fitnessGoal: string;
  calorieTarget: number; waterTarget: number; activityTarget: number;
  remindersEnabled: boolean; reminderInterval: number;
};
export type MealIngredient = {
  foodId: string; name: string; grams: number; state: string; costPaise: number;
  unitPricePaisePer100g: number; kcal: number; protein: number; carbs: number; fat: number;
  allergens: string[]; sourceUrl: string;
  servingBase?: { grams: number; costPaise: number; kcal: number; protein: number; carbs: number; fat: number };
  servingCount?: number;
};
export type Meal = {
  id: string; userId: string; day: number; mealType: string; name: string;
  description: string; portion: string; time: string; calories: number;
  protein: number; carbs: number; fat: number; image: string; completed: boolean;
  recipeId: string | null; costPaise: number | null; ingredients: MealIngredient[]; nutritionSource: string;
};
export type Workout = {
  id: string; userId: string; day: number; name: string; category: string;
  duration: number; time: string; description: string; intensity: string; completed: boolean;
};
export type WaterLog = { id: string; userId: string; amount: number; date: string; time: string; createdAt: string };
export type WeightLog = { id: string; userId: string; weight: number; date: string; note: string; createdAt: string };
export type BudgetInfo = { dailyBudgetPaise: number; weeklyBudgetPaise: number; minimumDailyPaise: number | null; warnings: string[]; unknownAllergies: string[]; priceNote: string };
export type DashboardData = { user: Profile; meals: Meal[]; workouts: Workout[]; waterLogs: WaterLog[]; weightLogs: WeightLog[]; planning: BudgetInfo; syncedAt: string };
export type View = "dashboard" | "profile" | "meals" | "workouts" | "water" | "progress" | "settings" | "coach" | "activity" | "sleep" | "food-diary" | "exercise-journal" | "measurements" | "how-to";
export type Resource = "meals" | "workouts" | "water" | "weights";
export type CoachSource = { title: string; url?: string };
export type CoachMessage = { id: string; role: string; content: string; sources: CoachSource[]; mode: string; createdAt: string };
export const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export function todayKey() { return new Date().toISOString().slice(0, 10); }
export function todayIndex() { return (new Date().getDay() + 6) % 7; }
export function dateForDay(day: number) { const date = new Date(); date.setDate(date.getDate() - todayIndex() + day); return date; }
export function formatTime(time: string) { const [h, m] = time.split(":").map(Number); return `${h % 12 || 12}:${String(m || 0).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; }
export const goalLabels: Record<string, string> = { lose: "Lose weight", gain: "Build healthy weight", maintain: "Feel balanced" };
export const dietLabels: Record<string, string> = { balanced: "Non-vegetarian", nonvegetarian: "Non-vegetarian", vegetarian: "Vegetarian", vegan: "Vegan", eggetarian: "Eggetarian" };
export function rupees(paise: number, decimals = 0) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: decimals }).format(paise / 100); }
export function dailyBudget(profile: Pick<Profile, "foodBudgetPaise" | "budgetPeriod">) { return profile.budgetPeriod === "weekly" ? Math.floor(profile.foodBudgetPaise / 7) : profile.foodBudgetPaise; }
