export interface FoodNutrition {
  carbohydratesGramsPer100g: number;
  fatGramsPer100g: number;
  proteinGramsPer100g: number;
  saltGramsPer100g?: number;
}

export interface Food extends FoodNutrition {
  id: string;
  name: string;
  normalizedName: string;
  createdAt: Date;
  updatedAt: Date;
}
