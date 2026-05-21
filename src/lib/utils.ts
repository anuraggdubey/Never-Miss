import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { NotificationRhythm } from "./models";
export function cn(...v: ClassValue[]) { return twMerge(clsx(v)); }

export function parseIsoDateLocal(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function buildOccurrenceIso(baseIso: string, year: number) {
  const [, month, day] = baseIso.split("-").map(Number);
  const safeDay = Math.min(day, getDaysInMonth(year, month));
  return `${year}-${String(month).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
}

function getTimeZoneTodayIso(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function formatIsoDateLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDaysToIsoDate(iso: string, days: number) {
  const date = parseIsoDateLocal(iso);
  date.setDate(date.getDate() + days);
  return formatIsoDateLocal(date);
}

export function daysUntil(iso: string) {
  const target = parseIsoDateLocal(getNextOccurrenceIso(iso));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ms = target.getTime() - today.getTime();
  return Math.round(ms / 86400000);
}

export function formatDate(iso: string) {
  return parseIsoDateLocal(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function relativeWhen(iso: string) {
  const d = daysUntil(iso);
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  if (d === -1) return "Yesterday";
  if (d > 0 && d < 14) return `in ${d} days`;
  if (d < 0) return `${Math.abs(d)}d ago`;
  return formatDate(iso);
}

export function getUtcDateForLocal(date: string, time?: string, timeZone = "UTC") {
  const fallbackTime = time && /^\d{2}:\d{2}$/.test(time) ? time : "09:00";
  const [hours, minutes] = fallbackTime.split(":").map(Number);
  const localNowParts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
  }).formatToParts(new Date());
  const localYear = Number(localNowParts.find((part) => part.type === "year")?.value ?? new Date().getUTCFullYear());

  let occurrenceIso = buildOccurrenceIso(date, localYear);
  let [year, month, day] = occurrenceIso.split("-").map(Number);
  let approxUtc = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(approxUtc);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const asIfUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );
  const desiredUtc = Date.UTC(year, month - 1, day, hours, minutes, 0);
  let eventUtc = new Date(approxUtc.getTime() - (asIfUtc - desiredUtc));

  const shouldRollToNextYear = time
    ? eventUtc.getTime() <= Date.now()
    : getTimeZoneTodayIso(timeZone) > occurrenceIso;

  if (shouldRollToNextYear) {
    occurrenceIso = buildOccurrenceIso(date, localYear + 1);
    [year, month, day] = occurrenceIso.split("-").map(Number);
    approxUtc = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));

    const nextParts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(approxUtc);

    const nextValues = Object.fromEntries(nextParts.map((part) => [part.type, part.value]));
    const nextAsIfUtc = Date.UTC(
      Number(nextValues.year),
      Number(nextValues.month) - 1,
      Number(nextValues.day),
      Number(nextValues.hour),
      Number(nextValues.minute),
      Number(nextValues.second),
    );
    const nextDesiredUtc = Date.UTC(year, month - 1, day, hours, minutes, 0);
    eventUtc = new Date(approxUtc.getTime() - (nextAsIfUtc - nextDesiredUtc));
  }

  return eventUtc;
}

export function getNextOccurrenceIso(iso: string, timeZone?: string) {
  const today = new Date();
  const currentYear = timeZone
    ? Number(new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric" }).format(today))
    : today.getFullYear();
  const todayIso = timeZone ? getTimeZoneTodayIso(timeZone) : formatIsoDateLocal(today);

  const currentYearOccurrence = buildOccurrenceIso(iso, currentYear);
  if (currentYearOccurrence >= todayIso) {
    return currentYearOccurrence;
  }

  return buildOccurrenceIso(iso, currentYear + 1);
}

export function getNextAlertTime(
  date: string,
  time: string | undefined,
  notificationRhythm: NotificationRhythm,
  timeZone: string,
  customAlertDate?: string,
  customAlertTime?: string,
) {
  if (customAlertDate && customAlertTime) {
    const customAlert = getUtcDateForLocal(customAlertDate, customAlertTime, timeZone).getTime();
    return customAlert > Date.now() ? customAlert : null;
  }

  const eventTime = getUtcDateForLocal(date, time, timeZone).getTime();
  const candidates: number[] = [];

  if (notificationRhythm === "day_before" || notificationRhythm === "both") {
    candidates.push(eventTime - 24 * 60 * 60 * 1000);
  }

  if (time && (notificationRhythm === "ten_minutes_before" || notificationRhythm === "both")) {
    candidates.push(eventTime - 10 * 60 * 1000);
  }

  return candidates
    .filter((timestamp) => timestamp > Date.now())
    .sort((a, b) => a - b)[0] ?? null;
}

export function formatCountdown(targetTime: number, now = Date.now()) {
  const diff = targetTime - now;
  if (diff <= 0) return "now";

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];

  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes && parts.length < 2) parts.push(`${minutes}m`);
  if (!parts.length) parts.push("under 1m");

  return parts.slice(0, 2).join(" ");
}
