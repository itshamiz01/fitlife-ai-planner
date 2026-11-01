import { ApiError, number, text } from "./server";

export function validateSleep(body: unknown, now = Date.now()) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new ApiError("Submit a valid sleep entry.");
  const input = body as Record<string, unknown>;
  const readTime = (value: unknown, label: string) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) throw new ApiError(`${label} must be a valid timestamp.`);
    const date = new Date(value);
    if (!Number.isFinite(date.getTime()) || date.toISOString() !== value || date.getUTCFullYear() < 1900) throw new ApiError(`${label} must be a valid timestamp.`);
    return date;
  };
  const startedAt = readTime(input.startedAt, "Start time");
  const endedAt = readTime(input.endedAt, "End time");
  const elapsed = endedAt.getTime() - startedAt.getTime();
  if (elapsed <= 0 || elapsed > 24 * 60 * 60 * 1000) throw new ApiError("The end must be after the start, within 24 hours.");
  if (endedAt.getTime() > now) throw new ApiError("Sleep entries cannot end in the future.");
  const quality = input.quality === "" || input.quality === null || input.quality === undefined ? null : number(input.quality, "Sleep quality", 1, 5);
  if (quality !== null && !Number.isInteger(quality)) throw new ApiError("Sleep quality must be a whole number from 1 to 5.");
  return { startedAt, endedAt, quality, note: text(input.note, "Note", 500, false) };
}
