import { FoodNutrition } from './food';

export interface DailyFoodEntry extends FoodNutrition {
  id: string;
  foodId: string;
  foodName: string;
  amountGrams: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyLog {
  date: string;
  entries: DailyFoodEntry[];
  updatedAt: Date;
}
