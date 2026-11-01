import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, weightLogs } from "@/db/schema";
import { ApiError, apiError, requireUser, checkOrigin, text, number, choice, publicProfile, getDashboardData } from "@/lib/server";
import { recommendations } from "@/lib/planner";
import { archiveAndReplacePlan } from "@/lib/plan-archive";
import { profileChangesPlan } from "@/lib/profile-plan-change";
export async function PATCH(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new ApiError("Submit a valid profile.");
    if (body.name === undefined) {
      if (["foodBudget","budgetPeriod","age","height","currentWeight","targetWeight","goal","diet","allergies","experience","equipment","workoutMinutes","fitnessGoal"].some(key => key in body)) throw new ApiError("Use the complete health-profile form for budget or plan changes so all recommendations stay consistent.");
      if (body.remindersEnabled !== undefined && typeof body.remindersEnabled !== "boolean") throw new ApiError("Choose a valid reminder preference.");
      const enabled = body.remindersEnabled ?? user.remindersEnabled;
      const interval = Math.round(number(body.reminderInterval ?? user.reminderInterval, "Reminder interval", 15, 180));
      const waterTarget = Math.round(number(body.waterTarget ?? user.waterTarget, "Daily water guide", 500, 4000));
      await db.update(users).set({ remindersEnabled: enabled, reminderInterval: interval, waterTarget }).where(eq(users.id, user.id));
    } else {
      const age = Math.round(number(body.age, "Age", 5, 110));
      const goal = age < 18 ? "maintain" : choice(body.goal, ["lose", "gain", "maintain"], "weight goal");
      const currentWeight = number(body.currentWeight, "Current weight", 12, 400);
      const targetWeight = goal === "maintain" ? currentWeight : number(body.targetWeight, "Target weight", 12, 400);
      if (goal === "lose" && targetWeight >= currentWeight) throw new ApiError("For a weight-loss goal, choose a target below your current weight.");
      if (goal === "gain" && targetWeight <= currentWeight) throw new ApiError("For a weight-gain goal, choose a target above your current weight.");
      const budget = body.foodBudget === undefined ? user.foodBudgetPaise : Math.round(number(body.foodBudget, "Food budget in rupees", 0, 100000) * 100);
      const values = {
        name: text(body.name, "Name", 80), age, gender: choice(body.gender, ["male", "female", "other"], "gender"), height: number(body.height, "Height", 60, 250), currentWeight, targetWeight, goal,
        activity: choice(body.activity, ["low", "moderate", "high"], "activity level"),
        diet: choice(body.diet, ["balanced", "nonvegetarian", "vegetarian", "vegan", "eggetarian"], "food preference"),
        allergies: text(body.allergies, "Allergies", 500, false), foodBudgetPaise: budget,
        budgetPeriod: choice(body.budgetPeriod ?? user.budgetPeriod, ["daily", "weekly"], "budget period"),
        experience: choice(body.experience ?? user.experience, ["beginner", "intermediate", "advanced"], "experience level"),
        equipment: choice(body.equipment ?? user.equipment, ["bodyweight", "home", "gym"], "equipment"),
        workoutMinutes: Math.round(number(body.workoutMinutes ?? user.workoutMinutes, "Session duration", 10, 90)),
        fitnessGoal: choice(body.fitnessGoal ?? user.fitnessGoal, ["general-fitness", "muscle-gain", "fat-loss", "strength"], "training focus"),
      };
      const waterOverride = body.waterTarget === undefined ? {} : { waterTarget: Math.round(number(body.waterTarget, "Daily water guide", 500, 4000)) };
      await db.transaction(async tx => {
        const [fresh] = await tx.select().from(users).where(eq(users.id, user.id)).for("update");
        const changesPlan = profileChangesPlan(fresh, values);
        const targets = changesPlan ? { ...recommendations(values), ...waterOverride } : waterOverride;
        const resetBaseline = values.goal !== fresh.goal || values.targetWeight !== fresh.targetWeight || values.currentWeight !== fresh.currentWeight;
        const [updated] = await tx.update(users).set({ ...values, ...targets, startWeight: resetBaseline ? values.currentWeight : fresh.startWeight }).where(eq(users.id, user.id)).returning();
        if (values.currentWeight !== fresh.currentWeight) await tx.insert(weightLogs).values({ userId: user.id, weight: values.currentWeight, date: new Date().toISOString().slice(0, 10), note: "A fresh profile check-in" });
        if (changesPlan) {
          await archiveAndReplacePlan(tx, publicProfile(fresh), publicProfile(updated), "profile-change");
        }
      });
    }
    return NextResponse.json(await getDashboardData(user.id), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
