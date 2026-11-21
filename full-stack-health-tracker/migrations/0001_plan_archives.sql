-- Additive migration. Review and apply only to an authorized database after backup.
-- Never drop or truncate existing records.
CREATE TABLE IF NOT EXISTS fitlife_plan_archives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES wellnest_users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  snapshot jsonb NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fitlife_plan_archives_user_created_idx
  ON fitlife_plan_archives (user_id, created_at DESC);
