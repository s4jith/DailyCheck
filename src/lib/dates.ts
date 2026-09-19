import { endOfMonth, startOfMonth, startOfYear, subMonths } from 'date-fns';

export type ReportPeriod = 'this-month' | 'last-3-months' | 'this-year' | 'all-time';

export function currentMonthRange(now: Date = new Date()): { from: Date; to: Date } {
  return { from: startOfMonth(now), to: endOfMonth(now) };
}

export function periodStart(period: ReportPeriod, now: Date = new Date()): Date | undefined {
  switch (period) {
    case 'this-month':
      return startOfMonth(now);
    case 'last-3-months':
      return startOfMonth(subMonths(now, 2));
    case 'this-year':
      return startOfYear(now);
    case 'all-time':
      return undefined;
  }
}
