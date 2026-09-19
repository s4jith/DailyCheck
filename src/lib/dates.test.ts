import { describe, expect, it } from 'vitest';
import { currentMonthRange, periodStart } from './dates';

describe('currentMonthRange', () => {
  it('spans the first to the last moment of the month', () => {
    const { from, to } = currentMonthRange(new Date('2026-07-19T12:00:00'));
    expect(from.getFullYear()).toBe(2026);
    expect(from.getMonth()).toBe(6);
    expect(from.getDate()).toBe(1);
    expect(from.getHours()).toBe(0);
    expect(to.getMonth()).toBe(6);
    expect(to.getDate()).toBe(31);
    expect(to.getHours()).toBe(23);
  });

  it('handles February', () => {
    const { from, to } = currentMonthRange(new Date('2026-02-10T08:30:00'));
    expect(from.getDate()).toBe(1);
    expect(to.getDate()).toBe(28);
  });
});

describe('periodStart', () => {
  const now = new Date('2026-07-19T12:00:00');

  it('returns the first of the month for this-month', () => {
    const start = periodStart('this-month', now)!;
    expect(start.getMonth()).toBe(6);
    expect(start.getDate()).toBe(1);
  });

  it('goes back two whole months for last-3-months', () => {
    const start = periodStart('last-3-months', now)!;
    expect(start.getMonth()).toBe(4); // May
    expect(start.getDate()).toBe(1);
  });

  it('returns January 1st for this-year', () => {
    const start = periodStart('this-year', now)!;
    expect(start.getMonth()).toBe(0);
    expect(start.getDate()).toBe(1);
    expect(start.getFullYear()).toBe(2026);
  });

  it('returns undefined for all-time', () => {
    expect(periodStart('all-time', now)).toBeUndefined();
  });
});
