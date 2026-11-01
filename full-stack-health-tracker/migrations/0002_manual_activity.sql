-- Additive migration; apply only to an authorized database after backup and review.
CREATE TABLE IF NOT EXISTS fitlife_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES wellnest_users(id) ON DELETE CASCADE,
  date text NOT NULL,
  activity text NOT NULL,
  steps integer,
  distance_km real,
  duration_minutes integer,
  note text NOT NULL DEFAULT '',
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fitlife_activity_logs_user_date_idx ON fitlife_activity_logs (user_id, date DESC, created_at DESC);
