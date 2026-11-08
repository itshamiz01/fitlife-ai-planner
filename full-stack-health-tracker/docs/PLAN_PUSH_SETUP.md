# Closed-app meal and workout notifications

## What is implemented

Devices already registered for closed-app water notifications can also receive a
notification at each planned meal and workout time. Two account-level toggles in
Water tracker → reminder settings ("Meal reminders" and "Workout reminders",
both on by default) control the kinds independently. Items already checked off
for the day are skipped. Tapping a notification opens the meals or workouts
view. Delivery uses the same subscriptions, VAPID keys and scheduler secret as
water push; no additional server configuration is needed beyond migration 0009
and a scheduler that also calls the plan-push endpoint.

## Server setup (authorized deployment only)

1. Review and back up the authorized database, then apply the additive
   `migrations/0009_plan_push.sql`. It adds two preference columns to
   `wellnest_users` and one send-ledger table; it does not change meal, workout
   or water records. Do not apply it to production without explicit
   authorization. Without it, the settings API and the sender report a
   migration error (503) and in-app behaviour is unaffected.
2. Extend the existing water-push scheduler so it also sends an HTTPS `POST`
   to `/api/cron/plan-push` with the same
   `Authorization: Bearer <WATER_PUSH_CRON_SECRET>` header, on the same
   cadence. Each invocation considers subscriptions in batches and sends any
   planned item whose time passed within the last 20 minutes, so a cadence of
   10 minutes or better keeps delivery timely; the designed cadence is once
   per minute.
3. A row in `fitlife_plan_push_sends` is claimed before sending, keyed by
   device, kind, planned item and the item's local date, so overlapping or
   repeated scheduler calls cannot notify twice for the same item. A transient
   send failure releases the claim so a later call inside the grace window can
   retry; an expired subscription (404/410) is removed and its claims cascade.

## Behaviour notes

- Times and weekdays are evaluated in the time zone recorded when the device
  registered for push. Re-register the device after moving time zones.
- Meal and workout plans are weekly templates: a reminder fires on the
  weekday the item is planned for, at its planned time, unless the item is
  already checked off.
- Changing the toggles cannot retract a notification already accepted by a
  push provider.
- Water reminders, quiet hours and the in-app alarms are unchanged. The
  reminder window (default 08:00–21:00) applies to water only; meal and
  workout notifications follow the plan's own times.
