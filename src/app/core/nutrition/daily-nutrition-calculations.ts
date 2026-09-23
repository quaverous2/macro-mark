import { DailyFoodEntry, DailyLog } from '../domain/daily-log';
import { Food, FoodNutrition } from '../domain/food';
import { calculateCaloriesPer100g } from './nutrition-calculations';

export interface NutritionTotals extends Required<FoodNutrition> {
  calories: number;
}

export function createDailyFoodEntry(food: Food, now = new Date()): DailyFoodEntry {
  return {
    id: crypto.randomUUID(),
    foodId: food.id,
    foodName: food.name,
    amountGrams: 0,
    carbohydratesGramsPer100g: food.carbohydratesGramsPer100g,
    fatGramsPer100g: food.fatGramsPer100g,
    proteinGramsPer100g: food.proteinGramsPer100g,
    ...(food.saltGramsPer100g === undefined ? {} : { saltGramsPer100g: food.saltGramsPer100g }),
    createdAt: now,
    updatedAt: now,
  };
}

export function calculateEntryNutrition(entry: DailyFoodEntry): NutritionTotals {
  const multiplier = entry.amountGrams / 100;
  const carbohydratesGramsPer100g = entry.carbohydratesGramsPer100g * multiplier;
  const fatGramsPer100g = entry.fatGramsPer100g * multiplier;
  const proteinGramsPer100g = entry.proteinGramsPer100g * multiplier;
  const saltGramsPer100g = (entry.saltGramsPer100g ?? 0) * multiplier;

  return {
    carbohydratesGramsPer100g,
    fatGramsPer100g,
    proteinGramsPer100g,
    saltGramsPer100g,
    calories: calculateCaloriesPer100g({
      carbohydratesGramsPer100g,
      fatGramsPer100g,
      proteinGramsPer100g,
    }),
  };
}

export function calculateDailyTotals(entries: DailyFoodEntry[]): NutritionTotals {
  return entries.reduce<NutritionTotals>(
    (totals, entry) => {
      const nutrition = calculateEntryNutrition(entry);
      return {
        carbohydratesGramsPer100g: totals.carbohydratesGramsPer100g + nutrition.carbohydratesGramsPer100g,
        fatGramsPer100g: totals.fatGramsPer100g + nutrition.fatGramsPer100g,
        proteinGramsPer100g: totals.proteinGramsPer100g + nutrition.proteinGramsPer100g,
        saltGramsPer100g: totals.saltGramsPer100g + nutrition.saltGramsPer100g,
        calories: totals.calories + nutrition.calories,
      };
    },
    {
      carbohydratesGramsPer100g: 0,
      fatGramsPer100g: 0,
      proteinGramsPer100g: 0,
      saltGramsPer100g: 0,
      calories: 0,
    },
  );
}

export function hasConsumedEntries(log: DailyLog): boolean {
  return log.entries.some((entry) => entry.amountGrams > 0);
}
