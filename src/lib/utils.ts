import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...v: ClassValue[]) { return twMerge(clsx(v)); }

export function parseIsoDateLocal(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
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
  const target = parseIsoDateLocal(iso);
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
