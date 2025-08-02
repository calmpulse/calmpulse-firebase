// src/lib/streak.ts
import { formatInTimeZone } from 'date-fns-tz';
import {
  eachDayOfInterval,
  differenceInCalendarDays,
} from 'date-fns';

const TZ = 'Europe/Paris';

/* ---------- 1. Date -> chaîne YYYY-MM-DD ---------- */
export const toLocalDay = (d: Date | number) =>
  formatInTimeZone(d, TZ, 'yyyy-MM-dd');

/* ---------- 2. Stats de streak ---------- */
export function streakStats(days: string[]) {
  if (!days.length) return { current: 0, longest: 0 };

  const unique = Array.from(new Set(days)).sort();      // oldest → newest

  /* courant */
  let current = 1;
  for (let i = unique.length - 2; i >= 0; i--) {
    if (
      differenceInCalendarDays(
        new Date(unique[i + 1]),
        new Date(unique[i])
      ) === 1
    )
      current++;
    else break;
  }

  /* plus long */
  let longest = 1, run = 1;
  for (let i = 1; i < unique.length; i++) {
    run =
      differenceInCalendarDays(
        new Date(unique[i]),
        new Date(unique[i - 1])
      ) === 1
        ? run + 1
        : 1;
    longest = Math.max(longest, run);
  }
  return { current, longest };
}

/* ---------- 3. Semaine ISO courante ---------- */
export function weekDays(today = new Date()): string[] {
  const monday = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate() - ((today.getUTCDay() + 6) % 7),
    12 // midi UTC
  ));
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return eachDayOfInterval({ start: monday, end: sunday }).map(toLocalDay);
}

/* ---------- 4. Dates du mois ---------- */
export function monthArray(base: Date = new Date()): Date[] {
  const res: Date[] = [];
  const cursor = new Date(Date.UTC(
    base.getUTCFullYear(),
    base.getUTCMonth(),
    1,
    12, 0, 0,
  ));
  while (cursor.getUTCMonth() === base.getUTCMonth()) {
    res.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return res;
}

