/** User-selected reminder window. Start inclusive; end exclusive. No medical advice. */
export function inReminderWindow(minute: number, start: number, end: number): boolean {
  if (![minute, start, end].every(n => Number.isInteger(n) && n >= 0 && n < 1440) || start === end) return false;
  return start < end ? minute >= start && minute < end : minute >= start || minute < end;
}
export function localReminderTime(now: Date, start: number, end: number): boolean {
  return inReminderWindow(now.getHours() * 60 + now.getMinutes(), start, end);
}
export function timeString(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
export function parseTime(value: string): number | null {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [hour, minute] = value.split(":").map(Number); return hour * 60 + minute;
}
