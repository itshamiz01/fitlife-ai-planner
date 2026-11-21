-- Additive idempotency ledger. Apply only after backup and explicit authorization.
CREATE TABLE IF NOT EXISTS fitlife_water_reminder_confirmations (
  user_id uuid NOT NULL REFERENCES wellnest_users(id) ON DELETE CASCADE,
  request_id uuid NOT NULL,
  amount integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, request_id)
);
ALTER TABLE fitlife_water_reminder_confirmations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE fitlife_water_reminder_confirmations FROM PUBLIC, anon, authenticated;
-- Rollback (only with explicit approval): stop new confirmations, then DROP TABLE
-- fitlife_water_reminder_confirmations. Water log rows are never removed by rollback;
-- deleting the ledger removes retry deduplication history.
