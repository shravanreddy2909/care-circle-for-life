// Time-zone helpers: all times are shown in the family's time zone.
export const DEFAULT_TZ = "Asia/Kolkata";

export const COMMON_TIMEZONES = [
  "Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Asia/Tokyo", "Europe/London", "Europe/Berlin",
  "America/New_York", "America/Chicago", "America/Los_Angeles", "Australia/Sydney", "UTC",
];

function parts(date: Date, tz: string) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  const out: Record<string, number> = {};
  for (const p of f.formatToParts(date)) if (p.type !== "literal") out[p.type] = Number(p.value);
  return out as { year: number; month: number; day: number; hour: number; minute: number; second: number };
}

function offsetMs(tz: string, at: Date) {
  const p = parts(at, tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** Convert a wall-clock "YYYY-MM-DDTHH:mm" in tz to a UTC Date. */
export function zonedToUtc(local: string, tz: string): Date {
  const [d = "", t = "00:00"] = local.split("T");
  const [y = 1970, m = 1, day = 1] = d.split("-").map(Number);
  const [hh = 0, mm = 0] = t.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, day, hh, mm);
  const first = guess - offsetMs(tz, new Date(guess));
  return new Date(guess - offsetMs(tz, new Date(first)));
}

/** "YYYY-MM-DDTHH:mm" wall clock for a UTC date in tz (for datetime-local inputs). */
export function utcToZonedInput(date: Date, tz: string) {
  const p = parts(date, tz);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

export function zonedDateKey(date: Date, tz: string) {
  return utcToZonedInput(date, tz).slice(0, 10);
}

/** Start/end (UTC) of the local day containing `date` in tz, shifted by `addDays`. */
export function zonedDayBounds(tz: string, date = new Date(), addDays = 0) {
  const key = zonedDateKey(date, tz);
  const base = new Date(`${key}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + addDays);
  const startKey = base.toISOString().slice(0, 10);
  base.setUTCDate(base.getUTCDate() + 1);
  const endKey = base.toISOString().slice(0, 10);
  return { start: zonedToUtc(`${startKey}T00:00`, tz), end: zonedToUtc(`${endKey}T00:00`, tz) };
}

export function formatTime(iso: string | Date, tz: string) {
  return new Intl.DateTimeFormat("en-IN", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true })
    .format(new Date(iso)).toUpperCase();
}

export function formatDateTime(iso: string | Date, tz: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: tz, weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true,
  }).format(new Date(iso));
}

export function formatDate(iso: string | Date, tz: string) {
  return new Intl.DateTimeFormat("en-IN", { timeZone: tz, weekday: "short", day: "numeric", month: "short" })
    .format(new Date(iso));
}

export function formatClock(hhmm: string) {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function isValidTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
