import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { waterPushConfig } from "@/lib/water-push-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };

// One-time, idempotent applier for migrations/0009_plan_push.sql. The production
// DATABASE_URL is a sensitive (write-only) Vercel variable, so the migration is
// applied through the app's own connection. Guarded by the same scheduler
// secret as the cron endpoints; every statement is fixed and additive.
// Remove this route after the migration has been applied and verified.
const STATEMENTS = [
  "ALTER TABLE wellnest_users ADD COLUMN IF NOT EXISTS meal_reminders_enabled boolean NOT NULL DEFAULT true",
  "ALTER TABLE wellnest_users ADD COLUMN IF NOT EXISTS workout_reminders_enabled boolean NOT NULL DEFAULT true",
  `CREATE TABLE IF NOT EXISTS fitlife_plan_push_sends (
    user_id uuid NOT NULL REFERENCES wellnest_users(id) ON DELETE CASCADE,
    subscription_id uuid NOT NULL REFERENCES fitlife_water_push_subscriptions(id) ON DELETE CASCADE,
    kind text NOT NULL,
    item_id uuid NOT NULL,
    local_date text NOT NULL,
    sent_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (subscription_id, kind, item_id, local_date)
  )`,
  "CREATE INDEX IF NOT EXISTS fitlife_plan_push_sends_user_idx ON fitlife_plan_push_sends (user_id, local_date)",
  "ALTER TABLE fitlife_plan_push_sends ENABLE ROW LEVEL SECURITY",
  "REVOKE ALL ON TABLE fitlife_plan_push_sends FROM PUBLIC, anon, authenticated",
];

export async function POST(request: Request) {
  const config = waterPushConfig();
  if (!config) return NextResponse.json({ error: "Push delivery is not configured." }, { status: 503, headers });
  const provided = request.headers.get("authorization") || "";
  const expected = `Bearer ${config.secret}`;
  if (Buffer.byteLength(provided) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) return NextResponse.json({ error: "Unauthorized." }, { status: 401, headers });
  try {
    for (const statement of STATEMENTS) await db.execute(sql.raw(statement));
    return NextResponse.json({ applied: true, statements: STATEMENTS.length }, { headers });
  } catch {
    return NextResponse.json({ error: "Migration failed. Check database permissions." }, { status: 503, headers });
  }
}
