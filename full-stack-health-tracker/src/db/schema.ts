import { pgTable, uuid, text, integer, real, boolean, timestamp, jsonb, primaryKey } from "drizzle-orm/pg-core";
import type { MealIngredient, CoachSource } from "@/lib/types";

export const users = pgTable("wellnest_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  recoveryKeyHash: text("recovery_key_hash"),
  name: text("name").notNull().default("Alex Morgan"),
  isDemo: boolean("is_demo").notNull().default(true),
  age: integer("age").notNull().default(29),
  gender: text("gender").notNull().default("male"),
  height: real("height").notNull().default(175),
  currentWeight: real("current_weight").notNull().default(76.5),
  startWeight: real("start_weight").notNull().default(80),
  targetWeight: real("target_weight").notNull().default(70),
  goal: text("goal").notNull().default("lose"),
  activity: text("activity").notNull().default("moderate"),
  diet: text("diet").notNull().default("balanced"),
  allergies: text("allergies").notNull().default(""),
  foodBudgetPaise: integer("food_budget_paise").notNull().default(15000),
  budgetPeriod: text("budget_period").notNull().default("daily"),
  experience: text("experience").notNull().default("beginner"),
  equipment: text("equipment").notNull().default("bodyweight"),
  workoutMinutes: integer("workout_minutes").notNull().default(30),
  fitnessGoal: text("fitness_goal").notNull().default("general-fitness"),
  calorieTarget: integer("calorie_target").notNull().default(1920),
  waterTarget: integer("water_target").notNull().default(2500),
  activityTarget: integer("activity_target").notNull().default(60),
  remindersEnabled: boolean("reminders_enabled").notNull().default(false),
  mealRemindersEnabled: boolean("meal_reminders_enabled").notNull().default(true),
  workoutRemindersEnabled: boolean("workout_reminders_enabled").notNull().default(true),
  reminderInterval: integer("reminder_interval").notNull().default(60),
  reminderStartMinute: integer("reminder_start_minute").notNull().default(480),
  reminderEndMinute: integer("reminder_end_minute").notNull().default(1260),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("wellnest_sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
});

export const meals = pgTable("wellnest_meals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  day: integer("day").notNull(),
  mealType: text("meal_type").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  portion: text("portion").notNull().default("1 serving"),
  time: text("time").notNull().default("12:30"),
  calories: integer("calories").notNull(),
  protein: integer("protein").notNull().default(20),
  carbs: integer("carbs").notNull().default(40),
  fat: integer("fat").notNull().default(15),
  image: text("image").notNull().default("/images/salad.jpg"),
  completed: boolean("completed").notNull().default(false),
  recipeId: text("recipe_id"),
  costPaise: integer("cost_paise"),
  ingredients: jsonb("ingredients").$type<MealIngredient[]>().notNull().default([]),
  nutritionSource: text("nutrition_source").notNull().default("manual"),
});

export const workouts = pgTable("wellnest_workouts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  day: integer("day").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull().default("Walking"),
  duration: integer("duration").notNull().default(30),
  time: text("time").notNull().default("07:00"),
  description: text("description").notNull().default("Move at a comfortable pace and take breaks as needed."),
  intensity: text("intensity").notNull().default("Moderate"),
  completed: boolean("completed").notNull().default(false),
});

export const waterLogs = pgTable("wellnest_water_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const weightLogs = pgTable("wellnest_weight_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  weight: real("weight").notNull(),
  date: text("date").notNull(),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const authFailures = pgTable("wellnest_auth_failures", {
  key: text("key").primaryKey(),
  failures: integer("failures").notNull().default(0),
  expiresAt: timestamp("expires_at").notNull(),
});

export const coachMessages = pgTable("fitlife_coach_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  sources: jsonb("sources").$type<CoachSource[]>().notNull().default([]),
  mode: text("mode").notNull().default("local"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Immutable snapshots of replaced plans; retained until the account is deleted.
export const planArchives = pgTable("fitlife_plan_archives", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  snapshot: jsonb("snapshot").$type<{ profile: import("@/lib/types").Profile; meals: (typeof meals.$inferSelect)[]; workouts: (typeof workouts.$inferSelect)[] }>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activityLogs = pgTable("fitlife_activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  activity: text("activity").notNull(),
  steps: integer("steps"),
  distanceKm: real("distance_km"),
  durationMinutes: integer("duration_minutes"),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sleepLogs = pgTable("fitlife_sleep_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }).notNull(),
  quality: integer("quality"),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const journalEntries = pgTable("fitlife_journal_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  date: text("date").notNull(),
  title: text("title").notNull(),
  details: jsonb("details").$type<Record<string, number | null>>().notNull().default({}),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// One bounded shopping-list state per account. A list signature prevents stale marks
// from being reused after changing the plan, day, preparation state or people count.
export const groceryPurchases = pgTable("fitlife_grocery_purchases", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  listSignature: text("list_signature").notNull(),
  purchasedKeys: jsonb("purchased_keys").$type<string[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Push endpoint and keys are private delivery credentials; never include them in logs or exports.
export const waterPushSubscriptions = pgTable("fitlife_water_push_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  timeZone: text("time_zone").notNull(),
  nextDue: timestamp("next_due", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Retain confirmed request IDs even if a water entry is later deleted.
export const waterReminderConfirmations = pgTable("fitlife_water_reminder_confirmations", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  requestId: uuid("request_id").notNull(),
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, table => [primaryKey({ columns: [table.userId, table.requestId] })]);

// One row per meal/workout notification actually claimed for sending, per device
// and local date. The primary key is the deduplication guard for the scheduler.
export const planPushSends = pgTable("fitlife_plan_push_sends", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subscriptionId: uuid("subscription_id").notNull().references(() => waterPushSubscriptions.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  itemId: uuid("item_id").notNull(),
  localDate: text("local_date").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
}, table => [primaryKey({ columns: [table.subscriptionId, table.kind, table.itemId, table.localDate] })]);
