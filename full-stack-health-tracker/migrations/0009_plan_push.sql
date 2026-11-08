-- Additive only. Meal and workout closed-app push preferences plus a per-device
-- send ledger that prevents duplicate notifications for the same planned item.
-- Apply to an authorized database after backup, following the existing procedure.
ALTER TABLE wellnest_users ADD COLUMN IF NOT EXISTS meal_reminders_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE wellnest_users ADD COLUMN IF NOT EXISTS workout_reminders_enabled boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS fitlife_plan_push_sends (
  user_id uuid NOT NULL REFERENCES wellnest_users(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES fitlife_water_push_subscriptions(id) ON DELETE CASCADE,
  kind text NOT NULL,
  item_id uuid NOT NULL,
  local_date text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (subscription_id, kind, item_id, local_date)
);
CREATE INDEX IF NOT EXISTS fitlife_plan_push_sends_user_idx ON fitlife_plan_push_sends (user_id, local_date);
ALTER TABLE fitlife_plan_push_sends ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE fitlife_plan_push_sends FROM PUBLIC, anon, authenticated;
-- Rollback (only with explicit approval): stop the plan-push scheduler first, then
-- DROP TABLE fitlife_plan_push_sends;
-- ALTER TABLE wellnest_users DROP COLUMN meal_reminders_enabled, DROP COLUMN workout_reminders_enabled;
-- Meal, workout and water records are never removed by rollback; only send history
-- and the two preference flags are lost.
