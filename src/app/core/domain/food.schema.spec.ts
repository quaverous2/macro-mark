import { describe, expect, it } from 'vitest';
import { foodSchema } from './food.schema';

const validFood = {
  id: 'af3761f6-97a1-4c61-a7b1-3c58579a91b6',
  name: 'Banana',
  normalizedName: 'banana',
  carbohydratesGramsPer100g: 12.8,
  fatGramsPer100g: 0,
  proteinGramsPer100g: 0.8,
  createdAt: new Date('2026-09-23T00:00:00.000Z'),
  updatedAt: new Date('2026-09-23T00:00:00.000Z'),
};

describe('foodSchema', () => {
  it('accepts a food without optional salt', () => {
    expect(foodSchema.parse(validFood)).toMatchObject(validFood);
  });

  it('rejects negative nutrition values', () => {
    expect(() =>
      foodSchema.parse({ ...validFood, fatGramsPer100g: -0.1 }),
    ).toThrow();
  });
});
