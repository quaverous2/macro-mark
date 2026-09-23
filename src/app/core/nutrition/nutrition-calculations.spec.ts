import { describe, expect, it } from 'vitest';
import { calculateCaloriesPer100g } from './nutrition-calculations';

describe('calculateCaloriesPer100g', () => {
  it('calculates calories from carbohydrates, fat, and protein', () => {
    expect(
      calculateCaloriesPer100g({
        carbohydratesGramsPer100g: 84,
        fatGramsPer100g: 1.3,
        proteinGramsPer100g: 8.2,
      }),
    ).toBeCloseTo(380.5);
  });

  it('does not include salt in calorie calculation', () => {
    expect(
      calculateCaloriesPer100g({
        carbohydratesGramsPer100g: 0,
        fatGramsPer100g: 0,
        proteinGramsPer100g: 0,
        saltGramsPer100g: 10,
      }),
    ).toBe(0);
  });
});
