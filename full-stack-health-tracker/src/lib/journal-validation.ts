import { ApiError, choice, number, text } from "./server";

export const journalKinds = ["food", "exercise", "measurement"] as const;
export type JournalKind = typeof journalKinds[number];
export function validateJournal(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new ApiError("Submit a valid journal entry.");
  const body = input as Record<string, unknown>;
  const kind = choice(body.kind, [...journalKinds], "journal type") as JournalKind;
  const date = text(body.date, "Date", 10);
  const parsed = new Date(`${date}T00:00:00.000Z`);
  const latest = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== date || date < "1900-01-01" || date > latest) throw new ApiError("Choose a valid date that is not in the future.");
  const specs = kind === "food" ? { calories: [10000, false], protein: [1000, false], carbs: [1000, false], fat: [1000, false] } : kind === "exercise" ? { durationMinutes: [1440, true], sets: [100, true], reps: [10000, true], loadKg: [1000, false] } : { centimetres: [400, false] };
  const details: Record<string, number | null> = {};
  for (const [key, [max, whole]] of Object.entries(specs)) {
    const value = body[key];
    if (value === "" || value === undefined || value === null) { details[key] = null; continue; }
    const parsedValue = number(value, key, 0, max as number);
    if (whole && !Number.isInteger(parsedValue)) throw new ApiError(`${key} must be a whole number.`);
    details[key] = parsedValue;
  }
  if (kind === "measurement" && (details.centimetres === null || details.centimetres === 0)) throw new ApiError("Enter a measurement greater than zero in centimetres.");
  return { kind, date, title: text(body.title, kind === "measurement" ? "Measurement name" : "Name", 100), details, note: text(body.note, "Note", 500, false) };
}
