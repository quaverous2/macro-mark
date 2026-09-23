import { describe, expect, it } from 'vitest';
import { normalizeFoodName } from './food.repository';

describe('normalizeFoodName', () => {
  it('ignores casing and repeated whitespace when comparing food names', () => {
    expect(normalizeFoodName('  Coop   Tonno  ')).toBe('coop tonno');
  });
});
