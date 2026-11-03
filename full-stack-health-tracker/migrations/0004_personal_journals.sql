-- Additive only. Review and apply to an authorized database after backup.
CREATE TABLE IF NOT EXISTS fitlife_journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES wellnest_users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  date text NOT NULL,
  title text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fitlife_journal_entries_user_kind_date_idx ON fitlife_journal_entries (user_id, kind, date DESC, created_at DESC);
