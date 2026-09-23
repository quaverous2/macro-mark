import { FoodNutrition } from '../domain/food';

export function calculateCaloriesPer100g(nutrition: FoodNutrition): number {
  return (
    nutrition.carbohydratesGramsPer100g * 4 +
    nutrition.proteinGramsPer100g * 4 +
    nutrition.fatGramsPer100g * 9
  );
}

export function formatNutritionValue(value: number): string {
  return new Intl.NumberFormat('en-CH', {
    maximumFractionDigits: 1,
  }).format(value);
}
