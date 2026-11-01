-- Test fixture generated from the pre-archive Drizzle schema; disposable database only.
CREATE TABLE "wellnest_auth_failures" (
	"key" text PRIMARY KEY NOT NULL,
	"failures" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp NOT NULL
);


CREATE TABLE "fitlife_coach_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"mode" text DEFAULT 'local' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);


CREATE TABLE "wellnest_meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"day" integer NOT NULL,
	"meal_type" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"portion" text DEFAULT '1 serving' NOT NULL,
	"time" text DEFAULT '12:30' NOT NULL,
	"calories" integer NOT NULL,
	"protein" integer DEFAULT 20 NOT NULL,
	"carbs" integer DEFAULT 40 NOT NULL,
	"fat" integer DEFAULT 15 NOT NULL,
	"image" text DEFAULT '/images/salad.jpg' NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"recipe_id" text,
	"cost_paise" integer,
	"ingredients" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"nutrition_source" text DEFAULT 'manual' NOT NULL
);


CREATE TABLE "wellnest_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL
);


CREATE TABLE "wellnest_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"password_hash" text,
	"recovery_key_hash" text,
	"name" text DEFAULT 'Alex Morgan' NOT NULL,
	"is_demo" boolean DEFAULT true NOT NULL,
	"age" integer DEFAULT 29 NOT NULL,
	"gender" text DEFAULT 'male' NOT NULL,
	"height" real DEFAULT 175 NOT NULL,
	"current_weight" real DEFAULT 76.5 NOT NULL,
	"start_weight" real DEFAULT 80 NOT NULL,
	"target_weight" real DEFAULT 70 NOT NULL,
	"goal" text DEFAULT 'lose' NOT NULL,
	"activity" text DEFAULT 'moderate' NOT NULL,
	"diet" text DEFAULT 'balanced' NOT NULL,
	"allergies" text DEFAULT '' NOT NULL,
	"food_budget_paise" integer DEFAULT 15000 NOT NULL,
	"budget_period" text DEFAULT 'daily' NOT NULL,
	"experience" text DEFAULT 'beginner' NOT NULL,
	"equipment" text DEFAULT 'bodyweight' NOT NULL,
	"workout_minutes" integer DEFAULT 30 NOT NULL,
	"fitness_goal" text DEFAULT 'general-fitness' NOT NULL,
	"calorie_target" integer DEFAULT 1920 NOT NULL,
	"water_target" integer DEFAULT 2500 NOT NULL,
	"activity_target" integer DEFAULT 60 NOT NULL,
	"reminders_enabled" boolean DEFAULT false NOT NULL,
	"reminder_interval" integer DEFAULT 60 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wellnest_users_email_unique" UNIQUE("email")
);


CREATE TABLE "wellnest_water_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);


CREATE TABLE "wellnest_weight_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"weight" real NOT NULL,
	"date" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);


CREATE TABLE "wellnest_workouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"day" integer NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'Walking' NOT NULL,
	"duration" integer DEFAULT 30 NOT NULL,
	"time" text DEFAULT '07:00' NOT NULL,
	"description" text DEFAULT 'Move at a comfortable pace and take breaks as needed.' NOT NULL,
	"intensity" text DEFAULT 'Moderate' NOT NULL,
	"completed" boolean DEFAULT false NOT NULL
);


ALTER TABLE "fitlife_coach_messages" ADD CONSTRAINT "fitlife_coach_messages_user_id_wellnest_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."wellnest_users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "wellnest_meals" ADD CONSTRAINT "wellnest_meals_user_id_wellnest_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."wellnest_users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "wellnest_sessions" ADD CONSTRAINT "wellnest_sessions_user_id_wellnest_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."wellnest_users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "wellnest_water_logs" ADD CONSTRAINT "wellnest_water_logs_user_id_wellnest_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."wellnest_users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "wellnest_weight_logs" ADD CONSTRAINT "wellnest_weight_logs_user_id_wellnest_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."wellnest_users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "wellnest_workouts" ADD CONSTRAINT "wellnest_workouts_user_id_wellnest_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."wellnest_users"("id") ON DELETE cascade ON UPDATE no action;