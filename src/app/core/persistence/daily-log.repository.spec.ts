import { describe, expect, it } from 'vitest';
import { assertCurrentDate, getLocalDateKey } from './daily-log.repository';

describe('getLocalDateKey', () => {
  it('uses the device local calendar date', () => {
    expect(getLocalDateKey(new Date(2026, 8, 3, 23, 30))).toBe('2026-09-03');
  });

  it('does not allow a past daily log to be changed', () => {
    expect(() => assertCurrentDate('2026-09-22', '2026-09-23')).toThrow('read-only');
    expect(() => assertCurrentDate('2026-09-23', '2026-09-23')).not.toThrow();
  });
});
