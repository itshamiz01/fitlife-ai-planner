import { parseTime } from "./hydration/reminder-window";

/** Meal and workout closed-app push helpers. Pure functions; no I/O. */

export type PlanPushKind = "meal" | "workout";

/** How long after a planned time a scheduler tick may still send its reminder. */
export const PLAN_PUSH_GRACE_MINUTES = 20;

const WEEKDAYS: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

/** Local weekday (Monday = 0, matching plan `day`), minute of day and YYYY-MM-DD
 *  for `now` in the subscription's recorded time zone. */
export function localDayParts(now: Date, timeZone: string): { dayIndex: number; minutes: number; dateKey: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find(part => part.type === type)?.value ?? "";
  return {
    dayIndex: WEEKDAYS[get("weekday")] ?? 0,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

/** True when a planned "HH:MM" time is due: it has just passed within the grace
 *  window, so one scheduler tick sends it and later ticks do not repeat it. */
export function isPlanItemDue(time: string, nowMinutes: number, graceMinutes = PLAN_PUSH_GRACE_MINUTES): boolean {
  const itemMinutes = parseTime(time);
  if (itemMinutes === null) return false;
  const diff = nowMinutes - itemMinutes;
  return diff >= 0 && diff < graceMinutes;
}

function clean(value: string, max: number): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);
}

function firstName(name: string): string {
  return clean(name, 80).split(/\s+/)[0] || "there";
}

export function mealPushMessage(name: string, mealType: string, mealName: string, portion: string) {
  const type = clean(mealType, 30) || "meal";
  return {
    kind: "meal" as const,
    title: `Hey ${firstName(name)}, it's ${type.toLowerCase()} time 🍽️`,
    body: `${clean(mealName, 80)} · ${clean(portion, 40)}. Tap to open today's meals.`,
    url: "/?view=meals",
    tag: "fitlife-meal-push",
  };
}

export function workoutPushMessage(name: string, workoutName: string, durationMinutes: number, time: string) {
  return {
    kind: "workout" as const,
    title: `Hey ${firstName(name)}, workout time 💪`,
    body: `${clean(workoutName, 80)} · ${durationMinutes} min, planned for ${clean(time, 5)}. Tap to open your plan.`,
    url: "/?view=workouts",
    tag: "fitlife-workout-push",
  };
}
