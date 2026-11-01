import { ApiError, choice, number, text } from "./server";

export function validateActivity(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new ApiError("Submit a valid activity entry.");
  const input = body as Record<string, unknown>;
  const date = text(input.date, "Date", 10);
  const parsed = new Date(`${date}T00:00:00.000Z`);
  // Accept tomorrow relative to UTC to accommodate the world's positive time zones.
  const latest = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date || date < "1900-01-01" || date > latest) throw new ApiError("Choose a valid date that is not in the future.");
  const optional = (value: unknown, label: string, max: number, integer: boolean) => {
    if (value === "" || value === undefined || value === null) return null;
    const result = number(value, label, 0, max);
    if (integer && !Number.isInteger(result)) throw new ApiError(`${label} must be a whole number.`);
    return result;
  };
  const steps = optional(input.steps, "Steps", 200000, true);
  const distanceKm = optional(input.distanceKm, "Distance in km", 500, false);
  const durationMinutes = optional(input.durationMinutes, "Duration in minutes", 1440, true);
  if (steps === null && distanceKm === null && durationMinutes === null) throw new ApiError("Enter steps, distance or duration.");
  return { date, activity: choice(input.activity, ["walking", "running", "cycling", "other"], "activity"), steps, distanceKm, durationMinutes, note: text(input.note, "Note", 500, false) };
}
