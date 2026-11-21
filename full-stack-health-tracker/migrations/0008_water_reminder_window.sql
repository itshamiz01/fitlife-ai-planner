-- Additive schedule preferences; old settings keep their existing 08:00–21:00 window.
ALTER TABLE wellnest_users ADD COLUMN IF NOT EXISTS reminder_start_minute integer NOT NULL DEFAULT 480;
ALTER TABLE wellnest_users ADD COLUMN IF NOT EXISTS reminder_end_minute integer NOT NULL DEFAULT 1260;
-- Rollback only with approval, after deploying code that no longer reads these fields:
-- ALTER TABLE wellnest_users DROP COLUMN reminder_start_minute, DROP COLUMN reminder_end_minute;
-- Rolling back loses only the selected window, not water records.
