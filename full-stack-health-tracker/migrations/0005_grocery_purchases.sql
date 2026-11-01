-- Additive only. Review and apply to an authorized database after backup.
CREATE TABLE IF NOT EXISTS fitlife_grocery_purchases (
  user_id uuid PRIMARY KEY REFERENCES wellnest_users(id) ON DELETE CASCADE,
  list_signature text NOT NULL,
  purchased_keys jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
