-- Additive only. Review and apply to an authorized database after backup.
CREATE TABLE IF NOT EXISTS fitlife_water_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES wellnest_users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  time_zone text NOT NULL,
  next_due timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fitlife_water_push_due_idx ON fitlife_water_push_subscriptions (next_due);
