import { describe, expect, it } from 'vitest';
import { DailyFoodEntry, DailyLog } from '../domain/daily-log';
import { Food } from '../domain/food';
import {
  calculateDailyTotals,
  calculateEntryNutrition,
  createDailyFoodEntry,
  hasConsumedEntries,
} from './daily-nutrition-calculations';

const food: Food = {
  id: 'af3761f6-97a1-4c61-a7b1-3c58579a91b6',
  name: 'Gallette',
  normalizedName: 'gallette',
  carbohydratesGramsPer100g: 84,
  fatGramsPer100g: 1.3,
  proteinGramsPer100g: 8.2,
  createdAt: new Date('2026-09-23T00:00:00.000Z'),
  updatedAt: new Date('2026-09-23T00:00:00.000Z'),
};

describe('daily nutrition calculations', () => {
  it('scales nutrition and calories by the consumed grams', () => {
    const entry = { ...createDailyFoodEntry(food), amountGrams: 80 };

    const nutrition = calculateEntryNutrition(entry);
    expect(nutrition.carbohydratesGramsPer100g).toBeCloseTo(67.2);
    expect(nutrition.fatGramsPer100g).toBeCloseTo(1.04);
    expect(nutrition.proteinGramsPer100g).toBeCloseTo(6.56);
    expect(nutrition.calories).toBeCloseTo(304.4);
  });

  it('adds the scaled nutrition of all daily entries', () => {
    const first: DailyFoodEntry = { ...createDailyFoodEntry(food), amountGrams: 100 };
    const second: DailyFoodEntry = { ...createDailyFoodEntry(food), amountGrams: 50 };

    const totals = calculateDailyTotals([first, second]);
    expect(totals.carbohydratesGramsPer100g).toBeCloseTo(126);
    expect(totals.fatGramsPer100g).toBeCloseTo(1.95);
    expect(totals.proteinGramsPer100g).toBeCloseTo(12.3);
    expect(totals.calories).toBeCloseTo(570.75);
  });

  it('copies the food nutrition into an immutable entry snapshot', () => {
    const sourceFood = { ...food };
    const entry = createDailyFoodEntry(sourceFood);
    sourceFood.name = 'Changed food';
    sourceFood.carbohydratesGramsPer100g = 1;

    expect(entry.foodName).toBe('Gallette');
    expect(entry.carbohydratesGramsPer100g).toBe(84);
  });

  it('only treats a day as completed when it contains a positive amount', () => {
    const log: DailyLog = {
      date: '2026-09-22',
      entries: [{ ...createDailyFoodEntry(food), amountGrams: 0 }],
      updatedAt: new Date(),
    };

    expect(hasConsumedEntries(log)).toBe(false);
    expect(hasConsumedEntries({ ...log, entries: [{ ...log.entries[0], amountGrams: 1 }] })).toBe(true);
  });
});
