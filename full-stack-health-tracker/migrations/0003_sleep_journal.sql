-- Additive migration; apply only after an authorized backup and review.
CREATE TABLE IF NOT EXISTS fitlife_sleep_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES wellnest_users(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL,
  ended_at timestamptz NOT NULL,
  quality integer,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fitlife_sleep_logs_user_end_idx ON fitlife_sleep_logs (user_id, ended_at DESC, created_at DESC);
