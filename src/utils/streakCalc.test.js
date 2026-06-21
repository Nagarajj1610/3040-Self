import { describe, test, expect } from 'vitest';
import { calculateStreak } from './streakCalc';

describe('calculateStreak', () => {
  const baseDate = new Date('2026-06-21T12:00:00'); // Sunday

  test('returns 0 for empty trips list or invalid list', () => {
    expect(calculateStreak(null, baseDate)).toEqual({ current: 0, longest: 0, lastLogDate: null });
    expect(calculateStreak([], baseDate)).toEqual({ current: 0, longest: 0, lastLogDate: null });
    expect(calculateStreak('not an array', baseDate)).toEqual({ current: 0, longest: 0, lastLogDate: null });
  });

  test('returns 1 for a single trip logged today', () => {
    const trips = [
      { timestamp: '2026-06-21T08:00:00' }
    ];
    const res = calculateStreak(trips, baseDate);
    expect(res.current).toBe(1);
    expect(res.longest).toBe(1);
    expect(res.lastLogDate).not.toBeNull();
  });

  test('returns 1 for a single trip logged yesterday', () => {
    const trips = [
      { timestamp: '2026-06-20T18:00:00' }
    ];
    const res = calculateStreak(trips, baseDate);
    expect(res.current).toBe(1);
    expect(res.longest).toBe(1);
    expect(res.lastLogDate).not.toBeNull();
  });

  test('returns 0 for a single trip logged older than yesterday', () => {
    const trips = [
      { timestamp: '2026-06-19T10:00:00' }
    ];
    const res = calculateStreak(trips, baseDate);
    expect(res.current).toBe(0);
    expect(res.longest).toBe(1);
    expect(res.lastLogDate).not.toBeNull();
  });

  test('returns 3 for consecutive days (today, yesterday, day before)', () => {
    const trips = [
      { timestamp: '2026-06-21T09:00:00' },
      { timestamp: '2026-06-20T14:30:00' },
      { timestamp: '2026-06-19T22:00:00' }
    ];
    const res = calculateStreak(trips, baseDate);
    expect(res.current).toBe(3);
    expect(res.longest).toBe(3);
  });

  test('returns 2 for consecutive days (yesterday, day before) even if not logged today', () => {
    const trips = [
      { timestamp: '2026-06-20T14:30:00' },
      { timestamp: '2026-06-19T22:00:00' }
    ];
    const res = calculateStreak(trips, baseDate);
    expect(res.current).toBe(2);
    expect(res.longest).toBe(2);
  });

  test('handles gap days correctly (today logged + older logged with a gap yesterday)', () => {
    const trips = [
      { timestamp: '2026-06-21T09:00:00' },
      { timestamp: '2026-06-19T15:00:00' } // gap on 2026-06-20
    ];
    const res = calculateStreak(trips, baseDate);
    expect(res.current).toBe(1);
    expect(res.longest).toBe(1);
  });

  test('ignores duplicate trips on the same day', () => {
    const trips = [
      { timestamp: '2026-06-21T09:00:00' },
      { timestamp: '2026-06-21T15:00:00' }, // same day
      { timestamp: '2026-06-20T11:00:00' }
    ];
    const res = calculateStreak(trips, baseDate);
    expect(res.current).toBe(2);
    expect(res.longest).toBe(2);
  });

  test('supports Firestore timestamp objects (.toDate())', () => {
    const trips = [
      {
        timestamp: {
          toDate: () => new Date('2026-06-21T09:00:00')
        }
      },
      {
        timestamp: {
          toDate: () => new Date('2026-06-20T10:00:00')
        }
      }
    ];
    const res = calculateStreak(trips, baseDate);
    expect(res.current).toBe(2);
    expect(res.longest).toBe(2);
  });

  test('supports Firestore serialized timestamps with seconds property', () => {
    const trips = [
      { timestamp: { seconds: 1782038400 } }, // 2026-06-21
      { timestamp: { seconds: 1781952000 } }  // 2026-06-20
    ];
    const res = calculateStreak(trips, baseDate);
    expect(res.current).toBe(2);
    expect(res.longest).toBe(2);
  });
});
